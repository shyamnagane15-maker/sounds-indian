-- Foreign counterpart image on the comparison page. Safe to run more than once.
alter table products
  add column if not exists foreign_image_url text;
