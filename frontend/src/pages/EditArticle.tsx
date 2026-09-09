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
  getArticleForEdit,
  updateArticle,
  type Article,
  type ArticleFormData,
} from "../services/articles";

function EditArticle() {
  const { articleId } = useParams();

  const navigate = useNavigate();

  const [article, setArticle] =
    useState<Article | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) {
        setError("Invalid article");
        setLoading(false);
        return;
      }

      try {
        const result =
          await getArticleForEdit(
            Number(articleId),
          );

        setArticle(result);
      } catch (requestError) {
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

  const handleSubmit = async (
    formData: ArticleFormData,
  ) => {
    if (!articleId) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateArticle(
        Number(articleId),
        formData,
      );

      navigate("/my-articles");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update article",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="edit-article-page">
        <p>Loading article...</p>
      </main>
    );
  }

  if (error && !article) {
    return (
      <main className="edit-article-page">
        <p className="form-error">
          {error}
        </p>
      </main>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <main className="edit-article-page">
      <section>
        <p className="eyebrow">
          Your stories
        </p>

        <h1>Edit Article</h1>

        <p>
          Update your story or change its
          publication status.
        </p>
      </section>

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <ArticleForm
        initialValues={{
          title: article.title,
          summary: article.summary,
          content: article.content,
          category_id: article.category_id,

          status:
            article.status === "published"
              ? "published"
              : "draft",
        }}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </main>
  );
}

export default EditArticle;