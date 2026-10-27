CREATE OR REPLACE FUNCTION public.tsla_arcade_leaderboard(p_game text) RETURNS TABLE(user_id bigint, first_name text, username text, photo_url text, best integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT u.id, u.first_name, u.username, u.photo_url, max(r.score)::int AS best
  FROM tsla_arcade_rounds r JOIN tsla_tg_users u ON u.id=r.user_id
  WHERE r.game=p_game AND r.status<>'playing' AND r.score>0
  GROUP BY u.id ORDER BY best DESC, u.id LIMIT 10 $$;
REVOKE ALL ON FUNCTION public.tsla_arcade_leaderboard(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tsla_arcade_leaderboard(text) TO service_role;