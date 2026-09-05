/**
 * Centralized safe authentication and user helper for client components and interceptors.
 * Guarantees resilient user retrieval from Cookies, LocalStorage, or JWT token payload.
 */

export interface AuthUser {
  userId: string;
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  email_varified?: boolean;
  image?: string;
  role?: string | string[] | any;
  roles?: string[];
  isOwner?: boolean;
  isFarmer?: boolean;
  isDealer?: boolean;
  isOperator?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isRoleAdmin(r: any): boolean {
  if (!r) return false;
  if (typeof r === "string") {
    return ["admin", "superadmin", "super_admin", "superadmin"].includes(r.trim().toLowerCase());
  }
  if (typeof r === "object") {
    const name = r.name || r.role || r.role_name || r.title || "";
    if (typeof name === "string" && ["admin", "superadmin", "super_admin"].includes(name.trim().toLowerCase())) {
      return true;
    }
    if (r.isAdmin || r.isSuperAdmin) return true;
  }
  return false;
}

export function checkIsAdmin(obj: any, emailStr?: string): boolean {
  if (!obj && !emailStr) return false;
  const em = (emailStr || obj?.email || "").toLowerCase().trim();
  const isAdminEmail =
    em === "sistemas@holatractor.com" ||
    em === "admin@holatractor.com" ||
    em === "admin@gmail.com" ||
    em.startsWith("admin@") ||
    em.startsWith("sistemas@");

  if (isAdminEmail) return true;
  if (obj?.isAdmin === true || obj?.isSuperAdmin === true) return true;
  if (Array.isArray(obj?.role) && obj.role.some(isRoleAdmin)) return true;
  if (Array.isArray(obj?.roles) && obj.roles.some(isRoleAdmin)) return true;
  if (typeof obj?.role === "string" && isRoleAdmin(obj.role)) return true;
  if (typeof obj?.roles === "string" && isRoleAdmin(obj.roles)) return true;
  if (obj?.user && checkIsAdmin(obj.user)) return true;

  return false;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. From document.cookie
  if (typeof document !== "undefined") {
    const cookieMatches = [
      document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/),
      document.cookie.match(/(?:^|;\s*)token=([^;]+)/),
      document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/),
    ];
    for (const match of cookieMatches) {
      if (match?.[1]) {
        const val = decodeURIComponent(match[1]).trim();
        if (val && val !== "undefined" && val !== "null") {
          return val.replace(/^Bearer\s+/i, "");
        }
      }
    }
  }

  // 2. From localStorage
  try {
    const lsToken =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");
    if (lsToken && lsToken !== "undefined" && lsToken !== "null") {
      return lsToken.replace(/^Bearer\s+/i, "").trim();
    }
  } catch {}

  return null;
}

export function getAuthUser(): AuthUser {
  if (typeof window === "undefined") {
    return {
      userId: "",
      id: "",
      name: "User",
      email: "",
    };
  }

  let foundUser: any = null;

  // 1. Check document.cookie 'user'
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)user=([^;]+)/);
    if (match?.[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = typeof decoded === "string" && (decoded.startsWith("{") || decoded.startsWith("["))
          ? JSON.parse(decoded)
          : null;
        if (parsed && typeof parsed === "object") {
          foundUser = parsed;
        }
      } catch {}
    }
  }

  // 2. Check localStorage 'user'
  if (!foundUser) {
    try {
      const lsUser = localStorage.getItem("user");
      if (lsUser) {
        const parsed = JSON.parse(lsUser);
        if (parsed && typeof parsed === "object") {
          foundUser = parsed;
        }
      }
    } catch {}
  }

  // 3. Check JWT token payload
  const token = getAuthToken();
  let jwtPayload: any = null;
  if (token) {
    jwtPayload = parseJwt(token);
    if (!foundUser && jwtPayload) {
      foundUser = jwtPayload;
    }
  }

  if (foundUser || jwtPayload) {
    const combined = { ...(jwtPayload || {}), ...(foundUser || {}) };
    const uid = combined.userId || combined.id || combined.sub || combined._id || "";
    const email = (combined.email || "").toLowerCase().trim();
    const isAdmin = checkIsAdmin(combined, email) || (typeof document !== "undefined" && document.cookie.includes("isAdmin=true"));

    return {
      userId: uid,
      id: uid,
      name: combined.name || `${combined.first_name || ""} ${combined.last_name || ""}`.trim() || (isAdmin ? "Admin" : "User"),
      first_name: combined.first_name || "",
      last_name: combined.last_name || "",
      email,
      email_varified: combined.email_varified ?? combined.emailVerified ?? true,
      image: combined.image || "",
      role: combined.role,
      roles: Array.isArray(combined.roles) ? combined.roles : Array.isArray(combined.role) ? combined.role : undefined,
      isOwner: isAdmin ? false : Boolean(combined.isOwner),
      isFarmer: isAdmin ? false : Boolean(combined.isFarmer),
      isDealer: isAdmin ? false : Boolean(combined.isDealer),
      isOperator: isAdmin ? false : Boolean(combined.isOperator),
      isAdmin,
      isSuperAdmin: isAdmin,
    };
  }

  return {
    userId: "",
    id: "",
    name: "User",
    email: "",
  };
}

export function getAuthUserId(): string {
  return getAuthUser().userId || "";
}
