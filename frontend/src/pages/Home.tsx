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
 * Every category receives a visual identity, including categories added later
 * through the database. This avoids blank-looking cards for new topics.
 */
const ARTICLE_THEMES = [
  "article-theme-forest",
  "article-theme-sky",
  "article-theme-clay",
  "article-theme-plum",
  "article-theme-gold",
];

function getArticleTheme(category: string) {
  const characterTotal = Array.from(category).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return ARTICLE_THEMES[
    characterTotal % ARTICLE_THEMES.length
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
      {/* ================= INTRO ================= */}
      <section
        className="intro"
        id="top"
      >
        <div className="page-container intro-layout">
          <div className="intro-content">
            <p className="eyebrow">
              Community journalism, made accessible
            </p>

            <h1>
              A clearer view of the stories shaping your community.
            </h1>

            <p className="intro-copy">
              Explore thoughtful reporting, useful local updates and
              perspectives worth sharing.
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
                placeholder="Search by story, topic or keyword"
                type="search"
              />
            </label>

            <div className="hero-details" aria-label="Platform highlights">
              <span>Discover by topic</span>
              <span>Save stories for later</span>
              <span>Join the discussion</span>
            </div>
          </div>

          {/* A CSS-built feature panel gives the landing page character without external images. */}
          <aside className="intro-feature" aria-label="News Release System overview">
            <div className="feature-topline">
              <span>Community bulletin</span>
              <span className="feature-status">Live</span>
            </div>

            <div className="feature-copy">
              <p className="feature-number">01</p>
              <p>Local stories.<br />Useful context.<br />Your perspective.</p>
            </div>

            <div className="feature-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </aside>
        </div>
      </section>

      {/* ================= ARTICLES ================= */}
      <section
        className="content page-container"
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
                    key={article.article_id}
                  >
                    <div
                      className={`article-image ${getArticleTheme(article.category)} article-image-${article.category
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      aria-hidden="true"
                    >
                      <div className="article-image-overlay">
                        <span className="article-image-category">
                          {article.category}
                        </span>
                      </div>
                    </div>

                    <div className="article-body">
                      

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

                      <div className="article-card-footer">
                        <div className="article-meta">
                          <span>
                            {article.author_name ||
                              article.author_username}
                          </span>

                          <span aria-hidden="true">•</span>

                          <span>
                            {new Date(
                              article.created_at,
                            ).toLocaleDateString(
                              "en-SG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
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
          A place for community stories, shared perspectives and useful
          updates. Personalise your feed, save the stories that matter and
          help keep the conversation respectful.
        </p>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        <span>News Release System</span>
        <span>Built for informed community conversations.</span>
      </footer>
    </main>
  );
}

export default Home;
