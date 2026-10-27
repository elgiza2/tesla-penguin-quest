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