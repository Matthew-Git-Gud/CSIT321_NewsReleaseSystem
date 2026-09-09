import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import ArticleForm from "../components/ArticleForm";

import {
  getAdminArticle,
  updateAdminArticle,
  type AdminEditableArticle,
} from "../services/admin";

import type {
  ArticleFormData,
} from "../services/articles";

function AdminEditArticle() {
  const { articleId } =
    useParams();

  const navigate =
    useNavigate();

  const [
    article,
    setArticle,
  ] =
    useState<AdminEditableArticle | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // =========================
  // LOAD ARTICLE
  // =========================

  useEffect(() => {
    const loadArticle =
      async () => {
        try {
          setLoading(true);
          setError("");

          const id =
            Number(articleId);

          if (
            !Number.isInteger(id) ||
            id <= 0
          ) {
            setError(
              "Invalid article ID",
            );

            return;
          }

          const result =
            await getAdminArticle(
              id,
            );

          setArticle(result);
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load article",
          );
        } finally {
          setLoading(false);
        }
      };

    loadArticle();
  }, [articleId]);

  // =========================
  // UPDATE ARTICLE
  // =========================

  const handleSubmit =
    async (
      formData: ArticleFormData,
    ) => {
      if (!article) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await updateAdminArticle(
          article.article_id,
          {
            title:
              formData.title,
            summary:
              formData.summary,
            content:
              formData.content,
            category_id:
              formData.category_id,
            status:
              formData.status,
          },
        );

        navigate("/admin");
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update article",
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================
  // PAGE STATE
  // =========================

  if (loading) {
    return (
      <main className="article-page">
        <p>
          Loading article...
        </p>
      </main>
    );
  }

  if (error && !article) {
    return (
      <main className="article-page">
        <p className="form-error">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/admin")
          }
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="article-page">
        <p>
          Article not found.
        </p>
      </main>
    );
  }

  // Deleted articles cannot be edited
  if (
    article.status ===
    "deleted"
  ) {
    return (
      <main className="article-page">
        <section className="article-form-container">
          <h1>
            Edit article
          </h1>

          <p className="form-error">
            Deleted articles
            cannot be edited.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
          >
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }

  const initialValues:
    ArticleFormData = {
      title:
        article.title,
      summary:
        article.summary,
      category_id:
        article.category_id,
      content:
        article.content,
      status:
        article.status,
    };

  return (
    <main className="article-page">
      <section className="article-form-container">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h1>
            Edit article
          </h1>

          <p>
            Original author:{" "}
            <strong>
              {article.author_name}
            </strong>{" "}
            (@{article.author})
          </p>
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <ArticleForm
          initialValues={
            initialValues
          }
          onSubmit={
            handleSubmit
          }
          loading={saving}
        />
      </section>
    </main>
  );
}

export default AdminEditArticle;