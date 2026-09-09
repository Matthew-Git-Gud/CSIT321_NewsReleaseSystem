import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getArticleById,
  type Article,
} from "../services/articles";

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
  type Comment,
} from "../services/comments";

import {
  getSavedStatus,
  saveArticle,
  unsaveArticle,
} from "../services/savedArticles";

import {
  getReportStatus,
  reportArticle,
  type ReportReason,
} from "../services/reports";

import {
  getArticleRating,
  rateArticle,
} from "../services/ratings";

import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";

function ArticleView() {
  const { articleId } = useParams();
  const navigate = useNavigate();

  const { user, role } = useAuth();

  // =========================
  // RATINGS STATE
  // =========================
  const [
    averageRating,
    setAverageRating,
  ] = useState(0);

  const [
    ratingCount,
    setRatingCount,
  ] = useState(0);

  const [
    userRating,
    setUserRating,
  ] = useState<number | null>(
    null,
  );

  const [
    hoverRating,
    setHoverRating,
  ] = useState<number | null>(
    null,
  );

  const [
    ratingLoading,
    setRatingLoading,
  ] = useState(false);

  const [
    ratingError,
    setRatingError,
  ] = useState("");

  const [
    ratingSuccess,
    setRatingSuccess,
  ] = useState("");
  // =========================
  // ARTICLE STATE
  // =========================

  const [article, setArticle] =
    useState<Article | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================
  // SAVED ARTICLE STATE
  // =========================

  const [isSaved, setIsSaved] =
    useState(false);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  // =========================
  // REPORT STATE
  // =========================

  const [
    reportFormOpen,
    setReportFormOpen,
  ] = useState(false);

  const [
    reportReason,
    setReportReason,
  ] = useState<ReportReason>(
    "misinformation",
  );

  const [
    reportDetails,
    setReportDetails,
  ] = useState("");

  const [
    reportLoading,
    setReportLoading,
  ] = useState(false);

  const [
    reportError,
    setReportError,
  ] = useState("");

  const [
    reportSuccess,
    setReportSuccess,
  ] = useState("");

  const [
    hasReported,
    setHasReported,
  ] = useState(false);

  const [
    isArticleAuthor,
    setIsArticleAuthor,
  ] = useState(false);

  // =========================
  // COMMENT STATE
  // =========================

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [
    commentsLoading,
    setCommentsLoading,
  ] = useState(true);

  const [
    postingComment,
    setPostingComment,
  ] = useState(false);

  const [
    commentError,
    setCommentError,
  ] = useState("");

  // =========================
  // COMMENT EDIT STATE
  // =========================

  const [
    editingCommentId,
    setEditingCommentId,
  ] = useState<number | null>(null);

  const [
    editingCommentText,
    setEditingCommentText,
  ] = useState("");

  const [
    commentActionLoading,
    setCommentActionLoading,
  ] = useState(false);

  // =========================
  // LOAD ARTICLE
  // =========================

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) {
        setError("Invalid article");
        setLoading(false);
        return;
      }

      const id = Number(articleId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError("Invalid article");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const result =
          await getArticleById(id);

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

  // =========================
  // LOAD SAVED STATUS
  // Registered users only
  // =========================

  useEffect(() => {
    const loadSavedStatus = async () => {
      if (
        !articleId ||
        role !== ROLES.REGISTERED
      ) {
        setIsSaved(false);
        return;
      }

      const id = Number(articleId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return;
      }

      try {
        setSaveError("");

        const saved =
          await getSavedStatus(id);

        setIsSaved(saved);
      } catch (requestError) {
        console.error(
          "Unable to load saved status:",
          requestError,
        );
      }
    };

    loadSavedStatus();
  }, [articleId, role]);

  // =========================
  // LOAD REPORT STATUS
  // Registered users only
  // =========================

  useEffect(() => {
    const loadReportStatus =
      async () => {
        if (
          !articleId ||
          role !== ROLES.REGISTERED
        ) {
          setHasReported(false);
          setIsArticleAuthor(false);
          return;
        }

        const id = Number(articleId);

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          return;
        }

        try {
          const result =
            await getReportStatus(id);

          setHasReported(
            result.hasReported,
          );

          setIsArticleAuthor(
            result.isAuthor,
          );
        } catch (requestError) {
          console.error(
            "Unable to load report status:",
            requestError,
          );
        }
      };

    loadReportStatus();
  }, [articleId, role]);


  // =========================
  // LOAD ARTICLE RATING
  // =========================

  useEffect(() => {
    const loadRating = async () => {
      if (!articleId) {
        return;
      }

      const id = Number(articleId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return;
      }

      try {
        setRatingError("");

        const result =
          await getArticleRating(id);

        setAverageRating(
          result.averageRating,
        );

        setRatingCount(
          result.ratingCount,
        );

        setUserRating(
          result.userRating,
        );
      } catch (requestError) {
        console.error(
          "Unable to load rating:",
          requestError,
        );
      }
    };

    loadRating();
  }, [articleId, role]);

  // =========================
  // LOAD COMMENTS
  // =========================

  useEffect(() => {
    const loadComments = async () => {
      if (!articleId) {
        setCommentsLoading(false);
        return;
      }

      const id = Number(articleId);

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setCommentsLoading(false);
        return;
      }

      try {
        setCommentError("");

        const result =
          await getComments(id);

        setComments(result);
      } catch (requestError) {
        setCommentError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load comments",
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [articleId]);

  // =========================
  // SAVE / UNSAVE ARTICLE
  // =========================

  const handleSaveToggle = async () => {
    if (
      !articleId ||
      role !== ROLES.REGISTERED
    ) {
      return;
    }

    const id = Number(articleId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return;
    }

    try {
      setSaveLoading(true);
      setSaveError("");

      if (isSaved) {
        await unsaveArticle(id);

        setIsSaved(false);
      } else {
        await saveArticle(id);

        setIsSaved(true);
      }
    } catch (requestError) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update saved article",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // =========================
  // REPORT ARTICLE
  // =========================

  const handleReportSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !articleId ||
      role !== ROLES.REGISTERED
    ) {
      return;
    }

    const id = Number(articleId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setReportError(
        "Invalid article",
      );

      return;
    }

    try {
      setReportLoading(true);
      setReportError("");
      setReportSuccess("");

      const result =
        await reportArticle(
          id,
          {
            reason: reportReason,

            details:
              reportDetails.trim() ||
              undefined,
          },
        );

      setReportSuccess(
        result.message,
      );

      setHasReported(true);

      setReportDetails("");

      setReportFormOpen(false);
    } catch (requestError) {
      setReportError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to report article",
      );
    } finally {
      setReportLoading(false);
    }
  };


  // =========================
  // RATE ARTICLE
  // =========================

  const handleRating = async (
    rating: number,
  ) => {
    if (
      !articleId ||
      role !== ROLES.REGISTERED ||
      isArticleAuthor
    ) {
      return;
    }

    const id = Number(articleId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return;
    }

    try {
      setRatingLoading(true);
      setRatingError("");
      setRatingSuccess("");

      const result =
        await rateArticle(
          id,
          rating,
        );

      setAverageRating(
        result.averageRating,
      );

      setRatingCount(
        result.ratingCount,
      );

      setUserRating(
        result.userRating,
      );

      setRatingSuccess(
        result.message,
      );
    } catch (requestError) {
      setRatingError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save rating",
      );
    } finally {
      setRatingLoading(false);
    }
  };

  // =========================
  // POST COMMENT
  // =========================

  const handleCommentSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!articleId) {
      return;
    }

    const trimmedComment =
      commentText.trim();

    if (!trimmedComment) {
      setCommentError(
        "Comment cannot be empty",
      );

      return;
    }

    try {
      setPostingComment(true);
      setCommentError("");

      const newComment =
        await createComment(
          Number(articleId),
          trimmedComment,
        );

      setComments(
        (currentComments) => [
          ...currentComments,
          newComment,
        ],
      );

      setCommentText("");
    } catch (requestError) {
      setCommentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to post comment",
      );
    } finally {
      setPostingComment(false);
    }
  };

  // =========================
  // START EDIT COMMENT
  // =========================

  const startEditingComment = (
    comment: Comment,
  ) => {
    setEditingCommentId(
      comment.comment_id,
    );

    setEditingCommentText(
      comment.comment_text,
    );

    setCommentError("");
  };

  // =========================
  // CANCEL EDIT COMMENT
  // =========================

  const cancelEditingComment = () => {
    setEditingCommentId(null);

    setEditingCommentText("");

    setCommentError("");
  };

  // =========================
  // UPDATE COMMENT
  // =========================

  const handleUpdateComment = async (
    commentId: number,
  ) => {
    const trimmedComment =
      editingCommentText.trim();

    if (!trimmedComment) {
      setCommentError(
        "Comment cannot be empty",
      );

      return;
    }

    try {
      setCommentActionLoading(true);
      setCommentError("");

      const updatedComment =
        await updateComment(
          commentId,
          trimmedComment,
        );

      setComments(
        (currentComments) =>
          currentComments.map(
            (comment) =>
              comment.comment_id ===
                commentId
                ? updatedComment
                : comment,
          ),
      );

      setEditingCommentId(null);

      setEditingCommentText("");
    } catch (requestError) {
      setCommentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update comment",
      );
    } finally {
      setCommentActionLoading(false);
    }
  };

  // =========================
  // DELETE COMMENT
  // =========================

  const handleDeleteComment = async (
    commentId: number,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setCommentActionLoading(true);
      setCommentError("");

      await deleteComment(commentId);

      setComments(
        (currentComments) =>
          currentComments.filter(
            (comment) =>
              comment.comment_id !==
              commentId,
          ),
      );

      if (
        editingCommentId ===
        commentId
      ) {
        setEditingCommentId(null);

        setEditingCommentText("");
      }
    } catch (requestError) {
      setCommentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete comment",
      );
    } finally {
      setCommentActionLoading(false);
    }
  };

  // =========================
  // ARTICLE LOADING
  // =========================

  if (loading) {
    return (
      <main className="article-view-page">
        <p>
          Loading article...
        </p>
      </main>
    );
  }

  // =========================
  // ARTICLE ERROR
  // =========================

  if (error || !article) {
    return (
      <main className="article-view-page">
        <section className="empty-state">
          <h1>
            Article unavailable
          </h1>

          <p>
            {error ||
              "This article could not be found."}
          </p>

          <Link to="/">
            Return to latest stories
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="article-view-page">

      {/* =========================
          ARTICLE
      ========================= */}

      <article className="article-view">
        <header className="article-view-header">

          <Link
            className="category"
            to={`/?category=${encodeURIComponent(
              article.category,
            )}`}
          >
            {article.category}
          </Link>

          <h1>
            {article.title}
          </h1>

          <p className="article-summary">
            {article.summary}
          </p>

          <div className="article-meta">

            <span>
              By{" "}
              {article.author_name ??
                article.author_username ??
                "Unknown author"}
            </span>

            <span>
              {new Date(
                article.created_at,
              ).toLocaleDateString()}
            </span>

          </div>

          {/* =========================
              ARTICLE ACTIONS
              Registered users only
          ========================= */}

          {role === ROLES.REGISTERED && (
            <div className="article-actions">

              <button
                type="button"
                onClick={
                  handleSaveToggle
                }
                disabled={
                  saveLoading
                }
              >
                {saveLoading
                  ? "Saving..."
                  : isSaved
                    ? "♥ Saved"
                    : "♡ Save Article"}
              </button>

              {/* =========================
                  REPORT ACTION
              ========================= */}

              {!isArticleAuthor &&
                (
                  hasReported ? (
                    <span className="reported-status">
                      ✓ Reported
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReportFormOpen(
                          (current) =>
                            !current,
                        );

                        setReportError("");

                        setReportSuccess("");
                      }}
                    >
                      Report Article
                    </button>
                  )
                )}

            </div>
          )}

          {/* =========================
              SAVE ERROR
          ========================= */}

          {saveError && (
            <p className="form-error">
              {saveError}
            </p>
          )}

          {/* =========================
              REPORT SUCCESS
          ========================= */}

          {reportSuccess && (
            <p className="form-success">
              {reportSuccess}
            </p>
          )}

          {/* =========================
              REPORT FORM
          ========================= */}

          {role === ROLES.REGISTERED &&
            !isArticleAuthor &&
            !hasReported &&
            reportFormOpen && (

              <form
                className="report-form"
                onSubmit={
                  handleReportSubmit
                }
              >

                <h3>
                  Report this article
                </h3>

                <div className="form-group">

                  <label
                    htmlFor="report-reason"
                  >
                    Reason
                  </label>

                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(event) =>
                      setReportReason(
                        event.target
                          .value as ReportReason,
                      )
                    }
                    disabled={
                      reportLoading
                    }
                  >

                    <option value="misinformation">
                      Misinformation
                    </option>

                    <option value="inappropriate">
                      Inappropriate content
                    </option>

                    <option value="spam">
                      Spam
                    </option>

                    <option value="harassment">
                      Harassment
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label
                    htmlFor="report-details"
                  >
                    Additional details
                    (optional)
                  </label>

                  <textarea
                    id="report-details"
                    value={reportDetails}
                    onChange={(event) =>
                      setReportDetails(
                        event.target.value,
                      )
                    }
                    placeholder="Explain why you are reporting this article..."
                    maxLength={500}
                    rows={4}
                    disabled={
                      reportLoading
                    }
                  />

                  <small>
                    {reportDetails.length}
                    /500
                  </small>

                </div>

                {reportError && (
                  <p className="form-error">
                    {reportError}
                  </p>
                )}

                <div className="report-form-actions">

                  <button
                    type="button"
                    disabled={
                      reportLoading
                    }
                    onClick={() => {
                      setReportFormOpen(
                        false,
                      );

                      setReportError("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      reportLoading
                    }
                  >
                    {reportLoading
                      ? "Submitting..."
                      : "Submit Report"}
                  </button>

                </div>

              </form>
            )}

        </header>

        {/* =========================
            ARTICLE CONTENT
        ========================= */}

        <div className="article-content">

          {article.content
            .split("\n")
            .filter(
              (paragraph) =>
                paragraph.trim() !== "",
            )
            .map(
              (paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ),
            )}

        </div>

      </article>


      {/* =========================
          CREDIBILITY RATING
      ========================= */}

      <section
        className="credibility-section"
        aria-labelledby="credibility-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Community rating
            </p>

            <h2 id="credibility-heading">
              Community credibility
            </h2>
          </div>
        </div>

        <div className="credibility-summary">
          <div className="rating-display">
            <strong>
              {averageRating.toFixed(1)}
            </strong>

            <span>
              {" "}/ 5
            </span>
          </div>

          <p>
            {ratingCount === 0
              ? "No ratings yet"
              : `Based on ${ratingCount} ${
                  ratingCount === 1
                    ? "rating"
                    : "ratings"
                }`}
          </p>
        </div>

        {/* =========================
            REGISTERED USER RATING
        ========================= */}

        {role === ROLES.REGISTERED &&
          !isArticleAuthor && (
            <div className="user-rating">
              <p>
                {userRating
                  ? "Your rating"
                  : "Rate this article"}
              </p>

              <div
                className="rating-stars"
                onMouseLeave={() =>
                  setHoverRating(null)
                }
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => {
                    const activeRating =
                      hoverRating ??
                      userRating ??
                      0;

                    return (
                      <button
                        key={star}
                        type="button"
                        className={
                          star <= activeRating
                            ? "rating-star active"
                            : "rating-star"
                        }
                        aria-label={`${star} star rating`}
                        disabled={
                          ratingLoading
                        }
                        onMouseEnter={() =>
                          setHoverRating(
                            star,
                          )
                        }
                        onFocus={() =>
                          setHoverRating(
                            star,
                          )
                        }
                        onBlur={() =>
                          setHoverRating(
                            null,
                          )
                        }
                        onClick={() =>
                          handleRating(
                            star,
                          )
                        }
                      >
                        ★
                      </button>
                    );
                  },
                )}
              </div>

              {userRating && (
                <p>
                  You rated this
                  article{" "}
                  <strong>
                    {userRating}/5
                  </strong>
                </p>
              )}

              {ratingError && (
                <p className="form-error">
                  {ratingError}
                </p>
              )}

              {ratingSuccess && (
                <p className="form-success">
                  {ratingSuccess}
                </p>
              )}
            </div>
          )}

        {role === ROLES.GUEST && (
          <p>
            Sign in to rate this
            article.
          </p>
        )}

        {role === ROLES.REGISTERED &&
          isArticleAuthor && (
            <p>
              You cannot rate your
              own article.
            </p>
          )}
      </section>

      {/* =========================
          COMMENTS
      ========================= */}

      <section
        className="comments-section"
        aria-labelledby="comments-heading"
      >

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              Community discussion
            </p>

            <h2 id="comments-heading">
              Comments
            </h2>

          </div>

          <p>
            {comments.length}{" "}
            {comments.length === 1
              ? "comment"
              : "comments"}
          </p>

        </div>

        {/* =========================
            ADD COMMENT
            Registered users only
        ========================= */}

        {role === ROLES.REGISTERED ? (

          <form
            className="comment-form"
            onSubmit={
              handleCommentSubmit
            }
          >

            <label
              htmlFor="comment-text"
            >
              Add a comment
            </label>

            <textarea
              id="comment-text"
              value={commentText}
              onChange={(event) =>
                setCommentText(
                  event.target.value,
                )
              }
              placeholder="Share your thoughts..."
              rows={4}
              disabled={
                postingComment
              }
              required
            />

            <div className="comment-form-actions">

              <span>
                Commenting as{" "}
                {user?.full_name ??
                  user?.username}
              </span>

              <button
                className="primary-button"
                type="submit"
                disabled={
                  postingComment ||
                  !commentText.trim()
                }
              >
                {postingComment
                  ? "Posting..."
                  : "Post comment"}
              </button>

            </div>

          </form>

        ) : role === ROLES.GUEST ? (

          <div className="comment-login-prompt">

            <p>
              Sign in to join the
              discussion.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Sign in
            </button>

          </div>

        ) : null}

        {/* =========================
            COMMENT ERROR
        ========================= */}

        {commentError && (
          <p className="form-error">
            {commentError}
          </p>
        )}

        {/* =========================
            COMMENTS LOADING
        ========================= */}

        {commentsLoading && (
          <p>
            Loading comments...
          </p>
        )}

        {/* =========================
            COMMENTS LIST
        ========================= */}

        {!commentsLoading &&
          comments.length > 0 && (

            <div className="comments-list">

              {comments.map(
                (comment) => (

                  <article
                    className="comment"
                    key={
                      comment.comment_id
                    }
                  >

                    {/* =========================
                        COMMENT HEADER
                    ========================= */}

                    <div className="comment-header">

                      <div>

                        <strong>
                          {comment.full_name ||
                            comment.username}
                        </strong>

                        <span>
                          {new Date(
                            comment.created_at,
                          ).toLocaleString()}
                        </span>

                      </div>

                      {/* =========================
                          COMMENT OWNER ACTIONS
                      ========================= */}

                      {user?.user_id ===
                        comment.user_id && (

                          <div className="comment-actions">

                            {editingCommentId !==
                              comment.comment_id && (

                                <>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startEditingComment(
                                        comment,
                                      )
                                    }
                                    disabled={
                                      commentActionLoading
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(
                                        comment.comment_id,
                                      )
                                    }
                                    disabled={
                                      commentActionLoading
                                    }
                                  >
                                    Delete
                                  </button>

                                </>

                              )}

                          </div>

                        )}

                    </div>

                    {/* =========================
                        EDIT COMMENT MODE
                    ========================= */}

                    {editingCommentId ===
                      comment.comment_id ? (

                      <div className="comment-edit-form">

                        <textarea
                          value={
                            editingCommentText
                          }
                          onChange={(event) =>
                            setEditingCommentText(
                              event.target.value,
                            )
                          }
                          rows={3}
                          disabled={
                            commentActionLoading
                          }
                        />

                        <div className="comment-edit-actions">

                          <button
                            type="button"
                            onClick={
                              cancelEditingComment
                            }
                            disabled={
                              commentActionLoading
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              handleUpdateComment(
                                comment.comment_id,
                              )
                            }
                            disabled={
                              commentActionLoading ||
                              !editingCommentText.trim()
                            }
                          >
                            {commentActionLoading
                              ? "Saving..."
                              : "Save"}
                          </button>

                        </div>

                      </div>

                    ) : (

                      <>

                        <p className="comment-text">
                          {
                            comment.comment_text
                          }
                        </p>

                        {Boolean(
                          comment.is_edited,
                        ) && (

                            <span className="comment-edited">
                              Edited
                            </span>

                          )}

                      </>

                    )}

                  </article>

                ),
              )}

            </div>

          )}

        {/* =========================
            NO COMMENTS
        ========================= */}

        {!commentsLoading &&
          !commentError &&
          comments.length === 0 && (

            <div className="empty-state">

              <h3>
                No comments yet
              </h3>

              <p>
                Be the first to join
                the discussion.
              </p>

            </div>

          )}

      </section>

    </main>
  );
}

export default ArticleView;