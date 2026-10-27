ALTER TABLE public.tsla_tg_users ADD COLUMN IF NOT EXISTS stars_balance integer NOT NULL DEFAULT 0 CHECK (stars_balance >= 0);

CREATE TABLE public.tsla_cases (
  id text PRIMARY KEY, name text NOT NULL, price_stars integer NOT NULL CHECK (price_stars > 0),
  image_url text, sort integer NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_cases TO service_role;
ALTER TABLE public.tsla_cases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_case_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL REFERENCES public.tsla_cases(id) ON DELETE CASCADE,
  name text NOT NULL, kind text NOT NULL CHECK (kind IN ('regular','nft')),
  telegram_gift_id text, image_url text, animation_url text,
  value_stars integer NOT NULL CHECK (value_stars >= 0), weight integer NOT NULL CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_case_items TO service_role;
ALTER TABLE public.tsla_case_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX tsla_case_items_case ON public.tsla_case_items(case_id);

CREATE TABLE public.tsla_user_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id),
  item_id uuid REFERENCES public.tsla_case_items(id) ON DELETE SET NULL,
  name text NOT NULL, kind text NOT NULL, telegram_gift_id text, image_url text, animation_url text,
  value_stars integer NOT NULL, status text NOT NULL DEFAULT 'owned' CHECK (status IN ('owned','sold','sending','sent','pending_manual','failed')),
  error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_user_gifts TO service_role;
ALTER TABLE public.tsla_user_gifts ENABLE ROW LEVEL SECURITY;
CREATE INDEX tsla_user_gifts_user ON public.tsla_user_gifts(user_id, created_at DESC);

CREATE TABLE public.tsla_case_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id),
  case_id text NOT NULL REFERENCES public.tsla_cases(id), price_stars integer NOT NULL,
  pay_method text NOT NULL CHECK (pay_method IN ('stars','balance')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','opened','expired')),
  charge_id text UNIQUE, gift_id uuid REFERENCES public.tsla_user_gifts(id),
  created_at timestamptz NOT NULL DEFAULT now(), opened_at timestamptz
);
GRANT ALL ON public.tsla_case_openings TO service_role;
ALTER TABLE public.tsla_case_openings ENABLE ROW LEVEL SECURITY;
CREATE INDEX tsla_case_openings_user ON public.tsla_case_openings(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tsla_award_opening(p_opening uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o tsla_case_openings; it tsla_case_items; total integer; pick integer; g uuid;
BEGIN
  SELECT * INTO o FROM tsla_case_openings WHERE id=p_opening FOR UPDATE;
  IF o.status='opened' THEN RETURN o.gift_id; END IF;
  SELECT sum(weight) INTO total FROM tsla_case_items WHERE case_id=o.case_id;
  IF coalesce(total,0)=0 THEN RAISE EXCEPTION 'Case has no items'; END IF;
  pick := floor(random()*total)::int;
  FOR it IN SELECT * FROM tsla_case_items WHERE case_id=o.case_id ORDER BY id LOOP
    pick := pick - it.weight;
    EXIT WHEN pick < 0;
  END LOOP;
  INSERT INTO tsla_user_gifts(user_id,item_id,name,kind,telegram_gift_id,image_url,animation_url,value_stars)
  VALUES(o.user_id,it.id,it.name,it.kind,it.telegram_gift_id,it.image_url,it.animation_url,it.value_stars) RETURNING id INTO g;
  UPDATE tsla_case_openings SET status='opened',gift_id=g,opened_at=now() WHERE id=o.id;
  RETURN g;
END $$;
REVOKE ALL ON FUNCTION public.tsla_award_opening(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_award_opening(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.tsla_settle_stars_opening(p_opening uuid, p_user bigint, p_amount integer, p_charge text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o tsla_case_openings;
BEGIN
  SELECT * INTO o FROM tsla_case_openings WHERE id=p_opening FOR UPDATE;
  IF NOT FOUND OR o.user_id<>p_user OR o.price_stars<>p_amount OR o.pay_method<>'stars' THEN RAISE EXCEPTION 'Opening mismatch'; END IF;
  IF o.status='opened' THEN RETURN o.gift_id; END IF;
  UPDATE tsla_case_openings SET charge_id=p_charge WHERE id=p_opening;
  RETURN tsla_award_opening(p_opening);
END $$;
REVOKE ALL ON FUNCTION public.tsla_settle_stars_opening(uuid,bigint,integer,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_settle_stars_opening(uuid,bigint,integer,text) TO service_role;

CREATE OR REPLACE FUNCTION public.tsla_open_with_balance(p_user bigint, p_case text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c tsla_cases; o uuid;
BEGIN
  SELECT * INTO c FROM tsla_cases WHERE id=p_case AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not available'; END IF;
  UPDATE tsla_tg_users SET stars_balance=stars_balance-c.price_stars WHERE id=p_user AND stars_balance>=c.price_stars;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough Stars balance'; END IF;
  INSERT INTO tsla_case_openings(user_id,case_id,price_stars,pay_method) VALUES(p_user,p_case,c.price_stars,'balance') RETURNING id INTO o;
  PERFORM tsla_award_opening(o);
  RETURN o;
END $$;
REVOKE ALL ON FUNCTION public.tsla_open_with_balance(bigint,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_open_with_balance(bigint,text) TO service_role;

CREATE OR REPLACE FUNCTION public.tsla_sell_gift(p_user bigint, p_gift uuid, p_percent integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g tsla_user_gifts; credit integer; bal integer;
BEGIN
  SELECT * INTO g FROM tsla_user_gifts WHERE id=p_gift AND user_id=p_user FOR UPDATE;
  IF NOT FOUND OR g.status NOT IN ('owned','failed') THEN RAISE EXCEPTION 'Gift not available'; END IF;
  credit := floor(g.value_stars * p_percent / 100.0)::int;
  UPDATE tsla_user_gifts SET status='sold',updated_at=now() WHERE id=p_gift;
  UPDATE tsla_tg_users SET stars_balance=stars_balance+credit WHERE id=p_user RETURNING stars_balance INTO bal;
  RETURN bal;
END $$;
REVOKE ALL ON FUNCTION public.tsla_sell_gift(bigint,uuid,integer) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_sell_gift(bigint,uuid,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.tsla_reserve_gift_send(p_user bigint, p_gift uuid) RETURNS public.tsla_user_gifts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE g tsla_user_gifts;
BEGIN
  UPDATE tsla_user_gifts SET status=CASE WHEN kind='nft' THEN 'pending_manual' ELSE 'sending' END, updated_at=now(), error=NULL
  WHERE id=p_gift AND user_id=p_user AND status IN ('owned','failed') RETURNING * INTO g;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gift not available'; END IF;
  RETURN g;
END $$;
REVOKE ALL ON FUNCTION public.tsla_reserve_gift_send(bigint,uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_reserve_gift_send(bigint,uuid) TO service_role;

CREATE TABLE public.tsla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL DEFAULT '',
  kind text NOT NULL CHECK (kind IN ('subscribe','gram')), link text, chat_id text,
  entry_gram numeric NOT NULL DEFAULT 0, prize text NOT NULL, image_url text,
  ends_at timestamptz NOT NULL, active boolean NOT NULL DEFAULT true, winner_user_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_events TO service_role;
ALTER TABLE public.tsla_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_event_entries (
  event_id uuid NOT NULL REFERENCES public.tsla_events(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified')),
  tx_hash text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT ALL ON public.tsla_event_entries TO service_role;
ALTER TABLE public.tsla_event_entries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.tsla_cases (id,name,price_stars,sort) VALUES
 ('starter','Starter Box',25,1),('classic','Classic Box',75,2),('premium','Premium Box',250,3);

INSERT INTO public.tsla_case_items (case_id,name,kind,telegram_gift_id,value_stars,weight) VALUES
 ('starter','Heart','regular','5170145012310081615',15,400),
 ('starter','Teddy Bear','regular','5170233102089322756',15,400),
 ('starter','Rose','regular','5168103777563050263',25,120),
 ('starter','Gift Box','regular','5170250947678437525',25,50),
 ('starter','Rocket','regular','5170564780938756245',50,25),
 ('starter','Diamond','regular','5170521118301225164',100,5),
 ('classic','Rose','regular','5168103777563050263',25,450),
 ('classic','Cake','regular','5170144170496491616',50,300),
 ('classic','Bouquet','regular','5170314324215857265',50,150),
 ('classic','Trophy','regular','5168043875654172773',100,80),
 ('classic','Ring','regular','5170690322832818290',100,19),
 ('premium','Trophy','regular','5168043875654172773',100,500),
 ('premium','Diamond','regular','5170521118301225164',100,300),
 ('premium','Champagne','regular','6028601630662853006',50,100);

INSERT INTO public.tsla_case_items (case_id,name,kind,image_url,animation_url,value_stars,weight) VALUES
 ('classic','Lol Pop','nft','https://nft.fragment.com/gift/lolpop-1.webp','https://nft.fragment.com/gift/lolpop-1.lottie.json',300,1),
 ('premium','Desk Calendar','nft','https://nft.fragment.com/gift/deskcalendar-1.webp','https://nft.fragment.com/gift/deskcalendar-1.lottie.json',400,70),
 ('premium','Lol Pop','nft','https://nft.fragment.com/gift/lolpop-1.webp','https://nft.fragment.com/gift/lolpop-1.lottie.json',300,25),
 ('premium','Jelly Bunny','nft','https://nft.fragment.com/gift/jellybunny-1.webp','https://nft.fragment.com/gift/jellybunny-1.lottie.json',1500,5);