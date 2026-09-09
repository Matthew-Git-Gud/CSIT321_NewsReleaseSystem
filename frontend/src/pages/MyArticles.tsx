import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteArticle,
  getMyArticles,
  type Article,
} from "../services/articles";

function MyArticles() {
  const [articles, setArticles] =
    useState<Article[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const navigate = useNavigate();

  const handleDelete = async (
    articleId: number,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this article?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteArticle(articleId);

      setArticles((currentArticles) =>
        currentArticles.filter(
          (article) =>
            article.article_id !== articleId,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete article",
      );
    }
  };

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setError("");

        const result =
          await getMyArticles();

        setArticles(result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your articles",
        );
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  if (loading) {
    return (
      <main className="my-articles-page">
        <p>Loading your articles...</p>
      </main>
    );
  }

  return (
    <main className="my-articles-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            Your stories
          </p>

          <h1>My Articles</h1>

          <p>
            Manage your drafts and published
            stories.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate("/publish")
          }
        >
          + Write Article
        </button>
      </div>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      {!error && articles.length === 0 && (
        <div className="empty-state">
          <h3>No articles yet</h3>

          <p>
            Your drafts and published articles
            will appear here.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/publish")
            }
          >
            Write your first article
          </button>
        </div>
      )}

      {articles.length > 0 && (
        <div className="article-management">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {articles.map((article) => (
                <tr key={article.article_id}>
                  <td>
                    {article.title}
                  </td>

                  <td>
                    {article.category}
                  </td>

                  <td>
                    <span
                      className={`status status-${article.status}`}
                    >
                      {article.status}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      article.updated_at,
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/articles/${article.article_id}/edit`,
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(article.article_id)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default MyArticles;