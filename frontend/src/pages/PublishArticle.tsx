import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ArticleForm from "../components/ArticleForm";

import {
  createArticle,
  type ArticleFormData,
} from "../services/articles";

function PublishArticle() {
  const navigate = useNavigate();

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (
    article: ArticleFormData,
  ) => {
    try {
      setError("");
      setLoading(true);

      const createdArticle =
        await createArticle(article);

      if (
        createdArticle.status ===
        "draft"
      ) {
        navigate("/my-articles");
        return;
      }

      navigate(
        `/articles/${createdArticle.article_id}`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save article",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="publish-page">
      <section className="publish-header">
        <p className="eyebrow">
          Write a story
        </p>

        <h1>Publish an article</h1>

        <p>
          Create a story and share it with the community.
        </p>
      </section>

      <div className="publisher-workspace">
        <div className="publish-form-panel">
          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <ArticleForm
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* A static guide gives authors useful direction without changing submission behaviour. */}
        <aside className="writing-guide" aria-labelledby="writing-guide-title">
          <p className="eyebrow">Before you publish</p>
          <h2 id="writing-guide-title">Make it easy to trust.</h2>
          <ul>
            <li>Use a headline that tells readers what happened.</li>
            <li>Keep the summary focused on the main point.</li>
            <li>Review names, dates and sources before publishing.</li>
          </ul>
          <p className="writing-guide-note">
            Not ready yet? Save a draft and return whenever you are ready.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default PublishArticle;
