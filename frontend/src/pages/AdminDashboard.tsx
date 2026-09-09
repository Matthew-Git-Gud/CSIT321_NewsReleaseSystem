import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  deleteAdminArticle,
  getAdminDashboard,
  getPendingReports,
  updateReportStatus,
  type AdminArticle,
  type AdminArticleReport,
  type AdminCategory,
  type DashboardSummary,
  type ReportReviewStatus,
} from "../services/admin";

import {
  getPendingAppeals,
  reviewAppeal,
  type SuspensionAppeal,
  type AppealReviewStatus,
} from "../services/appeals";

import { useAuth } from "../context/AuthContext";

import "../styles/AdminDashboard.css";

const emptySummary: DashboardSummary = {
  totalArticles: 0,
  publishedArticles: 0,
  draftArticles: 0,
  deletedArticles: 0,
};

function AdminDashboard() {
  const navigate =
    useNavigate();

  const { user } = useAuth();

  // =========================
  // APPEAL STATE
  // =========================

  const [
    appeals,
    setAppeals,
  ] = useState<SuspensionAppeal[]>(
    [],
  );

  const [
    appealsLoading,
    setAppealsLoading,
  ] = useState(true);

  const [
    appealError,
    setAppealError,
  ] = useState("");

  const [
    appealActionId,
    setAppealActionId,
  ] = useState<number | null>(
    null,
  );

  // =========================
  // ARTICLE STATE
  // =========================

  const [
    deletingArticleId,
    setDeletingArticleId,
  ] = useState<number | null>(
    null,
  );

  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary>(
      emptySummary,
    );

  const [
    categories,
    setCategories,
  ] =
    useState<AdminCategory[]>(
      [],
    );

  const [
    articles,
    setArticles,
  ] =
    useState<AdminArticle[]>(
      [],
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =========================
  // REPORT STATE
  // =========================

  const [
    reports,
    setReports,
  ] =
    useState<AdminArticleReport[]>(
      [],
    );

  const [
    reportsLoading,
    setReportsLoading,
  ] = useState(true);

  const [
    reportError,
    setReportError,
  ] = useState("");

  const [
    reportActionId,
    setReportActionId,
  ] = useState<number | null>(
    null,
  );

  // =========================
  // LOAD DASHBOARD
  // =========================

  useEffect(() => {
    const delay =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);
            setError("");

            const data =
              await getAdminDashboard({
                search,
                status,
                categoryId,
              });

            setSummary(
              data.summary,
            );

            setCategories(
              data.categories,
            );

            setArticles(
              data.articles,
            );
          } catch (
          requestError
          ) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to load dashboard",
            );
          } finally {
            setLoading(false);
          }
        },

        search ? 250 : 0,
      );

    return () =>
      window.clearTimeout(
        delay,
      );
  }, [
    search,
    status,
    categoryId,
  ]);

  // =========================
  // LOAD PENDING REPORTS
  // =========================

  useEffect(() => {
    const loadReports =
      async () => {
        try {
          setReportsLoading(true);
          setReportError("");

          const result =
            await getPendingReports();

          setReports(result);
        } catch (
        requestError
        ) {
          setReportError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load reports",
          );
        } finally {
          setReportsLoading(false);
        }
      };

    loadReports();
  }, []);

  // =========================
  // LOAD PENDING APPEALS
  // =========================

  useEffect(() => {
    const loadAppeals =
      async () => {
        try {
          setAppealsLoading(
            true,
          );

          setAppealError("");

          const result =
            await getPendingAppeals();

          setAppeals(result);
        } catch (requestError) {
          setAppealError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load appeals",
          );
        } finally {
          setAppealsLoading(
            false,
          );
        }
      };

    loadAppeals();
  }, []);

  // =========================
  // DELETE ARTICLE
  // =========================

  const handleDeleteArticle =
    async (
      article: AdminArticle,
    ) => {
      if (
        article.status ===
        "deleted"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${article.title}"?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingArticleId(
          article.article_id,
        );

        setError("");

        await deleteAdminArticle(
          article.article_id,
        );

        setArticles(
          (currentArticles) =>
            currentArticles.map(
              (currentArticle) =>
                currentArticle.article_id ===
                  article.article_id
                  ? {
                    ...currentArticle,
                    status:
                      "deleted",
                  }
                  : currentArticle,
            ),
        );

        setSummary(
          (currentSummary) => ({
            ...currentSummary,

            publishedArticles:
              article.status ===
                "published"
                ? Math.max(
                  0,
                  currentSummary.publishedArticles -
                  1,
                )
                : currentSummary.publishedArticles,

            draftArticles:
              article.status ===
                "draft"
                ? Math.max(
                  0,
                  currentSummary.draftArticles -
                  1,
                )
                : currentSummary.draftArticles,

            deletedArticles:
              currentSummary.deletedArticles +
              1,
          }),
        );
      } catch (
      requestError
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to delete article",
        );
      } finally {
        setDeletingArticleId(
          null,
        );
      }
    };

  // =========================
  // REVIEW / DISMISS REPORT
  // =========================

  const handleReportAction =
    async (
      reportId: number,
      newStatus: ReportReviewStatus,
    ) => {
      const actionText =
        newStatus === "reviewed"
          ? "mark this report as reviewed"
          : "dismiss this report";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${actionText}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setReportActionId(
          reportId,
        );

        setReportError("");

        await updateReportStatus(
          reportId,
          newStatus,
        );

        // The endpoint only returns
        // pending reports, so remove it
        // from the table after action.
        setReports(
          (currentReports) =>
            currentReports.filter(
              (report) =>
                report.report_id !==
                reportId,
            ),
        );
      } catch (
      requestError
      ) {
        setReportError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update report",
        );
      } finally {
        setReportActionId(
          null,
        );
      }
    };

  // =========================
  // REVIEW APPEAL
  // =========================

  const handleAppealAction =
    async (
      appeal: SuspensionAppeal,
      newStatus: AppealReviewStatus,
    ) => {
      const actionText =
        newStatus === "approved"
          ? "approve"
          : "reject";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${actionText} ${appeal.full_name}'s appeal?`,
        );

      if (!confirmed) {
        return;
      }

      let adminResponse:
        | string
        | undefined;

      if (
        newStatus === "rejected"
      ) {
        const response =
          window.prompt(
            "Reason for rejecting this appeal (optional):",
          );

        // Cancel prompt
        if (response === null) {
          return;
        }

        adminResponse =
          response.trim();
      }

      try {
        setAppealActionId(
          appeal.appeal_id,
        );

        setAppealError("");

        await reviewAppeal(
          appeal.appeal_id,
          newStatus,
          adminResponse,
        );

        // Endpoint only returns pending
        // appeals, so remove reviewed one.
        setAppeals(
          (currentAppeals) =>
            currentAppeals.filter(
              (currentAppeal) =>
                currentAppeal.appeal_id !==
                appeal.appeal_id,
            ),
        );
      } catch (requestError) {
        setAppealError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to review appeal",
        );
      } finally {
        setAppealActionId(
          null,
        );
      }
    };

  return (
    <main className="admin-page">
      <section
        className="admin-content"
        aria-labelledby="admin-title"
      >

        {/* =========================
            DASHBOARD HEADER
        ========================= */}

        <div className="admin-title-row">

          <div>
            <p className="eyebrow">
              Overview
            </p>

            <h1 id="admin-title">
              Admin dashboard
            </h1>

            {user && (
              <p className="admin-welcome">
                Signed in as{" "}
                {user.full_name}
              </p>
            )}
          </div>

          <p className="system-status">
            <span aria-hidden="true">
              ●
            </span>{" "}
            System status:
            Operational
          </p>

        </div>

        {/* =========================
            SUMMARY METRICS
        ========================= */}

        <div
          className="admin-metrics"
          aria-label="Article summary"
        >
          <Metric
            label="Total articles"
            value={
              summary.totalArticles
            }
          />

          <Metric
            label="Published"
            value={
              summary.publishedArticles
            }
            tone="positive"
          />

          <Metric
            label="Drafts"
            value={
              summary.draftArticles
            }
            tone="warning"
          />

          <Metric
            label="Deleted"
            value={
              summary.deletedArticles
            }
            tone="neutral"
          />
        </div>

        {/* =========================
            ARTICLE MANAGEMENT
        ========================= */}

        <section
          className="article-management"
          aria-labelledby="all-articles-heading"
        >
          <div className="article-management-heading">

            <h2 id="all-articles-heading">
              All articles
            </h2>

            <div className="admin-filters">

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search title or author"
                aria-label="Search articles"
              />

              <select
                value={status}
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value,
                  )
                }
                aria-label="Filter by status"
              >
                <option value="">
                  All statuses
                </option>

                <option value="published">
                  Published
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="deleted">
                  Deleted
                </option>
              </select>

              <select
                value={categoryId}
                onChange={(
                  event,
                ) =>
                  setCategoryId(
                    event.target
                      .value,
                  )
                }
                aria-label="Filter by category"
              >
                <option value="">
                  All categories
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
                      {
                        category.name
                      }
                    </option>
                  ),
                )}
              </select>

            </div>
          </div>

          {/* =========================
              ARTICLE TABLE
          ========================= */}

          {error ? (
            <p className="form-error admin-message">
              {error}
            </p>
          ) : loading ? (
            <p className="admin-empty">
              Loading articles...
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table>

                <thead>
                  <tr>
                    <th scope="col">
                      ID
                    </th>

                    <th scope="col">
                      Title
                    </th>

                    <th scope="col">
                      Author
                    </th>

                    <th scope="col">
                      Category
                    </th>

                    <th scope="col">
                      Date
                    </th>

                    <th scope="col">
                      Status
                    </th>

                    <th scope="col">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {articles.length >
                    0 ? (

                    articles.map(
                      (article) => (

                        <tr
                          key={
                            article.article_id
                          }
                        >

                          <td>
                            A-
                            {
                              article.article_id
                            }
                          </td>

                          <td>
                            {
                              article.title
                            }
                          </td>

                          <td>
                            @
                            {
                              article.author
                            }
                          </td>

                          <td>
                            {
                              article.category
                            }
                          </td>

                          <td>
                            {new Date(
                              article.created_at,
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${article.status}`}
                            >
                              {
                                article.status
                              }
                            </span>
                          </td>

                          <td>

                            {article.status ===
                              "deleted" ? (

                              <span>
                                —
                              </span>

                            ) : (

                              <div className="admin-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/admin/articles/${article.article_id}/edit`,
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="admin-suspend-button"
                                  disabled={
                                    deletingArticleId ===
                                    article.article_id
                                  }
                                  onClick={() =>
                                    handleDeleteArticle(
                                      article,
                                    )
                                  }
                                >
                                  {deletingArticleId ===
                                    article.article_id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>

                              </div>

                            )}

                          </td>

                        </tr>

                      ),
                    )

                  ) : (

                    <tr>
                      <td
                        className="admin-empty"
                        colSpan={7}
                      >
                        No articles
                        found for
                        these filters.
                      </td>
                    </tr>

                  )}

                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* =========================
            REPORTED ARTICLES
        ========================= */}

        <section
          className="article-management report-management"
          aria-labelledby="reported-articles-heading"
        >

          <div className="article-management-heading">

            <div>
              <p className="eyebrow">
                Moderation
              </p>

              <h2 id="reported-articles-heading">
                Reported articles
              </h2>
            </div>

            <span className="status-badge pending">
              {reports.length} pending
            </span>

          </div>

          {/* =========================
              REPORT ERROR
          ========================= */}

          {reportError && (
            <p className="form-error admin-message">
              {reportError}
            </p>
          )}

          {/* =========================
              REPORTS LOADING
          ========================= */}

          {reportsLoading ? (

            <p className="admin-empty">
              Loading reports...
            </p>

          ) : reports.length === 0 ? (

            <div className="admin-empty">
              No pending article
              reports.
            </div>

          ) : (

            <div className="admin-table-wrap">

              <table>

                <thead>
                  <tr>

                    <th scope="col">
                      Report
                    </th>

                    <th scope="col">
                      Article
                    </th>

                    <th scope="col">
                      Author
                    </th>

                    <th scope="col">
                      Reported by
                    </th>

                    <th scope="col">
                      Reason
                    </th>

                    <th scope="col">
                      Details
                    </th>

                    <th scope="col">
                      Date
                    </th>

                    <th scope="col">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {reports.map(
                    (report) => (

                      <tr
                        key={
                          report.report_id
                        }
                      >

                        <td>
                          R-
                          {
                            report.report_id
                          }
                        </td>

                        <td>
                          <Link
                            to={`/articles/${report.article_id}`}
                          >
                            {
                              report.article_title
                            }
                          </Link>
                        </td>

                        <td>
                          {report.author_name ||
                            `@${report.author_username}`}
                        </td>

                        <td>
                          {report.reporter_name ||
                            `@${report.reporter_username}`}
                        </td>

                        <td>
                          <span className="status-badge pending">
                            {
                              formatReportReason(
                                report.reason,
                              )
                            }
                          </span>
                        </td>

                        <td>
                          {report.details ||
                            "—"}
                        </td>

                        <td>
                          {new Date(
                            report.created_at,
                          ).toLocaleDateString()}
                        </td>

                        <td>

                          <div className="admin-actions">

                            <button
                              type="button"
                              disabled={
                                reportActionId ===
                                report.report_id
                              }
                              onClick={() =>
                                handleReportAction(
                                  report.report_id,
                                  "reviewed",
                                )
                              }
                            >
                              {reportActionId ===
                                report.report_id
                                ? "Updating..."
                                : "Accept report"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                reportActionId ===
                                report.report_id
                              }
                              onClick={() =>
                                handleReportAction(
                                  report.report_id,
                                  "dismissed",
                                )
                              }
                            >
                              Dismiss
                            </button>

                          </div>

                        </td>

                      </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>
        {/* =========================
    SUSPENSION APPEALS
========================= */}

        <section
          className="article-management report-management"
          aria-labelledby="suspension-appeals-heading"
        >
          <div className="article-management-heading">
            <div>
              <p className="eyebrow">
                User moderation
              </p>

              <h2 id="suspension-appeals-heading">
                Suspension appeals
              </h2>
            </div>

            <span className="status-badge pending">
              {appeals.length} pending
            </span>
          </div>

          {/* =========================
      APPEAL ERROR
  ========================= */}

          {appealError && (
            <p className="form-error admin-message">
              {appealError}
            </p>
          )}

          {/* =========================
      APPEALS
  ========================= */}

          {appealsLoading ? (
            <p className="admin-empty">
              Loading suspension
              appeals...
            </p>
          ) : appeals.length === 0 ? (
            <div className="admin-empty">
              No pending suspension
              appeals.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      Appeal
                    </th>

                    <th scope="col">
                      User
                    </th>

                    <th scope="col">
                      Email
                    </th>

                    <th scope="col">
                      Reason
                    </th>

                    <th scope="col">
                      Submitted
                    </th>

                    <th scope="col">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {appeals.map(
                    (appeal) => (
                      <tr
                        key={
                          appeal.appeal_id
                        }
                      >
                        <td>
                          AP-
                          {
                            appeal.appeal_id
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              appeal.full_name
                            }
                          </strong>

                          <br />

                          <small>
                            @
                            {
                              appeal.username
                            }
                          </small>
                        </td>

                        <td>
                          {appeal.email}
                        </td>

                        <td>
                          {appeal.reason}
                        </td>

                        <td>
                          {new Date(
                            appeal.submitted_at,
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="admin-actions">
                            <button
                              type="button"
                              disabled={
                                appealActionId ===
                                appeal.appeal_id
                              }
                              onClick={() =>
                                handleAppealAction(
                                  appeal,
                                  "approved",
                                )
                              }
                            >
                              {appealActionId ===
                                appeal.appeal_id
                                ? "Updating..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              className="admin-suspend-button"
                              disabled={
                                appealActionId ===
                                appeal.appeal_id
                              }
                              onClick={() =>
                                handleAppealAction(
                                  appeal,
                                  "rejected",
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

// =========================
// REPORT REASON LABEL
// =========================

function formatReportReason(
  reason: AdminArticleReport["reason"],
) {
  switch (reason) {
    case "misinformation":
      return "Misinformation";

    case "inappropriate":
      return "Inappropriate";

    case "spam":
      return "Spam";

    case "harassment":
      return "Harassment";

    case "other":
      return "Other";

    default:
      return reason;
  }
}

// =========================
// METRIC
// =========================

type MetricProps = {
  label: string;
  value: number;
  tone?: string;
};

function Metric({
  label,
  value,
  tone = "default",
}: MetricProps) {
  return (
    <article
      className={`admin-metric ${tone}`}
    >
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </article>
  );
}

export default AdminDashboard;