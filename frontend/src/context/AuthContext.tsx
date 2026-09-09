import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type User,
} from "../services/auth";

import { ROLES, type Role } from "../constants/roles";

type AuthContextType = {
  user: User | null;
  role: Role;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<User>;

  signOut: () => Promise<void>;

  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadUser = async () => {
    try {
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);
    } catch (error) {
      console.error(
        "Unable to load user:",
        error,
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  loadUser();
}, []);

  const signIn = async (
    email: string,
    password: string,
  ) => {
    const loggedInUser = await loginRequest(
      email,
      password,
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const role: Role = user?.role ?? ROLES.GUEST;

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, role, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}