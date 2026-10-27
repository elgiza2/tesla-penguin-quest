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

INSERT INTO public.tsla_tasks (title, link, reward, sort, kind, chat_id) VALUES
('Join Tesla channel', 'https://t.me/c/2616088306', 50, 1, 'channel', '-1002616088306');
INSERT INTO public.tsla_tasks (title, link, reward, sort, kind) VALUES
('Buy TSLA on STON.fi', 'https://app.ston.fi/swap?chartVisible=false&ft=GRAM&tt=EQCY5dx1kTGT-r1RPXA-LTRyv73_LtfcaTl0g1E_WBlRdUyI', 100, 2, 'ston');

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