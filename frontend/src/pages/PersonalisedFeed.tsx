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
      <main className="content">
        <p>Loading your feed...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="content">
        <p className="form-error">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main>
      <section className="intro">
        <p className="eyebrow">
          Personalised
        </p>

        <h1>Your Feed</h1>

        <p className="intro-copy">
          News based on the categories
          you selected in your preferences.
        </p>
      </section>

      <section className="content">
        <div className="section-heading">
          <h2>Recommended for you</h2>

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
          <div
            className="article-grid"
            style={{
              marginTop: "30px",
            }}
          >
            {articles.map(
              (article) => (
                <article
                  className="article-card"
                  key={
                    article.article_id
                  }
                >
                  <div className="article-body">
                    <p className="category">
                      {article.category}
                    </p>

                    <h3>
                      <Link
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

                      <span>
                        {new Date(
                          article.created_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default PersonalisedFeed;