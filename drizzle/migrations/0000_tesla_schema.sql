CREATE TABLE public.tsla_tg_users (
  id bigint PRIMARY KEY, username text, first_name text, photo_url text, language_code text,
  balance numeric NOT NULL DEFAULT 0, power_level int NOT NULL DEFAULT 0, mining_started_at timestamptz,
  wallet_address text, referred_by bigint, subscribed_until timestamptz,
  mining_rate_daily numeric NOT NULL DEFAULT 0.1, mining_pending numeric NOT NULL DEFAULT 0, mining_settled_at timestamptz,
  wallet_verified boolean NOT NULL DEFAULT false, wallet_nonce text, referral_earned numeric NOT NULL DEFAULT 0,
  referral_rate numeric NOT NULL DEFAULT 0.10, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_tg_users TO service_role;
ALTER TABLE public.tsla_tg_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_task_apps(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL UNIQUE,image text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_task_apps TO service_role;
ALTER TABLE public.tsla_task_apps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, image_url text, link text NOT NULL,
  reward numeric NOT NULL DEFAULT 10, active boolean NOT NULL DEFAULT true, sort int NOT NULL DEFAULT 0,
  title_i18n jsonb NOT NULL DEFAULT '{}'::jsonb, kind text NOT NULL DEFAULT 'link', chat_id text,
  app_name text, app_image text, app_id uuid REFERENCES public.tsla_task_apps(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_tasks TO service_role;
ALTER TABLE public.tsla_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_task_completions (
  user_id bigint NOT NULL, task_id uuid NOT NULL REFERENCES public.tsla_tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, task_id)
);
GRANT ALL ON public.tsla_task_completions TO service_role;
ALTER TABLE public.tsla_task_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id bigint NOT NULL, amount numeric NOT NULL, to_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending', tx_hash text, fee_tx text, broadcast_boc text, broadcast_seqno bigint, broadcast_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tsla_withdrawals TO service_role;
ALTER TABLE public.tsla_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX tsla_withdrawals_fee_unique ON public.tsla_withdrawals(fee_tx) WHERE fee_tx IS NOT NULL;

CREATE TABLE public.tsla_nfts (
  id uuid primary key default gen_random_uuid(), user_id bigint not null, item_index integer, nft_address text,
  price_gram numeric not null default 0, tier int NOT NULL DEFAULT 1, mint_status text NOT NULL DEFAULT 'pending', tx_hash text,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.tsla_nfts TO service_role;
ALTER TABLE public.tsla_nfts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX tsla_nfts_tx_hash_key ON public.tsla_nfts(tx_hash) WHERE tx_hash IS NOT NULL;

CREATE TABLE public.tsla_market_snapshots (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_market_snapshots TO service_role;
ALTER TABLE public.tsla_market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_bot_campaigns(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),messages jsonb NOT NULL,status text NOT NULL DEFAULT 'queued',last_user_id bigint NOT NULL DEFAULT 0,max_user_id bigint NOT NULL,sent integer NOT NULL DEFAULT 0,failed integer NOT NULL DEFAULT 0,lease_until timestamptz,lease_token uuid,pause_reason text,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_bot_campaigns TO service_role;
ALTER TABLE public.tsla_bot_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tsla_payout_lock(id integer PRIMARY KEY CHECK(id=1),token uuid,expires_at timestamptz);
GRANT ALL ON public.tsla_payout_lock TO service_role;
ALTER TABLE public.tsla_payout_lock ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.tesla_sync_power(p_user_id bigint, p_level integer, p_rate numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u public.tsla_tg_users; ts timestamptz:=now(); elapsed numeric; BEGIN SELECT * INTO u FROM public.tsla_tg_users WHERE id=p_user_id FOR UPDATE; IF u.mining_started_at IS NOT NULL THEN elapsed:=greatest(0,extract(epoch from (least(ts,u.mining_started_at+interval '2 hours')-coalesce(u.mining_settled_at,u.mining_started_at)))); UPDATE public.tsla_tg_users SET mining_pending=mining_pending+elapsed/86400*mining_rate_daily, mining_settled_at=ts, power_level=p_level, mining_rate_daily=p_rate WHERE id=p_user_id; ELSE UPDATE public.tsla_tg_users SET power_level=p_level,mining_rate_daily=p_rate WHERE id=p_user_id; END IF; END $$;
REVOKE ALL ON FUNCTION public.tesla_sync_power(bigint,integer,numeric) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tesla_sync_power(bigint,integer,numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.tesla_refund_withdrawal(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE w public.tsla_withdrawals; BEGIN SELECT * INTO w FROM public.tsla_withdrawals WHERE id=p_id FOR UPDATE; IF w.status='pending' THEN UPDATE public.tsla_tg_users SET balance=balance+w.amount WHERE id=w.user_id; UPDATE public.tsla_withdrawals SET status='failed' WHERE id=p_id; END IF; END $$;
REVOKE ALL ON FUNCTION public.tesla_refund_withdrawal(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tesla_refund_withdrawal(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.tesla_campaign_lock(p_id uuid,p_token uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ WITH claimed AS (UPDATE public.tsla_bot_campaigns SET lease_token=p_token,lease_until=now()+interval '60 seconds' WHERE id=p_id AND status='queued' AND (lease_until IS NULL OR lease_until<now()) RETURNING id) SELECT EXISTS(SELECT 1 FROM claimed) $$;
REVOKE ALL ON FUNCTION public.tesla_campaign_lock(uuid,uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tesla_campaign_lock(uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.tesla_payout_lock(p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.tsla_payout_lock(id) VALUES(1) ON CONFLICT DO NOTHING; UPDATE public.tsla_payout_lock SET token=p_token,expires_at=now()+interval '2 minutes' WHERE id=1 AND (expires_at IS NULL OR expires_at<now()); RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.tesla_payout_lock(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tesla_payout_lock(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.tesla_reserve_withdrawal(p_user_id bigint,p_amount numeric,p_fee text,p_address text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u public.tsla_tg_users; w uuid; BEGIN SELECT * INTO u FROM public.tsla_tg_users WHERE id=p_user_id FOR UPDATE; IF p_amount<100 THEN RAISE EXCEPTION 'Minimum is 100 TSLA'; END IF; IF NOT coalesce(u.wallet_verified,false) OR u.wallet_address IS DISTINCT FROM p_address THEN RAISE EXCEPTION 'Verify wallet ownership first'; END IF; IF EXISTS(SELECT 1 FROM public.tsla_withdrawals WHERE user_id=p_user_id AND status IN ('pending','submitted')) THEN RAISE EXCEPTION 'Earlier withdrawal still pending'; END IF; IF u.balance<p_amount THEN RAISE EXCEPTION 'Not enough TSLA'; END IF; UPDATE public.tsla_tg_users SET balance=balance-p_amount WHERE id=p_user_id; INSERT INTO public.tsla_withdrawals(user_id,amount,to_address,fee_tx,status) VALUES(p_user_id,p_amount,p_address,p_fee,'pending') RETURNING id INTO w; RETURN w; END $$;
REVOKE ALL ON FUNCTION public.tesla_reserve_withdrawal(bigint,numeric,text,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tesla_reserve_withdrawal(bigint,numeric,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.tesla_mining_claim(p_user_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE u public.tsla_tg_users; r public.tsla_tg_users; elapsed numeric; reward numeric; ts timestamptz := now(); BEGIN SELECT * INTO u FROM public.tsla_tg_users WHERE id=p_user_id FOR UPDATE; IF u.mining_started_at IS NULL THEN RAISE EXCEPTION 'Not mining'; END IF; IF ts < u.mining_started_at + interval '2 hours' THEN RAISE EXCEPTION 'Mining not finished'; END IF; elapsed := greatest(0, extract(epoch from (least(ts,u.mining_started_at + interval '2 hours') - coalesce(u.mining_settled_at,u.mining_started_at)))); reward := u.mining_pending + elapsed / 86400 * u.mining_rate_daily; UPDATE public.tsla_tg_users SET balance=balance+reward, mining_started_at=ts, mining_settled_at=ts, mining_pending=0 WHERE id=p_user_id; IF u.referred_by IS NOT NULL AND u.referred_by<>p_user_id THEN SELECT * INTO r FROM public.tsla_tg_users WHERE id=u.referred_by; UPDATE public.tsla_tg_users SET balance=balance+reward*coalesce(r.referral_rate,0.10), referral_earned=referral_earned+reward*coalesce(r.referral_rate,0.10) WHERE id=u.referred_by; END IF; RETURN jsonb_build_object('balance',u.balance+reward,'mining_started_at',ts); END $function$;
REVOKE ALL ON FUNCTION public.tesla_mining_claim(bigint) FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.tesla_mining_claim(bigint) TO service_role;
ALTER TABLE public.tsla_task_apps ADD COLUMN category text NOT NULL DEFAULT 'ours' CHECK (category IN ('ours','partners','others'));
ALTER TABLE public.tsla_tasks ADD COLUMN app_category text NOT NULL DEFAULT 'ours' CHECK (app_category IN ('ours','partners','others'));
ALTER TABLE public.tsla_withdrawals ADD COLUMN IF NOT EXISTS fee_tsla numeric NOT NULL DEFAULT 0;

ALTER TABLE public.tsla_tg_users ADD COLUMN IF NOT EXISTS starter_credit_applied boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.tsla_starter_credit() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NOT NEW.starter_credit_applied THEN NEW.balance:=NEW.balance+2000; NEW.starter_credit_applied:=true; END IF; RETURN NEW; END $$;
CREATE TRIGGER tsla_starter_credit_before_insert BEFORE INSERT ON public.tsla_tg_users FOR EACH ROW EXECUTE FUNCTION public.tsla_starter_credit();

CREATE TABLE public.tsla_game_spins(user_id bigint PRIMARY KEY,last_spun_at timestamptz,reward numeric NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_game_spins TO service_role;
ALTER TABLE public.tsla_game_spins ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.tesla_spin_daily(p_user_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s public.tsla_game_spins; prize integer; bal numeric; BEGIN PERFORM id FROM public.tsla_tg_users WHERE id=p_user_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF; INSERT INTO public.tsla_game_spins(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING; SELECT * INTO s FROM public.tsla_game_spins WHERE user_id=p_user_id FOR UPDATE; IF s.last_spun_at IS NOT NULL AND s.last_spun_at>now()-interval '24 hours' THEN RAISE EXCEPTION 'Come back after 24 hours'; END IF; prize:=(ARRAY[25,50,75,100,150,200])[1+floor(random()*6)::int]; UPDATE public.tsla_tg_users SET balance=balance+prize WHERE id=p_user_id RETURNING balance INTO bal; UPDATE public.tsla_game_spins SET last_spun_at=now(),reward=prize,updated_at=now() WHERE user_id=p_user_id; RETURN jsonb_build_object('reward',prize,'balance',bal,'nextSpinAt',now()+interval '24 hours'); END $$;
REVOKE ALL ON FUNCTION public.tesla_spin_daily(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tesla_spin_daily(bigint) TO service_role;

ALTER TABLE public.tsla_tg_users ADD COLUMN IF NOT EXISTS referral_signup_paid boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS referral_wallet_paid boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS referral_mining_paid boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS mining_claim_count integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.tesla_referral_stages() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE bonus integer:=0; BEGIN IF TG_OP='UPDATE' AND OLD.mining_started_at IS NOT NULL AND NEW.mining_started_at IS DISTINCT FROM OLD.mining_started_at THEN NEW.mining_claim_count:=OLD.mining_claim_count+1; END IF; IF NEW.referred_by IS NULL OR NEW.referred_by=NEW.id THEN RETURN NEW; END IF; IF NOT NEW.referral_signup_paid THEN bonus:=bonus+5; NEW.referral_signup_paid:=true; END IF; IF NEW.wallet_verified AND NOT NEW.referral_wallet_paid THEN bonus:=bonus+10; NEW.referral_wallet_paid:=true; END IF; IF NEW.mining_claim_count>=2 AND NOT NEW.referral_mining_paid THEN bonus:=bonus+10; NEW.referral_mining_paid:=true; END IF; IF bonus>0 THEN UPDATE public.tsla_tg_users SET balance=balance+bonus,referral_earned=referral_earned+bonus WHERE id=NEW.referred_by; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.tesla_referral_stages() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tesla_referral_stages BEFORE INSERT OR UPDATE OF wallet_verified,mining_started_at ON public.tsla_tg_users FOR EACH ROW EXECUTE FUNCTION public.tesla_referral_stages();

CREATE TABLE public.tsla_ad_views(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id bigint NOT NULL,zone_id text NOT NULL DEFAULT '11951290',confirmed_at timestamptz,consumed_by uuid,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_ad_views TO service_role;
ALTER TABLE public.tsla_ad_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX tsla_ad_views_user ON public.tsla_ad_views(user_id);
CREATE OR REPLACE FUNCTION public.tesla_paid_withdrawal(p_user_id bigint,p_amount numeric,p_address text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u public.tsla_tg_users; w uuid; views uuid[]; BEGIN SELECT * INTO u FROM public.tsla_tg_users WHERE id=p_user_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF; IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<100 OR p_amount>1000000000000 THEN RAISE EXCEPTION 'Invalid withdrawal amount'; END IF; IF NOT coalesce(u.wallet_verified,false) OR u.wallet_address IS DISTINCT FROM p_address THEN RAISE EXCEPTION 'Verify wallet ownership first'; END IF; IF EXISTS(SELECT 1 FROM public.tsla_withdrawals WHERE user_id=p_user_id AND status IN ('pending','submitted')) THEN RAISE EXCEPTION 'Earlier withdrawal still pending'; END IF; SELECT array_agg(id) INTO views FROM (SELECT id FROM public.tsla_ad_views WHERE user_id=p_user_id AND confirmed_at IS NOT NULL AND consumed_by IS NULL ORDER BY confirmed_at LIMIT 5 FOR UPDATE) v; IF coalesce(array_length(views,1),0)<5 THEN RAISE EXCEPTION 'Watch 5 confirmed ads before withdrawing'; END IF; IF u.balance<p_amount+1 THEN RAISE EXCEPTION 'Not enough TSLA including fee'; END IF; UPDATE public.tsla_tg_users SET balance=balance-p_amount-1 WHERE id=p_user_id; INSERT INTO public.tsla_withdrawals(user_id,amount,to_address,fee_tsla,status) VALUES(p_user_id,p_amount,p_address,1,'pending') RETURNING id INTO w; UPDATE public.tsla_ad_views SET consumed_by=w WHERE id=ANY(views); RETURN w; END $$;
REVOKE ALL ON FUNCTION public.tesla_paid_withdrawal(bigint,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tesla_paid_withdrawal(bigint,numeric,text) TO service_role;

ALTER TABLE public.tsla_tg_users ADD COLUMN tickets integer NOT NULL DEFAULT 0 CHECK(tickets>=0), ADD COLUMN tickets_daily_at timestamptz;
CREATE TABLE public.tsla_ticket_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id), source text NOT NULL, source_key text NOT NULL, amount integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,source,source_key));
GRANT ALL ON public.tsla_ticket_events TO service_role;
ALTER TABLE public.tsla_ticket_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.tsla_arcade_rounds(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id),game text NOT NULL CHECK(game IN ('crash','mines','higher','memory')),status text NOT NULL DEFAULT 'playing',score integer NOT NULL DEFAULT 0,state jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tsla_arcade_rounds TO service_role;
ALTER TABLE public.tsla_arcade_rounds ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX tsla_one_arcade_round ON public.tsla_arcade_rounds(user_id) WHERE status='playing';
CREATE FUNCTION public.tsla_grant_tickets(p_user bigint,p_source text,p_key text,p_amount integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO tsla_ticket_events(user_id,source,source_key,amount) VALUES(p_user,p_source,p_key,p_amount) ON CONFLICT DO NOTHING; IF FOUND THEN UPDATE tsla_tg_users SET tickets=tickets+p_amount WHERE id=p_user; END IF; END $$;
REVOKE ALL ON FUNCTION public.tsla_grant_tickets(bigint,text,text,integer) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_grant_tickets(bigint,text,text,integer) TO service_role;
CREATE FUNCTION public.tsla_ticket_rewards() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF TG_TABLE_NAME='tsla_task_completions' THEN PERFORM tsla_grant_tickets(NEW.user_id,'task',NEW.task_id::text,2); ELSIF TG_TABLE_NAME='tsla_ad_views' THEN IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN PERFORM tsla_grant_tickets(NEW.user_id,'ad',NEW.id::text,1); END IF; ELSE IF NEW.referred_by IS NOT NULL AND NEW.referred_by<>NEW.id THEN IF TG_OP='INSERT' THEN IF NEW.referral_signup_paid THEN PERFORM tsla_grant_tickets(NEW.referred_by,'ref_signup',NEW.id::text,1); END IF; ELSE IF NOT OLD.referral_signup_paid AND NEW.referral_signup_paid THEN PERFORM tsla_grant_tickets(NEW.referred_by,'ref_signup',NEW.id::text,1); END IF; IF NOT OLD.referral_wallet_paid AND NEW.referral_wallet_paid THEN PERFORM tsla_grant_tickets(NEW.referred_by,'ref_wallet',NEW.id::text,2); END IF; IF NOT OLD.referral_mining_paid AND NEW.referral_mining_paid THEN PERFORM tsla_grant_tickets(NEW.referred_by,'ref_mining',NEW.id::text,3); END IF; END IF; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER tsla_task_ticket_reward AFTER INSERT ON public.tsla_task_completions FOR EACH ROW EXECUTE FUNCTION public.tsla_ticket_rewards();
CREATE TRIGGER tsla_ad_ticket_reward AFTER UPDATE OF confirmed_at ON public.tsla_ad_views FOR EACH ROW EXECUTE FUNCTION public.tsla_ticket_rewards();
CREATE TRIGGER tsla_ref_ticket_reward AFTER INSERT OR UPDATE OF referral_signup_paid,referral_wallet_paid,referral_mining_paid ON public.tsla_tg_users FOR EACH ROW EXECUTE FUNCTION public.tsla_ticket_rewards();
CREATE FUNCTION public.tsla_daily_tickets(p_user bigint) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u tsla_tg_users; BEGIN SELECT * INTO STRICT u FROM tsla_tg_users WHERE id=p_user FOR UPDATE; IF u.tickets_daily_at IS NOT NULL AND u.tickets_daily_at>now()-interval '24 hours' THEN RAISE EXCEPTION 'Next gift in 24 hours'; END IF; PERFORM tsla_grant_tickets(p_user,'daily',now()::text,5); UPDATE tsla_tg_users SET tickets_daily_at=now() WHERE id=p_user RETURNING tickets INTO u.tickets; RETURN u.tickets; END $$;
REVOKE ALL ON FUNCTION public.tsla_daily_tickets(bigint) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_daily_tickets(bigint) TO service_role;
CREATE FUNCTION public.tsla_arcade_start(p_user bigint,p_game text,p_state jsonb) RETURNS public.tsla_arcade_rounds LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r tsla_arcade_rounds; BEGIN PERFORM 1 FROM tsla_tg_users WHERE id=p_user FOR UPDATE; UPDATE tsla_arcade_rounds SET status='expired',updated_at=now() WHERE user_id=p_user AND status='playing' AND created_at<now()-interval '10 minutes'; SELECT * INTO r FROM tsla_arcade_rounds WHERE user_id=p_user AND status='playing'; IF FOUND THEN RETURN r; END IF; UPDATE tsla_tg_users SET tickets=tickets-1 WHERE id=p_user AND tickets>=1; IF NOT FOUND THEN RAISE EXCEPTION 'You need a ticket; claim your daily gift'; END IF; INSERT INTO tsla_arcade_rounds(user_id,game,state) VALUES(p_user,p_game,p_state) RETURNING * INTO r; RETURN r; END $$;
REVOKE ALL ON FUNCTION public.tsla_arcade_start(bigint,text,jsonb) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_arcade_start(bigint,text,jsonb) TO service_role;
CREATE FUNCTION public.tsla_arcade_update(p_user bigint,p_id uuid,p_version timestamptz,p_state jsonb,p_score integer,p_status text) RETURNS public.tsla_arcade_rounds LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r tsla_arcade_rounds; BEGIN UPDATE tsla_arcade_rounds SET state=p_state,score=p_score,status=p_status,updated_at=clock_timestamp() WHERE id=p_id AND user_id=p_user AND status='playing' AND updated_at=p_version RETURNING * INTO r; IF NOT FOUND THEN RAISE EXCEPTION 'Round was updated; try again'; END IF; RETURN r; END $$;
REVOKE ALL ON FUNCTION public.tsla_arcade_update(bigint,uuid,timestamptz,jsonb,integer,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_arcade_update(bigint,uuid,timestamptz,jsonb,integer,text) TO service_role;
REVOKE ALL ON FUNCTION public.tsla_ticket_rewards() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_ticket_rewards() TO service_role;

CREATE TABLE public.tsla_referral_goals (user_id bigint NOT NULL REFERENCES public.tsla_tg_users(id) ON DELETE CASCADE, goal integer NOT NULL, reward numeric NOT NULL, claimed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, goal));
ALTER TABLE public.tsla_referral_goals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tsla_referral_goals FROM anon, authenticated;
GRANT ALL ON public.tsla_referral_goals TO service_role;
CREATE OR REPLACE FUNCTION public.tsla_claim_referral_goal(p_user_id bigint, p_goal integer) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r numeric; n integer;
BEGIN
  r := CASE p_goal WHEN 20 THEN 200 WHEN 40 THEN 400 WHEN 60 THEN 700 WHEN 80 THEN 1000 WHEN 100 THEN 1500 ELSE NULL END;
  IF r IS NULL THEN RAISE EXCEPTION 'Unknown goal'; END IF;
  PERFORM 1 FROM tsla_tg_users WHERE id=p_user_id FOR UPDATE;
  SELECT count(*) INTO n FROM tsla_tg_users WHERE referred_by=p_user_id AND id<>p_user_id;
  IF n < p_goal THEN RAISE EXCEPTION 'Not enough friends yet'; END IF;
  INSERT INTO tsla_referral_goals(user_id,goal,reward) VALUES (p_user_id,p_goal,r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'Already claimed'; END IF;
  UPDATE tsla_tg_users SET balance=balance+r, referral_earned=referral_earned+r WHERE id=p_user_id;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.tsla_claim_referral_goal(bigint,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tsla_claim_referral_goal(bigint,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.tsla_arcade_leaderboard(p_game text) RETURNS TABLE(user_id bigint, first_name text, username text, photo_url text, best integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT u.id, u.first_name, u.username, u.photo_url, max(r.score)::int AS best
  FROM tsla_arcade_rounds r JOIN tsla_tg_users u ON u.id=r.user_id
  WHERE r.game=p_game AND r.status<>'playing' AND r.score>0
  GROUP BY u.id ORDER BY best DESC, u.id LIMIT 10 $$;
REVOKE ALL ON FUNCTION public.tsla_arcade_leaderboard(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tsla_arcade_leaderboard(text) TO service_role;

INSERT INTO public.tsla_tasks (title, link, reward, kind, active, sort, title_i18n, app_category) VALUES
('Share Tesla to your story', 'https://t.me/Noveaibot', 50, 'story', true, 0, '{}'::jsonb, 'ours'),
('Send Tesla to 3 friends', 'https://t.me/Noveaibot', 50, 'share', true, 0, '{}'::jsonb, 'ours');