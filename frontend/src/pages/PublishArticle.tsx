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
          News Release System
        </p>

        <h1>Publish Article</h1>

        <p>
          Create a story and share it
          with the community.
        </p>
      </section>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <ArticleForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </main>
  );
}

export default PublishArticle;