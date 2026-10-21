import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getPersonalisedFeed,
  type Article,
} from "../services/articles";

function PersonalisedFeed() {
  const [
    articles,
    setArticles,
  ] = useState<Article[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        setError("");

        const feedArticles =
          await getPersonalisedFeed();

        setArticles(feedArticles);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your feed",
        );
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  if (loading) {
    return (
      <main className="feed-page">
        <section className="page-status page-container">
          <p>Loading your feed...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="feed-page">
        <section className="page-status page-container">
          <p className="form-error">
            {error}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="feed-page">
      <section className="feed-hero">
        <div className="page-container feed-hero-content">
          <div>
            <p className="eyebrow">
              Personalised
            </p>

            <h1>Your Feed</h1>

            <p>
              A focused reading list shaped by the topics you selected.
            </p>

            <Link className="feed-preferences-link" to="/preferences">
              Adjust preferences <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* This summary is calculated from the feed already loaded for the user. */}
          <div className="feed-summary" aria-label="Feed summary">
            <strong>{articles.length}</strong>
            <span>
              {articles.length === 1 ? "story" : "stories"}
              <br />selected for you
            </span>
          </div>
        </div>
      </section>

      <section className="content page-container feed-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your reading list</p>
            <h2>Recommended for you</h2>
          </div>

          <p className="article-count">
            {articles.length}{" "}
            {articles.length === 1
              ? "article"
              : "articles"}
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="empty-state">
            <h3>
              Your feed is empty
            </h3>

            <p>
              Choose some preferred
              categories to start
              personalising your feed.
            </p>

            <Link
              className="primary-button"
              to="/preferences"
            >
              Choose preferences
            </Link>
          </div>
        ) : (
          <div className="article-grid feed-grid">
            {articles.map((article) => (
              <article
                className="article-card feed-card"
                key={article.article_id}
              >
                <div className="article-body">
                  <div className="card-topline">
                    <p className="category">
                      {article.category}
                    </p>
                    <span aria-hidden="true">✦</span>
                  </div>

                  <h3>
                    <Link
                      className="article-title-link"
                      to={`/articles/${article.article_id}`}
                    >
                      {article.title}
                    </Link>
                  </h3>

                  <p className="excerpt">
                    {article.summary}
                  </p>

                  <div className="article-meta">
                    <span>
                      {article.author_name ||
                        article.author_username}
                    </span>

                    <span className="meta-separator">
                      •
                    </span>

                    <span>
                      {new Date(
                        article.created_at,
                      ).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link
                    className="read-story-link"
                    to={`/articles/${article.article_id}`}
                  >
                    Read story
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default PersonalisedFeed;
