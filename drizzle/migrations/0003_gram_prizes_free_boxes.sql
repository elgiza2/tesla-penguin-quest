ALTER TABLE public.tsla_tg_users ADD COLUMN IF NOT EXISTS gram_balance numeric NOT NULL DEFAULT 0;

ALTER TABLE public.tsla_cases DROP CONSTRAINT IF EXISTS tsla_cases_price_stars_check;
ALTER TABLE public.tsla_cases ADD CONSTRAINT tsla_cases_price_stars_check CHECK (price_stars >= 0);
ALTER TABLE public.tsla_cases ADD COLUMN IF NOT EXISTS free_kind text;
ALTER TABLE public.tsla_cases ADD CONSTRAINT tsla_cases_free_kind_check CHECK (free_kind IS NULL OR free_kind IN ('daily','tasks','friends'));

ALTER TABLE public.tsla_case_items DROP CONSTRAINT IF EXISTS tsla_case_items_kind_check;
ALTER TABLE public.tsla_case_items ADD CONSTRAINT tsla_case_items_kind_check CHECK (kind IN ('regular','nft','gram','loss'));
ALTER TABLE public.tsla_case_items ADD COLUMN IF NOT EXISTS gram_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.tsla_user_gifts ADD COLUMN IF NOT EXISTS gram_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tsla_user_gifts DROP CONSTRAINT IF EXISTS tsla_user_gifts_status_check;
ALTER TABLE public.tsla_user_gifts ADD CONSTRAINT tsla_user_gifts_status_check CHECK (status IN ('owned','sold','sending','sent','pending_manual','failed','credited','lost'));

ALTER TABLE public.tsla_case_openings DROP CONSTRAINT IF EXISTS tsla_case_openings_pay_method_check;
ALTER TABLE public.tsla_case_openings ADD CONSTRAINT tsla_case_openings_pay_method_check CHECK (pay_method IN ('stars','balance','gram','gram_balance','free'));

CREATE TABLE IF NOT EXISTS public.tsla_free_claims (
  user_id bigint NOT NULL,
  kind text NOT NULL,
  period text NOT NULL,
  opening_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, period)
);
GRANT ALL ON public.tsla_free_claims TO service_role;
ALTER TABLE public.tsla_free_claims ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tsla_star_rewards (
  user_id bigint NOT NULL,
  source text NOT NULL,
  source_key text NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, source, source_key)
);
GRANT ALL ON public.tsla_star_rewards TO service_role;
ALTER TABLE public.tsla_star_rewards ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tsla_award_opening(p_opening uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o tsla_case_openings; it tsla_case_items; total integer; pick integer; g uuid; st text := 'owned';
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
  IF it.kind='gram' THEN
    UPDATE tsla_tg_users SET gram_balance=gram_balance+it.gram_amount WHERE id=o.user_id;
    st := 'credited';
  ELSIF it.kind='loss' THEN
    st := 'lost';
  END IF;
  INSERT INTO tsla_user_gifts(user_id,item_id,name,kind,telegram_gift_id,image_url,animation_url,value_stars,gram_amount,status)
  VALUES(o.user_id,it.id,it.name,it.kind,it.telegram_gift_id,it.image_url,it.animation_url,it.value_stars,it.gram_amount,st) RETURNING id INTO g;
  UPDATE tsla_case_openings SET status='opened',gift_id=g,opened_at=now() WHERE id=o.id;
  RETURN g;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_open_with_balance(p_user bigint, p_case text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c tsla_cases; o uuid;
BEGIN
  SELECT * INTO c FROM tsla_cases WHERE id=p_case AND active AND free_kind IS NULL AND price_stars > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not available'; END IF;
  UPDATE tsla_tg_users SET stars_balance=stars_balance-c.price_stars WHERE id=p_user AND stars_balance>=c.price_stars;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough Stars balance'; END IF;
  INSERT INTO tsla_case_openings(user_id,case_id,price_stars,pay_method) VALUES(p_user,p_case,c.price_stars,'balance') RETURNING id INTO o;
  PERFORM tsla_award_opening(o);
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_open_with_gram_balance(p_user bigint, p_case text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c tsla_cases; o uuid;
BEGIN
  SELECT * INTO c FROM tsla_cases WHERE id=p_case AND active AND free_kind IS NULL AND price_gram > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not available'; END IF;
  UPDATE tsla_tg_users SET gram_balance=gram_balance-c.price_gram WHERE id=p_user AND gram_balance>=c.price_gram;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough GRAM balance'; END IF;
  INSERT INTO tsla_case_openings(user_id,case_id,price_stars,price_gram,pay_method) VALUES(p_user,p_case,c.price_stars,c.price_gram,'gram_balance') RETURNING id INTO o;
  PERFORM tsla_award_opening(o);
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_sell_gift_to(p_user bigint, p_gift uuid, p_percent integer, p_currency text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE g tsla_user_gifts; credit integer; bal numeric;
BEGIN
  IF p_currency NOT IN ('stars','gram') THEN RAISE EXCEPTION 'Unknown currency'; END IF;
  SELECT * INTO g FROM tsla_user_gifts WHERE id=p_gift AND user_id=p_user FOR UPDATE;
  IF NOT FOUND OR g.status NOT IN ('owned','failed') OR g.kind NOT IN ('regular','nft') THEN RAISE EXCEPTION 'Gift not available'; END IF;
  credit := floor(g.value_stars * p_percent / 100.0)::int;
  UPDATE tsla_user_gifts SET status='sold',updated_at=now() WHERE id=p_gift;
  IF p_currency='gram' THEN
    UPDATE tsla_tg_users SET gram_balance=gram_balance+floor(credit*1000/125.0)/1000 WHERE id=p_user RETURNING gram_balance INTO bal;
  ELSE
    UPDATE tsla_tg_users SET stars_balance=stars_balance+credit WHERE id=p_user RETURNING stars_balance INTO bal;
  END IF;
  RETURN bal;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_day_start() RETURNS timestamptz LANGUAGE sql STABLE AS $$
  SELECT date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
$$;

CREATE OR REPLACE FUNCTION public.tsla_free_status(p_user bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE last_daily timestamptz; tasks_today integer; ads_today integer; tasks_claimed boolean; refs integer; friends_used integer;
  invite_claimed integer; ads_claimed boolean;
BEGIN
  SELECT max(created_at) INTO last_daily FROM tsla_free_claims WHERE user_id=p_user AND kind='daily';
  SELECT (SELECT count(*) FROM tsla_task_completions WHERE user_id=p_user AND created_at>=tsla_day_start())
       + (SELECT count(*) FROM tsla_star_rewards WHERE user_id=p_user AND created_at>=tsla_day_start()) INTO tasks_today;
  SELECT count(*) INTO ads_today FROM tsla_ad_views WHERE user_id=p_user AND confirmed_at>=tsla_day_start();
  SELECT EXISTS(SELECT 1 FROM tsla_free_claims WHERE user_id=p_user AND kind='tasks' AND created_at>=tsla_day_start()) INTO tasks_claimed;
  SELECT count(*) INTO refs FROM tsla_tg_users WHERE referred_by=p_user AND id<>p_user;
  SELECT count(*) INTO friends_used FROM tsla_free_claims WHERE user_id=p_user AND kind='friends';
  SELECT count(*) INTO invite_claimed FROM tsla_star_rewards WHERE user_id=p_user AND source='invite';
  SELECT EXISTS(SELECT 1 FROM tsla_star_rewards WHERE user_id=p_user AND source='ads' AND created_at>=tsla_day_start()) INTO ads_claimed;
  RETURN jsonb_build_object(
    'daily_next', CASE WHEN last_daily IS NULL OR last_daily <= now()-interval '24 hours' THEN NULL ELSE last_daily+interval '24 hours' END,
    'tasks_today', tasks_today, 'ads_today', ads_today, 'tasks_claimed', tasks_claimed,
    'refs', refs, 'friends_available', greatest(0, refs/3 - friends_used),
    'invite_unclaimed', greatest(0, refs - invite_claimed), 'ads_claimed', ads_claimed,
    'tomorrow', tsla_day_start()+interval '1 day');
END $$;

CREATE OR REPLACE FUNCTION public.tsla_open_free(p_user bigint, p_case text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c tsla_cases; s jsonb; per text; o uuid; used integer;
BEGIN
  SELECT * INTO c FROM tsla_cases WHERE id=p_case AND active AND free_kind IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Free box not available'; END IF;
  PERFORM 1 FROM tsla_tg_users WHERE id=p_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  s := tsla_free_status(p_user);
  IF c.free_kind='daily' THEN
    IF s->>'daily_next' IS NOT NULL THEN RAISE EXCEPTION 'Your next free box opens later'; END IF;
    per := to_char(now() AT TIME ZONE 'UTC','YYYYMMDDHH24MISSMS');
  ELSIF c.free_kind='tasks' THEN
    IF (s->>'tasks_claimed')::boolean THEN RAISE EXCEPTION 'Already opened today'; END IF;
    IF (s->>'tasks_today')::int < 2 OR (s->>'ads_today')::int < 3 THEN RAISE EXCEPTION 'Complete 2 tasks and watch 3 ads first'; END IF;
    per := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD');
  ELSE
    IF (s->>'friends_available')::int < 1 THEN RAISE EXCEPTION 'Invite 3 friends to unlock this box'; END IF;
    SELECT count(*) INTO used FROM tsla_free_claims WHERE user_id=p_user AND kind='friends';
    per := 'ref' || (used+1);
  END IF;
  INSERT INTO tsla_case_openings(user_id,case_id,price_stars,pay_method) VALUES(p_user,c.id,0,'free') RETURNING id INTO o;
  INSERT INTO tsla_free_claims(user_id,kind,period,opening_id) VALUES(p_user,c.free_kind,per,o);
  PERFORM tsla_award_opening(o);
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_claim_star_reward(p_user bigint, p_source text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s jsonb; n integer; claimed integer; credit integer := 0; bal integer;
BEGIN
  PERFORM 1 FROM tsla_tg_users WHERE id=p_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  s := tsla_free_status(p_user);
  IF p_source='invite' THEN
    n := (s->>'invite_unclaimed')::int;
    IF n < 1 THEN RAISE EXCEPTION 'Invite a friend first'; END IF;
    SELECT count(*) INTO claimed FROM tsla_star_rewards WHERE user_id=p_user AND source='invite';
    INSERT INTO tsla_star_rewards(user_id,source,source_key,amount)
      SELECT p_user,'invite','ref'||k,2 FROM generate_series(claimed+1, claimed+n) k;
    credit := 2*n;
  ELSIF p_source='ads' THEN
    IF (s->>'ads_claimed')::boolean THEN RAISE EXCEPTION 'Already claimed today'; END IF;
    IF (s->>'ads_today')::int < 3 THEN RAISE EXCEPTION 'Watch 3 ads first'; END IF;
    INSERT INTO tsla_star_rewards(user_id,source,source_key,amount) VALUES(p_user,'ads',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD'),2);
    credit := 2;
  ELSE
    RAISE EXCEPTION 'Unknown task';
  END IF;
  UPDATE tsla_tg_users SET stars_balance=stars_balance+credit WHERE id=p_user RETURNING stars_balance INTO bal;
  RETURN bal;
END $$;

CREATE OR REPLACE FUNCTION public.tsla_credit_stars(p_user bigint, p_amount integer)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE tsla_tg_users SET stars_balance=stars_balance+p_amount WHERE id=p_user RETURNING stars_balance
$$;

REVOKE ALL ON FUNCTION public.tsla_award_opening(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_open_with_balance(bigint,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_open_with_gram_balance(bigint,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_sell_gift_to(bigint,uuid,integer,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_free_status(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_open_free(bigint,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_claim_star_reward(bigint,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tsla_credit_stars(bigint,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tsla_award_opening(uuid), public.tsla_open_with_balance(bigint,text), public.tsla_open_with_gram_balance(bigint,text),
  public.tsla_sell_gift_to(bigint,uuid,integer,text), public.tsla_free_status(bigint), public.tsla_open_free(bigint,text),
  public.tsla_claim_star_reward(bigint,text), public.tsla_credit_stars(bigint,integer), public.tsla_day_start() TO service_role;