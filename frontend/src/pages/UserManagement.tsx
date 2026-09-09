import {
  useEffect,
  useState,
} from "react";

import {
  getAdminUsers,
  updateUserStatus,
  type AdminUser,
} from "../services/admin";

import "../styles/AdminDashboard.css";

function UserManagement() {
  const [
    users,
    setUsers,
  ] = useState<AdminUser[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingUserId,
    setUpdatingUserId,
  ] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const delay =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);
            setError("");

            const loadedUsers =
              await getAdminUsers(
                search,
              );

            setUsers(
              loadedUsers,
            );
          } catch (
            requestError
          ) {
            setError(
              requestError instanceof
                Error
                ? requestError.message
                : "Unable to load users",
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
  }, [search]);

  const handleStatusChange =
    async (
      user: AdminUser,
    ) => {
      const newStatus =
        user.status === "active"
          ? "suspended"
          : "active";

      const action =
        newStatus === "suspended"
          ? "suspend"
          : "reactivate";

      const confirmed =
        window.confirm(
          `Are you sure you want to ${action} ${user.username}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setUpdatingUserId(
          user.user_id,
        );

        setError("");

        await updateUserStatus(
          user.user_id,
          newStatus,
        );

        setUsers(
          (currentUsers) =>
            currentUsers.map(
              (currentUser) =>
                currentUser.user_id ===
                user.user_id
                  ? {
                      ...currentUser,
                      status:
                        newStatus,
                    }
                  : currentUser,
            ),
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to update user",
        );
      } finally {
        setUpdatingUserId(
          null,
        );
      }
    };

  return (
    <main className="admin-page">
      <section className="admin-content">

        <div className="admin-title-row">
          <div>
            <p className="eyebrow">
              Administration
            </p>

            <h1>
              User Management
            </h1>

            <p className="admin-welcome">
              Manage registered
              user accounts.
            </p>
          </div>
        </div>

        <section className="article-management">

          <div className="article-management-heading">
            <div>
              <h2>
                Users
              </h2>

              <p className="admin-welcome">
                {users.length}{" "}
                {users.length === 1
                  ? "user"
                  : "users"}
              </p>
            </div>

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
                placeholder="Search users"
                aria-label="Search users"
              />
            </div>
          </div>

          {error && (
            <p className="form-error admin-message">
              {error}
            </p>
          )}

          {loading ? (
            <p className="admin-empty">
              Loading users...
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      ID
                    </th>

                    <th>
                      User
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.length >
                  0 ? (
                    users.map(
                      (user) => (
                        <tr
                          key={
                            user.user_id
                          }
                        >
                          <td>
                            {
                              user.user_id
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                user.full_name
                              }
                            </strong>

                            <br />

                            <span>
                              @
                              {
                                user.username
                              }
                            </span>
                          </td>

                          <td>
                            {
                              user.email
                            }
                          </td>

                          <td>
                            {
                              user.role
                            }
                          </td>

                          <td>
                            {new Date(
                              user.created_at,
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                user.status ===
                                "active"
                                  ? "published"
                                  : "deleted"
                              }`}
                            >
                              {
                                user.status
                              }
                            </span>
                          </td>

                          <td>
                            {user.role ===
                            "admin" ? (
                              <span>
                                —
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={
                                  user.status ===
                                  "active"
                                    ? "admin-suspend-button"
                                    : "admin-reactivate-button"
                                }
                                disabled={
                                  updatingUserId ===
                                  user.user_id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    user,
                                  )
                                }
                              >
                                {updatingUserId ===
                                user.user_id
                                  ? "Updating..."
                                  : user.status ===
                                      "active"
                                    ? "Suspend"
                                    : "Reactivate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          7
                        }
                        className="admin-empty"
                      >
                        No users
                        found.
                      </td>
                    </tr>
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

export default UserManagement;