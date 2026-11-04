-- Run once against the News Release System database.
-- Store a palette key rather than a CSS colour supplied by a client.
ALTER TABLE user_preferences
  ADD COLUMN accent_colour ENUM(
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
  ) NOT NULL DEFAULT 'emerald' AFTER theme;
