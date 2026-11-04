-- Run once against the News Release System database.
-- Check INFORMATION_SCHEMA first if you have manually added this column already.
ALTER TABLE articles
  ADD COLUMN featured_image_url VARCHAR(1000) NULL AFTER content;
