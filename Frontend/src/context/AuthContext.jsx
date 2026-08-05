import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiMe, setToken } from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

/**
 * User object comes from the backend User model:
 * { id, fullName, email, mobile, role: CUSTOMER|SERVICE_PROVIDER|ADMIN,
 *   averageRating, totalReviews, otpVerified, isVerified, createdAt }
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await apiMe();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sociosphere_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  /** Called with the JWT from login/verify-login-otp/google hash. */
  const login = (token) => {
    setToken(token);
    return refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isProvider = user?.role === "SERVICE_PROVIDER";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthCtx.Provider value={{ user, loading, refresh, login, logout, updateUser: setUser, isProvider, isAdmin }}>
      {children}
    </AuthCtx.Provider>
  );
}
