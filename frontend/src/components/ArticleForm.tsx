import "../styles/cover-image.css";
import "../styles/article-sources.css";
import "../styles/article-credibility.css";
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
import { analyseArticleCredibility, type CredibilityAssessment } from "../services/aiCredibility";

const SOURCES_MARKER = 'data-article-sources="true"';

function extractArticleSources(html: string): { content: string; urls: string[] } {
  if (typeof DOMParser === "undefined") return { content: html, urls: [] };
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const section = doc.querySelector(`[${SOURCES_MARKER}]`);
  const urls = section
    ? Array.from(section.querySelectorAll("a[href]"))
        .map((link) => link.getAttribute("href") || "")
        .filter((url) => /^https?:\/\//i.test(url))
    : [];
  section?.remove();
  return { content: doc.body.innerHTML, urls };
}

function buildArticleContent(content: string, urls: string[]): string {
  const uniqueUrls = Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
  if (!uniqueUrls.length) return content;
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] || char));
  const links = uniqueUrls.map((url) => {
    let label = url;
    try { label = new URL(url).hostname.replace(/^www\./, ""); } catch { /* validated before saving */ }
    return `<li><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></li>`;
  }).join("");
  return `${content}<div class="article-sources" ${SOURCES_MARKER}><h2>Sources &amp; References</h2><ul>${links}</ul></div>`;
}

function isValidSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
  } catch { return false; }
}

function credibilityClassificationLabel(value: CredibilityAssessment["classification"]): string {
  const labels = {
    supported: "Supported",
    insufficient_evidence: "Insufficient evidence",
    partially_supported: "Partially supported",
    contradictory: "Contradictory — admin investigation",
  };
  return labels[value];
}

function claimStatusLabel(value: CredibilityAssessment["claims"][number]["status"]): string {
  const labels = {
    supported: "Supported",
    not_verified: "Not verified",
    contradicted: "Contradicted",
    opinion_or_non_factual: "Opinion / non-factual",
  };
  return labels[value];
}

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

  const [initialContent] = useState(() => extractArticleSources(initialValues?.content ?? ""));
  const [content, setContent] = useState(initialContent.content);
  const [sourceText, setSourceText] = useState(initialContent.urls.join("\n"));
  const [sourceError, setSourceError] = useState("");
  const [credibilityLoading, setCredibilityLoading] = useState(false);
  const [credibilityError, setCredibilityError] = useState("");
  const [credibilityReport, setCredibilityReport] = useState<CredibilityAssessment | null>(null);
  const [credibilityReportKey, setCredibilityReportKey] = useState<string | null>(null);

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
      if (!imageResponse.ok) throw new Error("Unable to read the generated cover image.");
      const blob = await imageResponse.blob();

      // Preserve the actual format returned by Azure/FLUX. Do not label every
      // generated image as PNG: /api/media validates MIME type against bytes.
      const mimeType = blob.type.toLowerCase();
      const extensions: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
      };
      const extension = extensions[mimeType];
      if (!extension || blob.size === 0) {
        throw new Error("Generated image has an unsupported or empty file format.");
      }

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

  const getSourceUrls = (): string[] | null => {
    const entries = sourceText
      .split(/\r?
/)
      .map((url) => url.trim())
      .filter(Boolean);
    const invalid = entries.find((url) => !isValidSourceUrl(url));
    if (invalid) {
      setSourceError(`Invalid source URL: ${invalid}`);
      return null;
    }
    const unique = Array.from(new Set(entries.map((url) => url.toLowerCase())));
    if (unique.length !== entries.length) {
      setSourceError("Please remove duplicate source URLs.");
      return null;
    }
    setSourceError("");
    return entries;
  };

  const getCredibilityInputKey = () =>
    JSON.stringify({
      title: title.trim(),
      content: content.trim(),
      sources: sourceText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
    });

  const handleCredibilityAnalysis = async () => {
    if (!title.trim()) {
      setCredibilityError("Enter an article headline before running credibility analysis.");
      return;
    }
    if (!content.trim()) {
      setCredibilityError("Add article content before running credibility analysis.");
      return;
    }
    const urls = getSourceUrls();
    if (urls === null) {
      setCredibilityError("Please correct the cited source URLs before analysing.");
      return;
    }
    if (!urls.length) {
      setCredibilityError("Add at least one cited source before running credibility analysis.");
      return;
    }

    setCredibilityLoading(true);
    setCredibilityError("");
    setCredibilityReport(null);
    try {
      const articleHtml = buildArticleContent(content.trim(), urls);
      const report = await analyseArticleCredibility({ title: title.trim(), content: articleHtml });
      setCredibilityReport(report);
      setCredibilityReportKey(getCredibilityInputKey());
    } catch (error) {
      setCredibilityError(error instanceof Error ? error.message : "Unable to analyse article credibility.");
    } finally {
      setCredibilityLoading(false);
    }
  };

  const submitArticle = async (
    status: CreateArticleStatus,
  ) => {
    const urls = getSourceUrls();
    if (urls === null) return;

    if (status === "published") {
      if (!urls.length) {
        setSourceError("At least one cited source is required before publishing.");
        return;
      }
      if (!featuredImageUrl.trim()) {
        setCoverError("A cover image is required before publishing.");
        return;
      }
      if (!credibilityReport || credibilityReportKey !== getCredibilityInputKey()) {
        setCredibilityLoading(true);
        setCredibilityError("");
        try {
          const articleHtml = buildArticleContent(content.trim(), urls);
          const report = await analyseArticleCredibility({
            title: title.trim(),
            content: articleHtml,
          });
          setCredibilityReport(report);
          setCredibilityReportKey(getCredibilityInputKey());
        } catch (error) {
          setCredibilityError(error instanceof Error ? error.message : "Credibility analysis is required before publishing.");
          return;
        } finally {
          setCredibilityLoading(false);
        }
      }
    }

    await onSubmit({
      title: title.trim(),

      summary: summary.trim(),

      category_id: Number(categoryId),

      content: buildArticleContent(content.trim(), urls),

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
        <small className="field-helper">Required for publication. Recommended: landscape image, ideally 16:9.</small>
      </section>

      <div className="form-group">
        <label htmlFor="article-content">
          Article Content
        </label>

        <RichTextEditor
          value={content}
          onChange={(value) => { setContent(value); setCredibilityReport(null); setCredibilityReportKey(null); }}
        />
      </div>

      <section className="form-group article-sources-editor" aria-labelledby="article-sources-heading">
        <label htmlFor="article-sources-heading">Cited Sources</label>
        <p className="field-helper">Paste the URLs used as references for this article, one URL per line. These links will be saved with the article and used by AI credibility analysis.</p>
        <textarea
          id="article-sources-heading"
          className="article-sources-textarea"
          value={sourceText}
          onChange={(event) => { setSourceText(event.target.value); setSourceError(""); setCredibilityReport(null); setCredibilityReportKey(null); }}
          placeholder={"https://example.com/news/article-1
https://example.com/news/article-2"}
          rows={5}
          disabled={loading}
        />
        {sourceError && <p className="form-error">{sourceError}</p>}
        <small className="field-helper">You can include multiple sources. Each URL must start with http:// or https://. At least one valid source is required for publication.</small>
      </section>

      <section className="form-group credibility-section" aria-labelledby="credibility-heading">
        <div className="credibility-heading-row">
          <div>
            <label id="credibility-heading">AI Credibility Analysis</label>
            <p className="field-helper">Compare factual claims in this article against the cited sources. A completed assessment is required before publication. Findings are advisory and do not automatically determine whether an article is credible.</p>
          </div>
          <button
            type="button"
            className="credibility-analyse-button"
            disabled={loading || credibilityLoading || coverGenerating || coverUploading || coverAccepting}
            onClick={() => { void handleCredibilityAnalysis(); }}
          >
            {credibilityLoading ? "Analysing..." : "Analyse credibility"}
          </button>
        </div>
        {credibilityLoading && <p className="field-helper">Credibility analysis is required before publication. Retrieving cited webpages and comparing article claims...</p>}
        {credibilityError && <p className="form-error" role="alert">{credibilityError}</p>}
        {credibilityReport && (
          <div className="credibility-report" aria-live="polite">
            <div className="credibility-report-topline">
              <strong>Assessment: {credibilityClassificationLabel(credibilityReport.classification)}</strong>
              <span className={`credibility-status credibility-status-${credibilityReport.classification}`}>
                {credibilityClassificationLabel(credibilityReport.classification)}
              </span>
            </div>
            {credibilityReport.summary && <p>{credibilityReport.summary}</p>}
            <p className="field-helper">Sources retrieved: {credibilityReport.retrievedCount} · Unavailable: {credibilityReport.unavailableCount}</p>
            {credibilityReport.claims.length > 0 ? (
              <div className="credibility-claims">
                <strong>Claim-by-claim findings</strong>
                {credibilityReport.claims.map((claim, index) => (
                  <article className="credibility-claim" key={`${index}-${claim.claim.slice(0, 30)}`}>
                    <div className="credibility-claim-heading">
                      <strong>{claim.claim}</strong>
                      <span className={`credibility-status credibility-status-${claim.status}`}>{claimStatusLabel(claim.status)}</span>
                    </div>
                    {claim.explanation && <p>{claim.explanation}</p>}
                    {claim.evidence.length > 0 && (
                      <ul className="credibility-evidence-list">
                        {claim.evidence.map((item, evidenceIndex) => (
                          <li key={`${item.source_url || "source"}-${evidenceIndex}`}>
                            {item.source_url ? <a href={item.source_url} target="_blank" rel="noreferrer">{item.source_title || item.source_url}</a> : (item.source_title || "Source")}
                            {item.explanation && <span> — {item.explanation}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            ) : <p className="field-helper">No factual claims were returned for assessment.</p>}
            {credibilityReport.sources.length > 0 && (
              <div className="credibility-sources-list">
                <strong>Source retrieval</strong>
                <ul>
                  {credibilityReport.sources.map((source, index) => (
                    <li key={`${source.url}-${index}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>
                      <span className={source.status === "retrieved" ? "credibility-source-ok" : "credibility-source-unavailable"}>
                        {source.status === "retrieved" ? " Retrieved" : ` Unavailable: ${source.message || "Could not retrieve"}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="credibility-moderation-notice">{credibilityReport.moderationNotice || "AI findings are advisory. An administrator must review evidence before taking moderation action. Missing evidence is not proof that a claim is false."}</p>
          </div>
        )}
      </section>

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