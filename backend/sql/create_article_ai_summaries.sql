CREATE TABLE IF NOT EXISTS article_ai_summaries (
  article_id INT NOT NULL PRIMARY KEY,
  content_hash CHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_ai_summaries_article FOREIGN KEY (article_id)
    REFERENCES articles(article_id) ON DELETE CASCADE
);
-- If your articles.article_id is UNSIGNED or BIGINT, match that type here before running.
