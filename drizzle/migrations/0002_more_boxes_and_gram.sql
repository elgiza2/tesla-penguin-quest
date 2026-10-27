ALTER TABLE public.tsla_cases ADD COLUMN IF NOT EXISTS price_gram numeric NOT NULL DEFAULT 0;
UPDATE public.tsla_cases SET price_gram = round(price_stars * 0.008, 2);
ALTER TABLE public.tsla_case_openings DROP CONSTRAINT IF EXISTS tsla_case_openings_pay_method_check;
ALTER TABLE public.tsla_case_openings ADD CONSTRAINT tsla_case_openings_pay_method_check CHECK (pay_method IN ('stars','balance','gram'));
ALTER TABLE public.tsla_case_openings ADD COLUMN IF NOT EXISTS price_gram numeric;
ALTER TABLE public.tsla_case_openings ADD COLUMN IF NOT EXISTS tx_hash text UNIQUE;

CREATE OR REPLACE FUNCTION public.tsla_settle_gram_opening(p_opening uuid, p_user bigint, p_tx text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o tsla_case_openings;
BEGIN
  SELECT * INTO o FROM tsla_case_openings WHERE id=p_opening FOR UPDATE;
  IF NOT FOUND OR o.user_id<>p_user OR o.pay_method<>'gram' THEN RAISE EXCEPTION 'Opening mismatch'; END IF;
  IF o.status='opened' THEN RETURN o.gift_id; END IF;
  UPDATE tsla_case_openings SET tx_hash=p_tx WHERE id=p_opening;
  RETURN tsla_award_opening(p_opening);
END $$;
REVOKE ALL ON FUNCTION public.tsla_settle_gram_opening(uuid,bigint,text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.tsla_settle_gram_opening(uuid,bigint,text) TO service_role;

INSERT INTO public.tsla_cases (id,name,price_stars,price_gram,sort) VALUES ('sweet','Sweet Box',50,0.4,4),('winter','Winter Box',150,1.2,5),('magic','Magic Box',400,3.2,6),('party','Party Box',300,2.4,7),('luxury','Luxury Box',1000,8.0,8),('legend','Legend Box',2500,20.0,9);

CREATE TEMP TABLE tmp_items(case_id text, name text, kind text, gift_id text, slug text, value_stars integer, weight integer) ON COMMIT DROP;
INSERT INTO tmp_items VALUES
('sweet','Heart','regular','5170145012310081615',NULL,15,1493),
('sweet','Teddy Bear','regular','5170233102089322756',NULL,15,3000),
('sweet','Cake','regular','5170144170496491616',NULL,50,1500),
('sweet','Rose','regular','5168103777563050263',NULL,25,2000),
('sweet','Candy Cane','nft',NULL,'candycane',300,40),
('sweet','Lol Pop','nft',NULL,'lolpop',300,40),
('sweet','Ginger Cookie','nft',NULL,'gingercookie',350,30),
('sweet','Cookie Heart','nft',NULL,'cookieheart',500,15),
('sweet','Hypno Lollipop','nft',NULL,'hypnolollipop',450,15),
('sweet','Bunny Muffin','nft',NULL,'bunnymuffin',600,5),
('winter','Rose','regular','5168103777563050263',NULL,25,668),
('winter','Cake','regular','5170144170496491616',NULL,50,2500),
('winter','Champagne','regular','6028601630662853006',NULL,50,2000),
('winter','Trophy','regular','5168043875654172773',NULL,100,1200),
('winter','Xmas Stocking','nft',NULL,'xmasstocking',400,150),
('winter','Snow Mittens','nft',NULL,'snowmittens',600,60),
('winter','Winter Wreath','nft',NULL,'winterwreath',500,80),
('winter','Santa Hat','nft',NULL,'santahat',550,70),
('winter','Snow Globe','nft',NULL,'snowglobe',700,40),
('winter','Spiced Wine','nft',NULL,'spicedwine',500,80),
('winter','Hanging Star','nft',NULL,'hangingstar',900,15),
('magic','Bouquet','regular','5170314324215857265',NULL,50,500),
('magic','Trophy','regular','5168043875654172773',NULL,100,3000),
('magic','Diamond','regular','5170521118301225164',NULL,100,2000),
('magic','Witch Hat','nft',NULL,'witchhat',600,400),
('magic','Hex Pot','nft',NULL,'hexpot',900,150),
('magic','Evil Eye','nft',NULL,'evileye',1200,100),
('magic','Jester Hat','nft',NULL,'jesterhat',450,300),
('magic','Love Potion','nft',NULL,'lovepotion',1800,40),
('magic','Magic Potion','nft',NULL,'magicpotion',6000,6),
('magic','Kissed Frog','nft',NULL,'kissedfrog',6000,5),
('party','Rocket','regular','5170564780938756245',NULL,50,570),
('party','Ring','regular','5170690322832818290',NULL,100,2500),
('party','Champagne','regular','6028601630662853006',NULL,50,2000),
('party','Party Sparkler','nft',NULL,'partysparkler',400,400),
('party','Jack-in-the-Box','nft',NULL,'jackinthebox',700,200),
('party','Tama Gadget','nft',NULL,'tamagadget',650,200),
('party','Berry Box','nft',NULL,'berrybox',700,150),
('party','Star Notepad','nft',NULL,'starnotepad',600,200),
('party','Record Player','nft',NULL,'recordplayer',1800,25),
('party','Light Sword','nft',NULL,'lightsword',750,80),
('luxury','Diamond','regular','5170521118301225164',NULL,100,1274),
('luxury','Ring','regular','5170690322832818290',NULL,100,3000),
('luxury','Sakura Flower','nft',NULL,'sakuraflower',1000,600),
('luxury','Jelly Bunny','nft',NULL,'jellybunny',1500,300),
('luxury','Trapped Heart','nft',NULL,'trappedheart',2200,200),
('luxury','Eternal Rose','nft',NULL,'eternalrose',3500,120),
('luxury','Diamond Ring','nft',NULL,'diamondring',3500,120),
('luxury','Signet Ring','nft',NULL,'signetring',5000,40),
('luxury','Swiss Watch','nft',NULL,'swisswatch',5500,30),
('luxury','Vintage Cigar','nft',NULL,'vintagecigar',5000,30),
('luxury','Neko Helmet','nft',NULL,'nekohelmet',4500,40),
('legend','Trophy','regular','5168043875654172773',NULL,100,352104),
('legend','Diamond','regular','5170521118301225164',NULL,100,100000),
('legend','Toy Bear','nft',NULL,'toybear',3500,90000),
('legend','Skull Flower','nft',NULL,'skullflower',2500,60000),
('legend','Genie Lamp','nft',NULL,'genielamp',6000,20000),
('legend','Sharp Tongue','nft',NULL,'sharptongue',6500,15000),
('legend','Scared Cat','nft',NULL,'scaredcat',7000,10000),
('legend','Loot Bag','nft',NULL,'lootbag',15000,4000),
('legend','Ion Gem','nft',NULL,'iongem',12000,3000),
('legend','Mini Oscar','nft',NULL,'minioscar',12000,3000),
('legend','Astral Shard','nft',NULL,'astralshard',20000,1500),
('legend','Precious Peach','nft',NULL,'preciouspeach',50000,300),
('legend','Durov''s Cap','nft',NULL,'durovscap',120000,100),
('legend','Plush Pepe','nft',NULL,'plushpepe',600000,3);

INSERT INTO public.tsla_case_items (case_id,name,kind,telegram_gift_id,image_url,animation_url,value_stars,weight)
SELECT case_id,name,kind,gift_id,
  CASE WHEN slug IS NULL THEN NULL ELSE 'https://nft.fragment.com/gift/'||slug||'-1.webp' END,
  CASE WHEN slug IS NULL THEN NULL ELSE 'https://nft.fragment.com/gift/'||slug||'-1.lottie.json' END,
  value_stars,weight FROM tmp_items;