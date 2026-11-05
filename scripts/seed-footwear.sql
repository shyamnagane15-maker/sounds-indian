-- Verified footwear comparisons from official listed prices (snapshot: October 2026).
-- Run in the Supabase SQL Editor. Safe to re-run: skips brands/products that already exist by name.

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Comet', 'Bengaluru, Karnataka', 'https://www.wearcomet.com',
  'Bengaluru sneaker brand (Grails Marketing) making cushioned lifestyle shoes with a roomier toe box aimed at Indian feet.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Comet');

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Neeman''s', 'Hyderabad, Telangana', 'https://neemans.com',
  'Hyderabad-based brand making casual shoes in India from cotton, merino and recycled materials, sold online and in its own stores.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Neeman''s');

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Campus', 'New Delhi, Delhi', 'https://www.campusshoes.com',
  'Campus Activewear Ltd is a Delhi-based listed sports-footwear company. Shoes are designed and marketed in India.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Campus');

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Abros', 'Gurugram, Haryana', 'https://abrosshoes.com',
  'Gurugram sports-footwear brand (Abros Sports International) making affordable running and gym shoes, manufactured in India.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Abros');

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Sparx', 'New Delhi, Delhi', 'https://relaxofootwear.com',
  'Sports and casual line of Relaxo Footwears Ltd, a long-running Indian manufacturer based in Delhi.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Sparx');

INSERT INTO brands (name, location, website, founding_story)
SELECT 'Red Chief', 'Kanpur, Uttar Pradesh', 'https://redchief.in',
  'Kanpur leather-footwear brand (Leayan Global) known for genuine-leather formals, boots and derbies made in India.'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Red Chief');

-- Products (verified so they appear on the public site)
INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Comet Apex STRATOS', 'Nike Dunk Low Retro', 'footwear',
  6299, 8295, 'https://www.wearcomet.com/products/apex-stratos',
  'Apex is a sport-inspired lifestyle sneaker with mesh and faux leather, not the Dunk''s premium leather upper or 1980s basketball silhouette. You get more cushioning and a lower listed price; you do not get that heritage shape or leather break-in.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"sneakers","target_gender":"unisex","upper_material":"breathable mesh with premium faux leather","sole_material":"EVA midsole, natural rubber outsole, TPU plate","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"sneakers","target_gender":"men","upper_material":"leather","sole_material":"rubber","closure":"laces","weight_g":null}'::jsonb,
  '{"indian":["https://www.wearcomet.com/products/apex-stratos"],"foreign":["https://www.nike.com/in/t/dunk-low-retro-shoe-66RGqF"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Comet'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Comet Apex STRATOS');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Comet X Lows Chestnut', 'adidas Samba OG', 'footwear',
  4299, 10999, 'https://www.wearcomet.com/products/x-lows-chestnut',
  'X Lows use faux leather and faux suede with a cushioned EVA insert; Samba OG is a leather/suede football-to-street icon with a gum sole. You pay less and get a roomier Indian-fit toe box; you do not get Samba''s heritage materials or silhouette.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"casual shoes","target_gender":"unisex","upper_material":"premium faux leather and faux suede","sole_material":"EVA insert, natural rubber outsole","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"casual shoes","target_gender":"unisex","upper_material":"leather and suede","sole_material":"gum rubber","closure":"laces","weight_g":null}'::jsonb,
  '{"indian":["https://www.wearcomet.com/products/x-lows-chestnut"],"foreign":["https://www.adidas.co.in/samba-og-shoes/IH6820.html"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Comet'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Comet X Lows Chestnut');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Neeman''s Cotton Classic Sneakers', 'adidas Stan Smith', 'footwear',
  1799, 8999, 'https://neemans.com/products/cotton-classic',
  'Cotton Classic is a soft cotton-knit casual sneaker, not a leather tennis shoe. Stan Smith''s upper is leather with the perforated 3-Stripes; Neeman''s is lighter and much cheaper, but it will not look or wear like a leather court classic, and it is not as water-resistant.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"sneakers","target_gender":"unisex","upper_material":"natural cotton","sole_material":"natural rubber","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"sneakers","target_gender":"unisex","upper_material":"leather","sole_material":"rubber","closure":"laces","weight_g":null}'::jsonb,
  '{"indian":["https://neemans.com/products/cotton-classic"],"foreign":["https://www.adidas.co.in/stan-smith-shoes/M20324.html"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Neeman''s'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Neeman''s Cotton Classic Sneakers');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Campus Ferox', 'Nike Revolution 7', 'footwear',
  1149, 3695, 'https://www.campusshoes.com/products/ferox-black-pacific-mens-running-shoes',
  'Ferox is an everyday mesh trainer with Pillofoam and an EVA outsole — built for light runs, gym and errands, not a documented road-running geometry. Revolution 7 publishes a 10 mm drop and ~286 g weight (UK 9) and uses a rubber traction outsole. Expect less structured running data and a simpler sole on Campus.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"running shoes","target_gender":"men","upper_material":"mesh with PVC print","sole_material":"EVA (Pillofoam)","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"running shoes","target_gender":"men","upper_material":"mesh","sole_material":"foam midsole, rubber outsole","closure":"laces","weight_g":286}'::jsonb,
  '{"indian":["https://www.campusshoes.com/products/ferox-black-pacific-mens-running-shoes"],"foreign":["https://www.nike.com/in/t/revolution-7-road-running-shoes-dC34tK"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Campus'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Campus Ferox');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Abros Interceptor-3', 'adidas Runfalcon 5', 'footwear',
  1499, 6599, 'https://abrosshoes.com/products/interceptor-3-lightweight-anti-skid-sports-shoes-for-men',
  'Interceptor-3 is a lightweight knit/mesh gym and jogging shoe with an EVA sole. Runfalcon 5 is adidas''s daily trainer with a fuller retail and warranty network. You save a lot; you get less published running geometry and a simpler EVA outsole rather than adidas''s current daily-run stack.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"running shoes","target_gender":"men","upper_material":"knit mesh","sole_material":"EVA","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"running shoes","target_gender":"unisex","upper_material":"mesh","sole_material":"foam midsole, rubber outsole","closure":"laces","weight_g":null}'::jsonb,
  '{"indian":["https://abrosshoes.com/products/interceptor-3-lightweight-anti-skid-sports-shoes-for-men"],"foreign":["https://www.adidas.co.in/runfalcon-5-running-shoes/IE8823.html"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Abros'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Abros Interceptor-3');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Sparx Clog SFG 9008', 'Crocs Classic Clog', 'footwear',
  909, 4495, 'https://relaxofootwear.com/products/sparx-clog-for-men-sfg-9008-sf9008g-bkwh',
  'SFG 9008 is a lightweight EVA clog for errands and indoor wear. It is not Croslite, has no Jibbitz holes, and does not have Crocs'' global fit system. You pay a fraction of the Classic Clog''s listed price; you give up the material, customisation and brand service that come with Crocs.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"sandals","target_gender":"men","upper_material":"EVA","sole_material":"EVA","closure":"slip-on","weight_g":null}'::jsonb,
  '{"shoe_type":"sandals","target_gender":"unisex","upper_material":"Croslite","sole_material":"Croslite","closure":"slip-on","weight_g":null}'::jsonb,
  '{"indian":["https://relaxofootwear.com/products/sparx-clog-for-men-sfg-9008-sf9008g-bkwh"],"foreign":["https://www.crocs.in/men/our-favourites/new-arrivals.html"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Sparx'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Sparx Clog SFG 9008');

INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, foreign_price_inr, buy_url, trade_off, verification_status,
  size_value, size_unit, foreign_size_value, foreign_size_unit,
  specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT b.id,
  'Red Chief Formal Derby RC3506', 'Clarks Un Aldric Step', 'footwear',
  1961, 7499, 'https://redchief.in/products/casual-shoes-for-men-rc3506-001',
  'Both are leather office derbies, but the Clarks Unstructured shoe uses LWG medal-rated leather (as stated on clarks.in) and is imported. Red Chief uses genuine leather with a PU sole — cheaper and Indian-made, though PU soles typically wear faster than a leather/rubber comfort sole in wet conditions, and the leather supply-chain rating is not stated on the product page.',
  'verified_by_team', 1, 'pair', 1, 'pair',
  '{"shoe_type":"formal shoes","target_gender":"men","upper_material":"genuine leather","sole_material":"PU","closure":"laces","weight_g":null}'::jsonb,
  '{"shoe_type":"formal shoes","target_gender":"men","upper_material":"leather","sole_material":"durable comfort sole","closure":"laces","weight_g":883}'::jsonb,
  '{"indian":["https://redchief.in/products/casual-shoes-for-men-rc3506-001"],"foreign":["https://clarks.in/product/un-aldric-step-black-leather-5050409522059"]}'::jsonb,
  now()
FROM brands b
WHERE b.name = 'Red Chief'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.indian_product_name = 'Red Chief Formal Derby RC3506');

-- Comparison points
INSERT INTO comparison_points (product_id, tag, content)
SELECT p.id, v.tag, v.content
FROM products p
JOIN (VALUES
  ('Comet Apex STRATOS', 'price', 'Listed at ₹6,299 on Comet''s site versus ₹8,295 MRP for Nike Dunk Low Retro on Nike India (October 2026).'),
  ('Comet Apex STRATOS', 'sourcing', 'Comet lists country of origin as India (Grails Marketing, Bengaluru). The Dunk Low Retro on Nike India is imported (China / Indonesia / Vietnam).'),
  ('Comet Apex STRATOS', 'other', 'Apex uses breathable mesh with faux leather, SpacewalkX foam, a TPU Sharkfin plate and a natural-rubber outsole. The Dunk uses a premium leather upper and a rubber hoops outsole.'),
  ('Comet X Lows Chestnut', 'price', 'Listed at ₹4,299 on Comet versus ₹10,999 MRP for Samba OG on adidas.co.in (October 2026).'),
  ('Comet X Lows Chestnut', 'sourcing', 'X Lows are designed, marketed and sold from Bengaluru, India. Samba OG is an adidas Originals import.'),
  ('Comet X Lows Chestnut', 'other', 'Comet calls out a wide toe box for broader Indian feet and a 3-layer SpaceWalk sole. Samba is a low-profile indoor-football shape, not a cushioned daily trainer.'),
  ('Neeman''s Cotton Classic Sneakers', 'price', 'Listed at ₹1,799 on Neeman''s (from ₹2,999) versus ₹8,999 MRP for Stan Smith on adidas.co.in (October 2026).'),
  ('Neeman''s Cotton Classic Sneakers', 'ethics', 'Neeman''s positions the brand around made-in-India production and recycled materials at company level (it cites plastic bottles recycled into footwear). Stan Smith is a global leather tennis icon from adidas.'),
  ('Neeman''s Cotton Classic Sneakers', 'other', 'Cotton Classic uses a natural-cotton upper for a soft, lightweight casual fit. Stan Smith uses a leather upper that lasts and cleans differently, and carries decades of tennis-heritage styling.'),
  ('Campus Ferox', 'price', 'Listed at ₹1,149 on Campus (₹2,099 MRP) versus ₹3,695 MRP for Revolution 7 on Nike India (October 2026).'),
  ('Campus Ferox', 'sourcing', 'Campus lists country of origin as India (Campus Activewear Ltd, New Delhi). Revolution 7 listings on Nike India show Vietnam or Indonesia.'),
  ('Campus Ferox', 'other', 'Ferox uses breathable mesh, Memory Tech Lite insole and Pillofoam. Nike publishes midsole foam, a 10 mm drop and a rubber traction pattern — more specified as a road shoe, at about 3× the listed price.'),
  ('Abros Interceptor-3', 'price', 'Listed at ₹1,499 on Abros (₹1,699 MRP) versus ₹6,599 MRP for Runfalcon 5 on adidas.co.in (October 2026).'),
  ('Abros Interceptor-3', 'sourcing', 'Abros lists country of origin as India (Abros Sports International, IMT Manesar, Gurugram). Runfalcon 5 is an adidas import.'),
  ('Abros Interceptor-3', 'other', 'Interceptor-3 is specified as knit mesh, EVA sole, anti-skid, for running, gym and outdoor use. Runfalcon 5 is sold as a dedicated daily running shoe with adidas cushioning — a closer match for structured road running.'),
  ('Sparx Clog SFG 9008', 'price', 'Listed at ₹909 (₹1,299 MRP) on Relaxo versus ₹4,495 for the Classic Clog on crocs.in (October 2026).'),
  ('Sparx Clog SFG 9008', 'sourcing', 'Manufactured and marketed by Relaxo Footwears Limited, Delhi. Classic Clog listings on crocs.in are imported (Vietnam) by Crocs India.'),
  ('Sparx Clog SFG 9008', 'other', 'Sparx specifies high-quality EVA and a slip-on clog shape. Crocs Classic uses Croslite, a pivoting backstrap and Jibbitz customisation — a different material system, not just a different logo.'),
  ('Red Chief Formal Derby RC3506', 'price', 'Listed at ₹1,961 on Red Chief (₹5,649 MRP) versus ₹7,499 MRP for Un Aldric Step on clarks.in (October 2026).'),
  ('Red Chief Formal Derby RC3506', 'sourcing', 'Red Chief is packed by Leayan Global, Kanpur. Clarks Un Aldric Step lists country of origin as Bangladesh, imported by Clarks Reliance Footwear, Mumbai.'),
  ('Red Chief Formal Derby RC3506', 'certification', 'Clarks states the upper and lining leather is from a tannery with a Leather Working Group medal rating. The Red Chief product page does not state an equivalent leather certification.')
) AS v(indian_product_name, tag, content)
  ON p.indian_product_name = v.indian_product_name
WHERE NOT EXISTS (
  SELECT 1 FROM comparison_points cp
  WHERE cp.product_id = p.id AND cp.tag = v.tag AND cp.content = v.content
);
