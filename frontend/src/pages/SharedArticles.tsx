import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getSharedArticles, type SharedArticle } from "../services/shares";
import "../styles/SharedArticles.css";

function SharedArticles() {
  const [items, setItems] = useState<SharedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    // Avoid changing state when the page is closed before the request finishes.
    getSharedArticles()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load shared articles.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="shared-page">
      <section className="shared-hero">
        <div className="page-container shared-hero-inner">
          <div>
            <p className="eyebrow">Shared by your circle</p>
            <h1>Stories sent your way.</h1>
            <p>
              Keep track of articles your friends think are worth reading.
            </p>
          </div>

          <div className="shared-count-card" aria-label="Number of shared articles">
            <span>In your inbox</span>
            <strong>{items.length}</strong>
            <small>{items.length === 1 ? "article shared" : "articles shared"}</small>
          </div>
        </div>
      </section>

      <section className="page-container shared-content" aria-label="Shared articles">
        {loading && (
          <div className="shared-loading" role="status" aria-label="Loading shared articles">
            <span />
            <span />
            <span />
          </div>
        )}

        {error && <p role="alert" className="shared-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="shared-empty">
            <span aria-hidden="true">↗</span>
            <h2>Nothing has been shared yet</h2>
            <p>When a friend sends you an article, it will appear here.</p>
            <Link to="/latest">Browse the latest stories</Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="shared-grid">
            {items.map((item) => (
              <article className="shared-card" key={item.share_id}>
                <div className="shared-card-mark" aria-hidden="true">↗</div>
                <div className="shared-card-content">
                  <p className="shared-card-meta">
                    Shared by <strong>{item.shared_by}</strong>
                  </p>
                  <h2>
                    <Link to={`/articles/${item.article_id}`}>{item.title}</Link>
                  </h2>
                  {item.summary && <p className="shared-card-summary">{item.summary}</p>}
                  <div className="shared-card-footer">
                    <time dateTime={item.shared_at}>
                      {new Date(item.shared_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    <Link to={`/articles/${item.article_id}`}>Read story <span aria-hidden="true">→</span></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default SharedArticles;
