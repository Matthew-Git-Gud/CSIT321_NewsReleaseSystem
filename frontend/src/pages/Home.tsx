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
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";

/*
 * Every category receives an accent identity, including categories added later
 * through the database. This avoids generic-looking cards for new topics.
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
  const { role } = useAuth();

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

  // The newest published article gives the hero a meaningful, live focal point.
  const featuredArticle = articles[0];

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

            <div className="intro-actions">
              <a className="intro-primary-action" href="#latest">
                Explore latest stories <span aria-hidden="true">→</span>
              </a>

              {role === ROLES.GUEST ? (
                <button
                  className="intro-secondary-action"
                  type="button"
                  onClick={() => navigate("/register")}
                >
                  Join the community
                </button>
              ) : (
                <button
                  className="intro-secondary-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      role === ROLES.ADMIN ? "/admin" : "/publish",
                    )
                  }
                >
                  {role === ROLES.ADMIN ? "Open dashboard" : "Write a story"}
                </button>
              )}
            </div>

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

          {/* This panel uses real article data so the homepage never feels like a static mock-up. */}
          <aside className="intro-feature" aria-label="Featured community story">
            <div className="feature-topline">
              <span>Featured story</span>
              <span className="feature-status">Latest</span>
            </div>

            {loading ? (
              <div className="feature-loading" role="status" aria-label="Loading featured story">
                <span />
                <span />
                <span />
              </div>
            ) : featuredArticle ? (
              <div className="feature-story">
                <p className="feature-category">{featuredArticle.category}</p>
                <h2>{featuredArticle.title}</h2>
                <p>{featuredArticle.summary}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/articles/${featuredArticle.article_id}`)}
                >
                  Read featured story <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <div className="feature-story feature-story-empty">
                <p className="feature-category">Community bulletin</p>
                <h2>Your community’s stories start here.</h2>
                <p>Come back soon to discover the latest news and perspectives.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="home-promise" aria-label="What News Release System offers">
        <div className="page-container home-promise-grid">
          <article>
            <span>01</span>
            <h2>Discover</h2>
            <p>Browse local stories and follow the topics that matter to you.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Discuss</h2>
            <p>Share perspectives and join respectful community conversations.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Stay informed</h2>
            <p>Save useful updates and return to them whenever you need them.</p>
          </article>
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
                    className={`article-card ${getArticleTheme(article.category)}`}
                    key={article.article_id}
                  >
                    {article.cover_image_url ? (
                      <div className="article-card-image">
                        <img
                          src={article.cover_image_url}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            // Keep the category overlay visible if a removed image cannot load.
                            event.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="article-card-image-overlay">
                          <span className="article-card-category">
                            {article.category}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="article-card-accent">
                        <span className="article-card-category">
                          {article.category}
                        </span>
                      </div>
                    )}

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
