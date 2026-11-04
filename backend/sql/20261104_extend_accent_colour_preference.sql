-- Run this only if 20261104_add_accent_colour_preference.sql was already
-- applied before the extended palette was added.
ALTER TABLE user_preferences
  MODIFY COLUMN accent_colour ENUM(
    'emerald',
    'ocean',
    'violet',
    'coral',
    'amber',
    'indigo',
    'rose',
    'terracotta',
    'sky',
    'plum'
  ) NOT NULL DEFAULT 'emerald';
