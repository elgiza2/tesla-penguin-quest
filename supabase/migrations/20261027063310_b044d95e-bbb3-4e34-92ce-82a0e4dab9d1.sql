INSERT INTO public.tsla_tasks (title, link, reward, kind, active, sort, title_i18n, app_category)
SELECT 'Share Tesla to your story', 'https://t.me/sramaibot', 50, 'story', true, 0, '{}'::jsonb, 'ours'
WHERE NOT EXISTS (SELECT 1 FROM public.tsla_tasks WHERE kind = 'story');
INSERT INTO public.tsla_tasks (title, link, reward, kind, active, sort, title_i18n, app_category)
SELECT 'Send Tesla to 3 friends', 'https://t.me/sramaibot', 50, 'share', true, 0, '{}'::jsonb, 'ours'
WHERE NOT EXISTS (SELECT 1 FROM public.tsla_tasks WHERE kind = 'share');