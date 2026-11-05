-- Product images. Safe to run more than once.

-- 1. Where the main image of each product is stored
alter table products
  add column if not exists image_url text;

-- 2. Public bucket for product photos. The server converts every upload to WebP
--    before storing it, so only WebP is accepted here (3 MB is far more than needed).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 3145728, array['image/webp'])
on conflict (id) do nothing;

-- Uploads and deletes are done by server code with the service-role key, so no
-- storage policies are needed. Public read works because the bucket is public.
