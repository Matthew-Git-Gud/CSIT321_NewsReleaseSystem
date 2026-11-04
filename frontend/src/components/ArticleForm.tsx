import "../styles/cover-image.css";
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

import RichTextEditor from "./RichTextEditor";
import { uploadArticleMedia } from "../services/media";
import { generateCoverImage, generateCoverPrompt } from "../services/aiCoverImages";

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

  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    initialValues?.featured_image_url ?? "",
  );
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [generatedCoverDataUrl, setGeneratedCoverDataUrl] = useState("");
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [coverAccepting, setCoverAccepting] = useState(false);
  const [coverGenerations, setCoverGenerations] = useState(0);
  const [generatedCoverStyle, setGeneratedCoverStyle] = useState("");

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



  const handleCoverUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverError("Please select an image file.");
      return;
    }
    setCoverError("");
    setCoverUploading(true);
    try {
      const result = await uploadArticleMedia(file);
      if (result.type !== "image") throw new Error("Please select an image file.");
      setFeaturedImageUrl(result.url);
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Unable to upload cover image.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!title.trim() || !summary.trim() || !content.trim() || !categoryId) {
      setCoverError("Enter the article title, summary, category and content before generating a cover.");
      return;
    }
    if (coverGenerations >= 3) {
      setCoverError("You have reached the limit of 3 generations for this editing session.");
      return;
    }
    setCoverError("");
    setCoverGenerating(true);
    setGeneratedCoverDataUrl("");
    try {
      const selectedCategory = categories.find(item => String(item.category_id) === categoryId)?.name || "News";
      const promptResult = await generateCoverPrompt({ title, summary, category: selectedCategory, content });
      const imageResult = await generateCoverImage(promptResult.imagePrompt);
      setGeneratedCoverDataUrl(imageResult.imageDataUrl);
      setGeneratedCoverStyle(promptResult.style);
      setCoverGenerations(count => count + 1);
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Unable to generate cover image.");
    } finally {
      setCoverGenerating(false);
    }
  };

  const handleAcceptGeneratedCover = async () => {
    if (!generatedCoverDataUrl) return;
    setCoverAccepting(true);
    setCoverError("");
    try {
      const imageResponse = await fetch(generatedCoverDataUrl);
      const blob = await imageResponse.blob();
      const mimeType = blob.type || "image/png";
      const extensionByMime: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
      };
      const extension = extensionByMime[mimeType];
      if (!extension) throw new Error(`Generated image format is not supported: ${mimeType}`);
      const file = new File([blob], `article-cover-${Date.now()}.${extension}`, { type: mimeType });
      const result = await uploadArticleMedia(file);
      if (result.type !== "image") throw new Error("Generated file was not accepted as an image.");
      setFeaturedImageUrl(result.url);
      setGeneratedCoverDataUrl("");
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Unable to save generated cover image.");
    } finally {
      setCoverAccepting(false);
    }
  };

  const submitArticle = async (
    status: CreateArticleStatus,
  ) => {
    await onSubmit({
      title: title.trim(),

      summary: summary.trim(),

      category_id: Number(categoryId),

      content: content.trim(),

      featured_image_url: featuredImageUrl || null,

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

        <div className="field-helper">
          <span>
            Keep the summary concise and informative.
          </span>

          <small>
            {summary.length}/500
          </small>
        </div>
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


      <section className="form-group cover-image-section" aria-labelledby="cover-image-heading">
        <label id="cover-image-heading">Cover Image</label>
        <p className="field-helper">Choose an image to represent your article on the homepage and article listings.</p>

        {generatedCoverDataUrl && (
          <div className="cover-image-preview">
            <img src={generatedCoverDataUrl} alt="AI-generated cover preview" />
            <div className="cover-image-actions">
              <button type="button" disabled={coverAccepting || coverGenerating || loading} onClick={() => { void handleAcceptGeneratedCover(); }}>
                {coverAccepting ? "Saving..." : "Accept generated image"}
              </button>
              <button type="button" disabled={coverAccepting || coverGenerating || loading || coverGenerations >= 3} onClick={() => { void handleGenerateCover(); }}>Regenerate</button>
              <button type="button" disabled={coverAccepting || coverGenerating || loading} onClick={() => setGeneratedCoverDataUrl("")}>Discard</button>
            </div>
            <small className="field-helper">Style: {generatedCoverStyle === "photorealistic" ? "Photorealistic" : "Editorial illustration"}</small>
          </div>
        )}

        {featuredImageUrl ? (
          <div className="cover-image-preview">
            <img src={featuredImageUrl} alt="Article cover preview" />
            <div className="cover-image-actions">
              <label className="cover-image-upload-button">
                Replace image
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={coverUploading || loading} onChange={event => { void handleCoverUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              </label>
              <button type="button" disabled={coverUploading || loading} onClick={() => setFeaturedImageUrl("")}>Remove</button>
            </div>
            <div className="cover-image-actions">
              <button type="button" disabled={coverGenerating || coverUploading || loading || coverGenerations >= 3} onClick={() => { void handleGenerateCover(); }}>
                {coverGenerating ? "Generating..." : "Generate a new cover with AI"}
              </button>
            </div>
          </div>
        ) : (
          <div className="cover-image-empty">
            <span>No cover image selected</span>
            <div className="cover-image-actions">
              <label className="cover-image-upload-button">
                {coverUploading ? "Uploading..." : "Upload image"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden disabled={coverUploading || loading} onChange={event => { void handleCoverUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              </label>
              <button type="button" disabled={coverGenerating || coverUploading || loading || coverGenerations >= 3} onClick={() => { void handleGenerateCover(); }}>
                {coverGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>
        )}
        {coverUploading && <p className="field-helper">Uploading cover image...</p>}
        {coverGenerating && <p className="field-helper">Creating an image prompt and generating your cover. This may take a little while...</p>}
        <small className="field-helper">AI generations used: {coverGenerations}/3 for this editing session.</small>
        {coverError && <p className="form-error">{coverError}</p>}
        <small className="field-helper">Recommended: landscape image, ideally 16:9. You can publish without a cover image.</small>
      </section>

      <div className="form-group">
        <label htmlFor="article-content">
          Article Content
        </label>

        <RichTextEditor
          value={content}
          onChange={setContent}
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