import { useEffect, useState, type FormEvent } from "react";

import {
  getExternalNews,
  type ExternalArticle,
} from "../services/externalNews";

import "../styles/NewsDiscover.css";

const CATEGORIES = [
  "all",
  "general",
  "world",
  "business",
  "technology",
  "science",
  "health",
  "sports",
  "entertainment",
];

function NewsDiscover() {
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExternalArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getExternalNews({ category, query, page })
      .then((data) => {
        if (!active) return;

        setItems(data.items);
        setTotal(data.total);
        setWarning(data.providerWarning || "");
      })
      .catch((requestError) => {
        if (!active) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load news",
        );
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, query, page]);

  // Search is submitted deliberately so the API is not called after every keystroke.
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  }

  const searchLabel = query
    ? `Results for “${query}”`
    : category === "all"
      ? "Headlines from across the web"
      : `${category[0].toUpperCase()}${category.slice(1)} headlines`;

  return (
    <main className="discover-page">
      <section className="discover-hero">
        <div className="page-container discover-hero-inner">
          <div>
            <p className="eyebrow">News beyond the community</p>
            <h1>Discover what is happening now.</h1>
            <p>
              Explore stories from external publishers, then open the original
              source whenever you want the full picture.
            </p>
          </div>

          <div className="discover-source-card" aria-label="Discover news overview">
            <span>External headlines</span>
            <strong>{total.toLocaleString()}</strong>
            <small>stories available to browse</small>
          </div>
        </div>
      </section>

      <section className="page-container discover-workspace">
        <form className="discover-search" onSubmit={search}>
          <label htmlFor="discover-search-input">Search external news</label>
          <div>
            <span aria-hidden="true">⌕</span>
            <input
              id="discover-search-input"
              placeholder="Try technology, climate, Singapore…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={120}
            />
            <button type="submit">Search</button>
          </div>

          {query && (
            <button
              className="discover-clear"
              type="button"
              onClick={() => {
                setDraft("");
                setQuery("");
                setPage(1);
              }}
            >
              Clear search
            </button>
          )}
        </form>

        <nav className="discover-categories" aria-label="News categories">
          {CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              className={category === value ? "selected" : ""}
              onClick={() => {
                setCategory(value);
                setPage(1);
              }}
            >
              {value === "all"
                ? "All stories"
                : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </nav>

        {warning && <p role="status" className="discover-warning">{warning}</p>}

        <div className="discover-results-heading">
          <div>
            <p className="eyebrow">Explore</p>
            <h2>{searchLabel}</h2>
          </div>
          {!loading && !error && <span>{total.toLocaleString()} results</span>}
        </div>

        {error && <p role="alert" className="discover-error">{error}</p>}

        {loading ? (
          <div className="discover-loading" role="status" aria-label="Loading news">
            <span /><span /><span />
          </div>
        ) : items.length === 0 && !error ? (
          <div className="discover-empty">
            <span aria-hidden="true">✦</span>
            <h2>No stories found</h2>
            <p>Try a different topic or browse another category.</p>
          </div>
        ) : (
          <div className="discover-grid">
            {items.map((item) => (
              <article className="discover-card" key={item.id}>
                <div className="discover-card-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span aria-hidden="true">{item.category.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>

                <div className="discover-card-body">
                  <span className="discover-source">{item.sourceName} · {item.category}</span>
                  <h3><a href={item.articleUrl} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
                  {item.description && <p>{item.description}</p>}

                  <div className="discover-card-footer">
                    <small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Recent"}</small>
                    <a className="discover-original" href={item.articleUrl} target="_blank" rel="noopener noreferrer">Read source <span aria-hidden="true">↗</span></a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="discover-pagination" aria-label="News pagination">
          <button disabled={loading || page === 1} onClick={() => setPage((currentPage) => currentPage - 1)}>← Previous</button>
          <span>Page {page}</span>
          <button disabled={loading || page * 12 >= total} onClick={() => setPage((currentPage) => currentPage + 1)}>Next →</button>
        </div>
      </section>
    </main>
  );
}

export default NewsDiscover;
