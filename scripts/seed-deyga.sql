-- Deyga skincare and haircare products from the official Deyga product pages.
-- Run in the Supabase SQL Editor. Safe to re-run by product name.

INSERT INTO brands (name, location, website, founding_story)
SELECT
  'Deyga'::text,
  'Chennai, Tamil Nadu'::text,
  'https://deyga.in'::text,
  'Deyga is an Indian skincare and personal-care brand known for handmade, nature-led products made in small batches.'::text
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Deyga');

WITH source_data (
  name, foreign_name, price, buy_url, trade_off,
  specs, foreign_specs, image_url, size_value, size_unit
) AS (
  VALUES
    (
      'Beetroot Lip Balm - Classic 10g'::text,
      'Comparable conventional lip balm'::text,
      270::numeric,
      'https://deyga.in/products/beetroot-lip-balm'::text,
      'A beetroot lip balm for daily hydration, supplied as a classic 10 g balm.'::text,
      '{"product_type":"lip care","key_active":"beetroot","active_concentration_pct":null,"main_concern":"dry and chapped lips","fragrance_free":true,"vegan":true,"cruelty_free":true}'::jsonb,
      '{"product_type":"lip care","key_active":"not specified","active_concentration_pct":null,"main_concern":"lip moisturisation","fragrance_free":null,"vegan":null,"cruelty_free":null}'::jsonb,
      'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/classic_1_5be117b5-e33a-45bb-95aa-6d3678a61d71.webp?v=1788723327'::text,
      10::numeric,
      'g'::text
    ),
    (
      'Vitamin C Daily Glow Combo'::text,
      'Comparable conventional vitamin C skincare combo'::text,
      999::numeric,
      'https://deyga.in/collections/best-sellers/products/vitamin-c-daily-glow-combo'::text,
      'A vitamin C face-care combo with cleanser and serum steps for brightness and daily glow.'::text,
      '{"product_type":"serum","key_active":"vitamin c","active_concentration_pct":null,"main_concern":"dullness and uneven skin tone","fragrance_free":null,"vegan":true,"cruelty_free":true}'::jsonb,
      '{"product_type":"serum","key_active":"vitamin c","active_concentration_pct":null,"main_concern":"dullness and uneven skin tone","fragrance_free":null,"vegan":null,"cruelty_free":null}'::jsonb,
      'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/vit-c_face_wash_combo.webp?v=1786532722'::text,
      1::numeric,
      'piece'::text
    ),
    (
      'Charcoal Bath Bar 130g'::text,
      'Comparable conventional charcoal bath bar'::text,
      370::numeric,
      'https://deyga.in/collections/best-sellers/products/charcoal-bath-bar'::text,
      'A 130 g charcoal bath bar for cleansing and everyday body-care use.'::text,
      '{"product_type":"other","key_active":"activated charcoal","active_concentration_pct":null,"main_concern":"body cleansing and excess oil","fragrance_free":null,"vegan":true,"cruelty_free":true}'::jsonb,
      '{"product_type":"other","key_active":"charcoal","active_concentration_pct":null,"main_concern":"body cleansing","fragrance_free":null,"vegan":null,"cruelty_free":null}'::jsonb,
      'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/1_b3c7f194-5740-4dfb-8a05-cb1ade4a6617.webp?v=1788722063'::text,
      130::numeric,
      'g'::text
    ),
    (
      'Charcoal Face Wash 100ml'::text,
      'Comparable conventional charcoal face wash'::text,
      450::numeric,
      'https://deyga.in/collections/best-sellers/products/charcoal-face-wash'::text,
      'A 100 ml charcoal face wash for cleansing oily and acne-prone skin.'::text,
      '{"product_type":"cleanser","key_active":"activated charcoal","active_concentration_pct":null,"main_concern":"acne and excess oil","fragrance_free":null,"vegan":true,"cruelty_free":true}'::jsonb,
      '{"product_type":"cleanser","key_active":"charcoal","active_concentration_pct":null,"main_concern":"cleansing and oil control","fragrance_free":null,"vegan":null,"cruelty_free":null}'::jsonb,
      'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/charcoal_1_b9887a32-722d-4d44-a29f-da2cbf392158.webp?v=1788721416'::text,
      100::numeric,
      'ml'::text
    ),
    (
      'Hair Growth Oil'::text,
      'Comparable conventional hair growth oil'::text,
      600::numeric,
      'https://deyga.in/collections/best-sellers/products/hair-growth-oil'::text,
      'A hair-growth oil for scalp application, with 100 ml as the entry pack size.'::text,
      '{"product_type":"hair oil","key_active":"hair-nourishing botanical oils","active_concentration_pct":null,"main_concern":"hair fall and scalp nourishment","fragrance_free":true,"vegan":true,"cruelty_free":true}'::jsonb,
      '{"product_type":"hair oil","key_active":"botanical oils","active_concentration_pct":null,"main_concern":"hair fall","fragrance_free":null,"vegan":null,"cruelty_free":null}'::jsonb,
      'https://cdn.shopify.com/s/files/1/0034/7901/1441/files/imresizer-resize-Deyga_Ingredient_3524_47-_Hair_Growth_Oil_copy.jpg?v=1792231951'::text,
      100::numeric,
      'ml'::text
    )
)
INSERT INTO products (
  brand_id, indian_product_name, foreign_replacement_name, category,
  price_inr, buy_url, trade_off, verification_status, image_url,
  size_value, size_unit, specs, foreign_specs, spec_sources, specs_checked_at
)
SELECT
  b.id,
  s.name,
  s.foreign_name,
  'skincare-haircare',
  s.price,
  s.buy_url,
  s.trade_off,
  'verified_by_team',
  s.image_url,
  s.size_value,
  s.size_unit,
  s.specs,
  s.foreign_specs,
  jsonb_build_object('indian', jsonb_build_array(s.buy_url)),
  now()
FROM source_data s
JOIN brands b ON b.name = 'Deyga'
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.indian_product_name = s.name
);