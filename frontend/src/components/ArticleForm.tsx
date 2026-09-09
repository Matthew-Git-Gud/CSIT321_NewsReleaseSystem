import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getCategories,
  type Category,
} from "../services/categories";

import type {
  ArticleFormData,
  CreateArticleStatus,
} from "../services/articles";

type ArticleFormProps = {
  initialValues?: ArticleFormData;

  onSubmit: (
    article: ArticleFormData,
  ) => Promise<void>;

  loading?: boolean;
};

function ArticleForm({
  initialValues,
  onSubmit,
  loading = false,
}: ArticleFormProps) {
  const [title, setTitle] = useState(
    initialValues?.title ?? "",
  );

  const [summary, setSummary] = useState(
    initialValues?.summary ?? "",
  );

  const [categoryId, setCategoryId] = useState(
    initialValues
      ? String(initialValues.category_id)
      : "",
  );

  const [content, setContent] = useState(
    initialValues?.content ?? "",
  );

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  const [
    categoryError,
    setCategoryError,
  ] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoryError("");

        const result =
          await getCategories();

        setCategories(result);
      } catch (error) {
        setCategoryError(
          error instanceof Error
            ? error.message
            : "Unable to load categories",
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const submitArticle = async (
    status: CreateArticleStatus,
  ) => {
    await onSubmit({
      title: title.trim(),

      summary: summary.trim(),

      category_id: Number(categoryId),

      content: content.trim(),

      status,
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await submitArticle("published");
  };

  return (
    <form
      className="article-form"
      onSubmit={handleSubmit}
    >
      <div className="form-group">
        <label htmlFor="article-title">
          Headline
        </label>

        <input
          id="article-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Enter article headline"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="article-summary">
          Summary
        </label>

        <textarea
          id="article-summary"
          value={summary}
          onChange={(event) =>
            setSummary(
              event.target.value,
            )
          }
          placeholder="Write a short summary"
          maxLength={500}
          required
        />

        <small>
          {summary.length}/500
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="article-category">
          Category
        </label>

        <select
          id="article-category"
          value={categoryId}
          onChange={(event) =>
            setCategoryId(
              event.target.value,
            )
          }
          disabled={categoriesLoading}
          required
        >
          <option value="">
            {categoriesLoading
              ? "Loading categories..."
              : "Select a category"}
          </option>

          {categories.map(
            (category) => (
              <option
                key={
                  category.category_id
                }
                value={
                  category.category_id
                }
              >
                {category.name}
              </option>
            ),
          )}
        </select>

        {categoryError && (
          <p className="form-error">
            {categoryError}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="article-content">
          Article Content
        </label>

        <textarea
          id="article-content"
          value={content}
          onChange={(event) =>
            setContent(
              event.target.value,
            )
          }
          placeholder="Write your article..."
          required
        />
      </div>

      <div className="article-form-actions">
        <button
          type="button"
          disabled={
            loading ||
            categoriesLoading
          }
          onClick={() =>
            submitArticle("draft")
          }
        >
          Save Draft
        </button>

        <button
          type="submit"
          disabled={
            loading ||
            categoriesLoading
          }
        >
          {loading
            ? "Publishing..."
            : "Publish"}
        </button>
      </div>
    </form>
  );
}

export default ArticleForm;