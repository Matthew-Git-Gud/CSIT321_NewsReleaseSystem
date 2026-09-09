import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate, useLocation
} from "react-router-dom";

import {
  getPublishedArticles,
  type ArticlePreview,
} from "../services/articles";

function Home() {
  const navigate = useNavigate();

  const [articles, setArticles] =
    useState<ArticlePreview[]>([]);

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");
  const location =
    useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id =
      location.hash.substring(1);

    const element =
      document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location]);
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setError("");

        const result =
          await getPublishedArticles();

        setArticles(result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load articles",
        );
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          articles.map(
            (article) =>
              article.category,
          ),
        ),
      ),
    ],
    [articles],
  );

  const filteredArticles = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "All" ||
        article.category === activeCategory;

      const matchesSearch =
        !query ||
        `${article.title} ${article.summary} ${article.category}`
          .toLowerCase()
          .includes(query);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    articles,
    activeCategory,
    searchTerm,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("All");
  };

  return (
    <main>
      {/* ================= INTRO ================= */}
      <section
        className="intro"
        id="top"
      >
        <p className="eyebrow">
          Community journalism, made accessible
        </p>

        <h1>
          Stories that matter, from people who care.
        </h1>

        <p className="intro-copy">
          Discover fresh perspectives,
          local updates and thoughtful
          reporting from our community.
        </p>

        <label
          className="search"
          htmlFor="article-search"
        >
          <span aria-hidden="true">
            ⌕
          </span>

          <input
            id="article-search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="Search stories"
            type="search"
          />
        </label>
      </section>

      {/* ================= ARTICLES ================= */}
      <section
        className="content"
        id="latest"
        aria-labelledby="latest-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Browse articles
            </p>

            <h2 id="latest-heading">
              Latest stories
            </h2>
          </div>

          {!loading && !error && (
            <p className="article-count">
              {filteredArticles.length}{" "}
              {filteredArticles.length === 1
                ? "story"
                : "stories"}{" "}
              found
            </p>
          )}
        </div>

        {/* ================= CATEGORY FILTER ================= */}
        <div
          className="category-list"
          id="categories"
          aria-label="Filter articles by category"
        >
          {categories.map((category) => (
            <button
              className={
                category === activeCategory
                  ? "selected"
                  : ""
              }
              key={category}
              onClick={() =>
                setActiveCategory(
                  category,
                )
              }
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="empty-state">
            <p>
              Loading latest stories...
            </p>
          </div>
        )}

        {/* ================= ERROR ================= */}
        {!loading && error && (
          <div className="empty-state">
            <h3>
              Unable to load stories
            </h3>

            <p className="form-error">
              {error}
            </p>
          </div>
        )}

        {/* ================= ARTICLE GRID ================= */}
        {!loading &&
          !error &&
          filteredArticles.length > 0 && (
            <div className="article-grid">
              {filteredArticles.map(
                (article) => (
                  <article
                    className="article-card"
                    key={
                      article.article_id
                    }
                  >
                    <div
                      className="article-image"
                      aria-hidden="true"
                    >
                      <span>
                        {article.category}
                      </span>
                    </div>

                    <div className="article-body">
                      <p className="category">
                        {article.category}
                      </p>

                      <h3>
                        <button
                          type="button"
                          className="article-title-link"
                          onClick={() =>
                            navigate(
                              `/articles/${article.article_id}`,
                            )
                          }
                        >
                          {article.title}
                        </button>
                      </h3>

                      <p className="excerpt">
                        {article.summary}
                      </p>

                      <div className="article-meta">
                        <span>
                          By{" "}
                          {article.author_name ||
                            article.author_username}
                        </span>

                        <span>
                          {new Date(
                            article.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="read-article"
                        onClick={() =>
                          navigate(
                            `/articles/${article.article_id}`,
                          )
                        }
                      >
                        Read article
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

        {/* ================= EMPTY STATE ================= */}
        {!loading &&
          !error &&
          filteredArticles.length === 0 && (
            <div className="empty-state">
              <h3>
                No stories found
              </h3>

              <p>
                Try another search term or
                select a different category.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          )}
      </section>

      {/* ================= ABOUT ================= */}
      <section
        id="about"
        className="about-section"
      >
        <p className="eyebrow">
          About
        </p>

        <h2>
          About News Release System
        </h2>

        <p className="about-copy">
          News Release System is a
          community news platform for
          publishing, discovering and
          discussing news articles.
          Registered users can personalise
          their feed, save articles,
          participate in discussions,
          rate article credibility and
          report inappropriate content.
        </p>
      </section>

      {/* ================= FOOTER ================= */}
      <footer>
        News Release System · A community news platform
      </footer>
    </main>
  );
}

export default Home;