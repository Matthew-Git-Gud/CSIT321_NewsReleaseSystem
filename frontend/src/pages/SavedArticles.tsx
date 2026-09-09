import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSavedArticles,
  unsaveArticle,
  type SavedArticle,
} from "../services/savedArticles";

function SavedArticles() {
  const navigate = useNavigate();

  const [articles, setArticles] =
    useState<SavedArticle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [removingArticleId, setRemovingArticleId] =
    useState<number | null>(null);

  // =========================
  // LOAD SAVED ARTICLES
  // =========================

  useEffect(() => {
    const loadSavedArticles = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getSavedArticles();

        setArticles(result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load saved articles",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSavedArticles();
  }, []);

  // =========================
  // REMOVE SAVED ARTICLE
  // =========================

  const handleRemove = async (
    articleId: number,
  ) => {
    try {
      setRemovingArticleId(articleId);
      setError("");

      await unsaveArticle(articleId);

      setArticles(
        (currentArticles) =>
          currentArticles.filter(
            (article) =>
              article.article_id !== articleId,
          ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove saved article",
      );
    } finally {
      setRemovingArticleId(null);
    }
  };

  // =========================
  // LOADING STATE
  // =========================

  if (loading) {
    return (
      <main className="saved-page">
        <section className="content">
          <p>
            Loading saved articles...
          </p>
        </section>
      </main>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <main className="saved-page">
      <section className="content">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Your reading list
            </p>

            <h1>
              Saved Articles
            </h1>

            <p>
              Stories you saved to read again later.
            </p>
          </div>

          <p>
            {articles.length}{" "}
            {articles.length === 1
              ? "article"
              : "articles"}
          </p>
        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {/* =========================
            EMPTY STATE
        ========================= */}

        {!error &&
          articles.length === 0 && (
            <div className="empty-state">
              <h3>
                No saved articles
              </h3>

              <p>
                Articles you save will appear here.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
              >
                Browse articles
              </button>
            </div>
          )}

        {/* =========================
            SAVED ARTICLES
        ========================= */}

        {articles.length > 0 && (
          <div className="article-grid">
            {articles.map(
              (article) => {
                const isRemoving =
                  removingArticleId ===
                  article.article_id;

                return (
                  <article
                    className="article-card"
                    key={
                      article.article_id
                    }
                  >
                    {/* =========================
                        ARTICLE IMAGE / CATEGORY
                    ========================= */}

                    <div
                      className="article-image"
                      aria-hidden="true"
                    >
                      <span>
                        {article.category}
                      </span>
                    </div>

                    {/* =========================
                        ARTICLE CONTENT
                    ========================= */}

                    <div className="article-body">
                      <p className="category">
                        {article.category}
                      </p>

                      <h3>
                        {article.title}
                      </h3>

                      <p className="excerpt">
                        {article.summary}
                      </p>

                      {/* =========================
                          ARTICLE META
                      ========================= */}

                      <div className="article-meta">
                        <span>
                          By{" "}
                          {article.author_name ||
                            article.author_username ||
                            "Unknown author"}
                        </span>

                        <span>
                          {new Date(
                            article.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {/* =========================
                          SAVED DATE
                      ========================= */}

                      {article.saved_at && (
                        <p className="saved-date">
                          Saved{" "}
                          {new Date(
                            article.saved_at,
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {/* =========================
                          ACTIONS
                      ========================= */}

                      <div className="saved-article-actions">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/articles/${article.article_id}`,
                            )
                          }
                          disabled={
                            isRemoving
                          }
                        >
                          Read article
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(
                              article.article_id,
                            )
                          }
                          disabled={
                            isRemoving
                          }
                        >
                          {isRemoving
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default SavedArticles;