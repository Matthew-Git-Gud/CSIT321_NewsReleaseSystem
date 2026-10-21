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

/*
 * Categories are supplied by the database, so this small deterministic mapper
 * gives every article a visual identity without requiring an image upload.
 */
const articleThemes = [
  "article-theme-forest",
  "article-theme-ocean",
  "article-theme-sunrise",
  "article-theme-violet",
  "article-theme-terracotta",
];

function getArticleTheme(category: string) {
  const categoryValue = Array.from(category).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return articleThemes[
    categoryValue % articleThemes.length
  ];
}

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
    <main className="home-page">
      <section
        className="intro"
        id="top"
      >
        <div className="page-container intro-layout">
          <div className="intro-copy-column">
            <p className="eyebrow">
              Community journalism, made accessible
            </p>

            <h1>
              Stories that help your community move forward.
            </h1>

            <p className="intro-copy">
              Discover thoughtful reporting, local updates and fresh
              perspectives — all in one trusted space.
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
                placeholder="Search stories, people or topics"
                type="search"
              />
            </label>

            <div className="hero-signals" aria-label="Platform highlights">
              <span>Topic-led discovery</span>
              <span>Community discussion</span>
              <span>Responsible moderation</span>
            </div>
          </div>

          <aside className="hero-feature" aria-label="News platform preview">
            <div className="hero-feature-topline">
              <span>Featured today</span>
              <span className="hero-feature-dot" aria-hidden="true" />
            </div>

            <div className="hero-feature-visual" aria-hidden="true">
              <span className="hero-orbit hero-orbit-one" />
              <span className="hero-orbit hero-orbit-two" />
              <span className="hero-sun" />
              <span className="hero-hill hero-hill-back" />
              <span className="hero-hill hero-hill-front" />
            </div>

            <p className="hero-feature-category">Community focus</p>
            <h2>One platform for stories worth sharing.</h2>
            <p className="hero-feature-meta">Discover • Discuss • Save for later</p>
          </aside>
        </div>
      </section>

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

        <div className="filters-row">
          <p className="filter-label">Explore by topic</p>

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
        </div>

        {loading && (
          <div className="empty-state">
            <p>
              Loading latest stories...
            </p>
          </div>
        )}

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
                      className={`article-image ${getArticleTheme(article.category)}`}
                      aria-hidden="true"
                    >
                      <span>
                        {article.category}
                      </span>

                      <small>Community report</small>
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
                        Read story
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

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
          News Release System
        </h2>

        <p className="about-copy">
          Discover community stories, share
          your own and join the conversation.
          Personalise your feed, save favourites
          and help keep the platform respectful.
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
