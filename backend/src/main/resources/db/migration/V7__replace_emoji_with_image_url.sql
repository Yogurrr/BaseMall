ALTER TABLE products ADD COLUMN image_url TEXT;
ALTER TABLE products DROP COLUMN emoji;

ALTER TABLE order_items ADD COLUMN image_url TEXT;
ALTER TABLE order_items DROP COLUMN emoji;
