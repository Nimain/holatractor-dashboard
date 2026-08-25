"use client"; // Add this at the top

import type React from "react";
import { useCookie } from "next-cookie";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import { decode } from "jsonwebtoken";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Eye, EyeOff, Smartphone, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useLoading } from "../wrappers/LoaderWrappers";
import SwitchAccountModal from "../wrappers/SwitchAccountModal";
import PasswordlessPushLogin from "./PasswordlessPushLogin";
import FarmerBrandIcon from "@/components/Common/FarmerBrandIcon";

const LogInPage = () => {
  const [authMethod, setAuthMethod] = useState<"push" | "password">("push");
  const [email, setEmail] = useState("");
  const [passwrd, setPassword] = useState("");
  const [passwrdShow, setPasswordShow] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { cookie } = useCookie();
  const { setLoading, isLoading } = useLoading();

  const verifyToken = async (token: string) => {
    setLoading(true);
    try {
      const res = await renderInstance.patch(
        `/user/email_token_verify/${token}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data === "Verification failed") {
        errorMessage("Failed to verify email");
      } else {
        successMessage("Email verified successfully");
      }
    } catch (err: any) {
      // console.error("Email verification error:", err); // Commented out
      errorMessage(err.response?.data?.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const setCookiesAndRedirect = (data: any) => {
    const payload = data?.data && typeof data.data === "object" ? { ...data.data, ...data } : data;
    const token = payload?.access_token || payload?.accessToken || payload?.token;

    if (!token) {
      errorMessage("Authentication token missing in response");
      return;
    }

    let rawUser: any = {};
    try {
      if (token && typeof token === "string" && token.includes(".")) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        rawUser = JSON.parse(jsonPayload);
      }
    } catch (e) {
      try {
        rawUser = decode(token) || {};
      } catch (_) {}
    }

    const user = {
      ...rawUser,
      userId:
        rawUser?.userId ||
        rawUser?.id ||
        rawUser?.sub ||
        rawUser?._id ||
        payload?.user?.id ||
        payload?.user?.userId ||
        payload?.userId ||
        payload?.id ||
        "",
      name:
        rawUser?.name ||
        `${rawUser?.first_name || ""} ${rawUser?.last_name || ""}`.trim() ||
        payload?.user?.name ||
        payload?.name ||
        "User",
      email: rawUser?.email || payload?.user?.email || payload?.email || "",
      email_varified: rawUser?.email_varified ?? rawUser?.emailVerified ?? true,
      image: rawUser?.image || payload?.user?.image || payload?.image || "",
    };
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const isOwner =
      payload.isOwner === true ||
      payload?.user?.isOwner === true ||
      rawUser?.isOwner === true ||
      (Array.isArray(payload.role) && payload.role.includes("owner")) ||
      (Array.isArray(payload?.user?.role) && payload.user.role.includes("owner")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("owner")) ||
      payload.role === "owner" ||
      rawUser?.role === "owner";
    const isDealer =
      payload.isDealer === true ||
      payload?.user?.isDealer === true ||
      rawUser?.isDealer === true ||
      (Array.isArray(payload.role) && payload.role.includes("dealer")) ||
      (Array.isArray(payload?.user?.role) && payload.user.role.includes("dealer")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("dealer")) ||
      payload.role === "dealer" ||
      rawUser?.role === "dealer";
    const isAgent =
      payload.isAgent === true ||
      payload?.user?.isAgent === true ||
      rawUser?.isAgent === true ||
      (Array.isArray(payload.role) && payload.role.includes("agent")) ||
      (Array.isArray(payload?.user?.role) && payload.user.role.includes("agent")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("agent")) ||
      payload.role === "agent" ||
      rawUser?.role === "agent";
    const isOperator =
      payload.isOperator === true ||
      payload?.user?.isOperator === true ||
      rawUser?.isOperator === true ||
      (Array.isArray(payload.role) && payload.role.includes("operator")) ||
      (Array.isArray(payload?.user?.role) && payload.user.role.includes("operator")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("operator")) ||
      payload.role === "operator" ||
      rawUser?.role === "operator";
    let isFarmer =
      payload.isFarmer === true ||
      payload?.user?.isFarmer === true ||
      rawUser?.isFarmer === true ||
      (Array.isArray(payload.role) && payload.role.includes("farmer")) ||
      (Array.isArray(payload?.user?.role) && payload.user.role.includes("farmer")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("farmer")) ||
      payload.role === "farmer" ||
      rawUser?.role === "farmer";

    if (!isOwner && !isDealer && !isAgent && !isOperator && !isFarmer) {
      isFarmer = true;
    }

    const setCookieValue = (name: string, val: string) => {
      cookie.set(name, val, { path: "/", expires: expiryDate });
      if (typeof document !== "undefined") {
        document.cookie = `${name}=${val}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax;`;
      }
    };

    setCookieValue("access_token", token);
    setCookieValue("token", token);
    setCookieValue("user", JSON.stringify(user));
    setCookieValue("isOwner", isOwner ? "true" : "false");
    setCookieValue("isDealer", isDealer ? "true" : "false");
    setCookieValue("isAgent", isAgent ? "true" : "false");
    setCookieValue("isOperator", isOperator ? "true" : "false");
    setCookieValue("isFarmer", isFarmer ? "true" : "false");

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access_token", token);
        localStorage.setItem("token", token);
      } catch {}
    }

    successMessage("Log in successful");

    const activeRolesCount = [isOwner, isDealer, isAgent, isOperator, isFarmer].filter(Boolean).length;

    // If user has multiple roles, open switch account modal
    if (activeRolesCount > 1) {
      setShowRoleSelector(true);
      return;
    }

    // Single role detected: set active_role cookie and navigate
    const singleRole = isFarmer
      ? "farmer"
      : isOwner
      ? "owner"
      : isDealer
      ? "dealer"
      : isAgent
      ? "agent"
      : isOperator
      ? "operator"
      : "farmer";

    setCookieValue("active_role", singleRole);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("active_role", singleRole);
      } catch {}
    }

    const redirectPath = `/${singleRole}`;

    if (typeof window !== "undefined") {
      window.location.href = redirectPath;
    } else {
      router.push(redirectPath);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const encryptedPassword = CryptoJS.AES.encrypt(
      passwrd,
      "m4AfXfQ&1brl3LjQFYO"
    ).toString();

    try {
      let resData: any = null;

      // 1. Primary: Try NestJS login
      try {
        const res = await renderInstance.post("/user/login", {
          email: email.trim(),
          password: encryptedPassword,
          authType: "EMAIL",
        });

        if ((res.status === 200 || res.status === 201) && (res.data?.access_token || res.data?.data?.access_token)) {
          resData = res.data;
        } else if (res.data === "Email verification link sent successfully") {
          successMessage("Email verification link sent successfully");
          return;
        }
      } catch (nestErr: any) {
        console.warn("NestJS login notice, trying fallback:", nestErr?.message);
      }

      // 2. Fallback: Try FastAPI tractorai.sinsignal.com
      if (!resData) {
        try {
          const fastApiUrl = "https://tractorai.sinsignal.com/user/login";
          const fastApiRes = await axios.post(
            fastApiUrl,
            { email: email.trim(), password: passwrd, authType: "EMAIL" },
            { timeout: 10000 }
          );
          if (
            (fastApiRes.status === 200 || fastApiRes.status === 201) &&
            (fastApiRes.data?.access_token || fastApiRes.data?.data?.access_token)
          ) {
            resData = fastApiRes.data;
          }
        } catch (fastErr: any) {
          console.warn("FastAPI login notice:", fastErr?.message);
        }
      }

      if (resData && (resData.access_token || resData.data?.access_token)) {
        setCookiesAndRedirect(resData);
        setEmail("");
        setPassword("");
      } else {
        errorMessage("Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message || "Some error occurred";
      const displayMsg = Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg;
      errorMessage(displayMsg);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verificationToken = searchParams.get("verificationToken");
    if (verificationToken) {
      verifyToken(verificationToken);
    }
  }, [searchParams]);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0C0505] flex items-stretch text-slate-900 dark:text-slate-100 selection:bg-[#E31B23] selection:text-white font-sans">
      {/* ── LEFT HERO: BRANDING & REAL-TIME PLATFORM SHOWCASE (DESKTOP) ── */}
      <div className="relative hidden lg:flex lg:w-[48%] xl:w-[52%] flex-col justify-between p-12 overflow-hidden bg-[#0F0304] text-white border-r border-red-950/60 shadow-2xl">
        {/* Background photo & rich atmospheric overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url("https://holadashboard.s3.us-west-2.amazonaws.com/tract.webp")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0203] via-[#160405]/95 to-red-950/40" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#E31B23]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C9141B]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FarmerBrandIcon size={46} className="rounded-2xl shadow-xl border border-red-500/30" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">HolaTractor</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E31B23]/20 text-red-300 border border-red-500/30">
                  Fleet OS
                </span>
              </div>
              <p className="text-[11px] text-red-300/70 font-medium">Agricultural Machinery Network</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-red-500/30 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E31B23]" />
            </span>
            <span className="text-[11px] font-semibold text-red-200">TractorAI Live</span>
          </div>
        </div>

        {/* Center Hero Value Proposition & Floating Feature Chips */}
        <div className="relative z-10 my-auto space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#E31B23]/15 to-rose-500/10 border border-red-500/30 text-red-300 text-xs font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#E31B23]" />
            <span>Next-Generation Autonomous Fleet & Farm Hub</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
            Seamless machinery dispatching, precision farming & telemetry in one unified workspace.
          </h1>

          <p className="text-sm text-slate-300/90 leading-relaxed max-w-lg">
            Manage your land boundaries, tractor allocations, billing, and operator schedules with real-time biometric push security.
          </p>

          {/* Floating Metric Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <div className="flex items-center gap-2 text-red-400 text-xs font-black">
                <Smartphone className="w-4 h-4" />
                <span>Zero-Password Push</span>
              </div>
              <p className="text-[11px] text-slate-300">1-Tap number match biometric verification on phone</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-black">
                <ShieldCheck className="w-4 h-4" />
                <span>256-Bit Protection</span>
              </div>
              <p className="text-[11px] text-slate-300">Enterprise zero-trust session management</p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Guarantee & Status Footer */}
        <div className="relative z-10 pt-6 border-t border-red-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>🔒 SOC-2 Encrypted</span>
          </div>
          <span className="text-[11px] text-red-400/80 font-medium">© 2026 Holatractor LTDA</span>
        </div>
      </div>

      {/* ── RIGHT AUTH FORM: ULTRA CLEAN & PROFESSIONAL ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Top Mobile Brand Header (Visible only on <lg) */}
        <div className="flex lg:hidden items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <FarmerBrandIcon size={38} className="rounded-xl shadow-md border border-red-500/30" />
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">HolaTractor</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold text-[#E31B23] border-red-500/30">
            Fleet OS
          </Badge>
        </div>

        {/* Center Login Container */}
        <div className="w-full max-w-[430px] mx-auto my-auto py-8 space-y-6">
          {/* Header Title */}
          <div className="space-y-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Sign in to manage your machinery operations, land parcels, and fleet telemetry.
            </p>
          </div>

          {/* ── AUTH METHOD SELECTOR PILL ── */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setAuthMethod("push")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMethod === "push"
                  ? "bg-white dark:bg-slate-800 text-[#E31B23] dark:text-red-400 shadow-md border border-slate-200/50 dark:border-slate-700/60"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile Push</span>
              <span className="text-[9px] bg-[#E31B23]/15 text-[#E31B23] dark:text-red-300 px-1.5 py-0.2 rounded-full font-black uppercase">
                Fast
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod("password")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMethod === "password"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-200/50 dark:border-slate-700/60"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>
          </div>

          {/* ── 1. PASSWORDLESS PUSH LOGIN ── */}
          {authMethod === "push" ? (
            <PasswordlessPushLogin
              defaultEmail={email}
              onSuccess={setCookiesAndRedirect}
              onFallbackToPassword={() => setAuthMethod("password")}
            />
          ) : (
            /* ── 2. STANDARD PASSWORD LOGIN ── */
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="log_in_email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    name="log_in_email"
                    id="log_in_email"
                    placeholder="e.g. farmer@holatractor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-11 pr-4 bg-white dark:bg-slate-900/50 focus-visible:ring-2 focus-visible:ring-[#E31B23]/30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot_password"
                    className="text-[11px] font-bold text-[#E31B23] dark:text-red-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwrdShow ? "text" : "password"}
                    placeholder="Enter your account password"
                    value={passwrd}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-11 pr-10 bg-white dark:bg-slate-900/50 focus-visible:ring-2 focus-visible:ring-[#E31B23]/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordShow((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {passwrdShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#E31B23] hover:bg-[#C9141B] text-white font-bold text-xs shadow-lg shadow-[#E31B23]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isLoading ? (
                  <CircularProgress size={18} className="text-white" />
                ) : (
                  <span>Sign In with Password</span>
                )}
              </Button>
            </form>
          )}

          {/* Social Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-slate-50 dark:bg-[#0C0505] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <GoogleSignIn setCookiesAndRedirect={setCookiesAndRedirect} />

          {/* Footer Registration Link */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have a HolaTractor account?{" "}
              <Link href={"/register"} className="text-[#E31B23] dark:text-red-400 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-900/60">
          <span>Protected by HolaTractor Biometric & 256-Bit TLS Security Protocols</span>
        </div>
      </div>

      <SwitchAccountModal
        isOpen={showRoleSelector}
        isMandatorySelection={true}
        onClose={() => setShowRoleSelector(false)}
        title="Choose Your Dashboard"
        description="You have access to multiple roles on HolaTractor. Select which account dashboard you want to open:"
      />
    </div>
  );
};

const GoogleSignIn = ({
  setCookiesAndRedirect,
}: {
  setCookiesAndRedirect: (data: any) => void;
}) => {
  const { setLoading } = useLoading();

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${codeResponse.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${codeResponse.access_token}`,
              Accept: "application/json",
            },
          }
        );

        setLoading(true);

        let loginResData: any = null;

        // 1. Primary: NestJS
        try {
          const loginRes = await renderInstance.post("/user/login", {
            email: res.data.email,
            authType: "GOOGLE",
          });
          if (
            (loginRes.status === 200 || loginRes.status === 201) &&
            (loginRes.data?.access_token || loginRes.data?.data?.access_token)
          ) {
            loginResData = loginRes.data;
          }
        } catch (nestErr) {
          console.warn("NestJS Google login notice, trying fallback:", nestErr);
        }

        // 2. Fallback: FastAPI tractorai.sinsignal.com
        if (!loginResData) {
          try {
            const fastApiUrl = "https://tractorai.sinsignal.com/user/google-login";
            const fastApiRes = await axios.post(
              fastApiUrl,
              {
                email: res.data.email,
                name: res.data.name || `${res.data.given_name || ""} ${res.data.family_name || ""}`.trim(),
                first_name: res.data.given_name || "Owner",
                last_name: res.data.family_name || "",
                image: res.data.picture || "",
                authType: "GOOGLE",
              },
              { timeout: 10000 }
            );
            if (
              (fastApiRes.status === 200 || fastApiRes.status === 201) &&
              (fastApiRes.data?.access_token || fastApiRes.data?.data?.access_token)
            ) {
              loginResData = fastApiRes.data;
            }
          } catch (fastErr) {
            console.warn("FastAPI Google login notice:", fastErr);
          }
        }

        if (loginResData) {
          setCookiesAndRedirect(loginResData);
        } else {
          errorMessage("Google Login Failed. Please try again.");
        }
      } catch (err: any) {
        if (
          err.response?.status === 409 &&
          err.response.data.message === "User not found"
        ) {
          errorMessage("User not found");
        } else if (
          err.response?.status === 409 &&
          err.response.data.message === "Wrong password"
        ) {
          errorMessage("Wrong password");
        } else if (
          err.response?.status === 400 &&
          err.response.data.message === "Account not active"
        ) {
          errorMessage(
            "Your account is inactive. Please contact an administrator."
          );
        } else {
          errorMessage("Some error occurred");
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => errorMessage("Login Failed"),
  });

  return (
    <div
      className="flex items-center justify-center gap-[10px]"
      onClick={() => login()}
    >
      Or continue with
      <Image
        src={
          "https://res.cloudinary.com/spiralyze/image/upload/v1694499636/expensify/1001/icon-googlesvg.svg"
        }
        className="w-[40px] h-auto object-cover cursor-pointer"
        alt="Google image"
        width={40}
        height={40}
      />
    </div>
  );
};

export default LogInPage;

// "use client"

// import { useCookie } from 'next-cookie'
// import Image from 'next/image'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { useState } from 'react'
// import CryptoJS from "crypto-js";
// import { decode } from "jsonwebtoken"
// import { renderInstance } from '@/utils/Axios/RenderInstance'
// import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
// import { Label } from '../ui/label'
// import { Input } from '../ui/input'
// import { Eye, EyeOff } from 'lucide-react'
// import { useGoogleLogin } from '@react-oauth/google'
// import axios from 'axios'
// import { Backdrop, CircularProgress } from '@mui/material';

// const LogInPage = () => {

//     const [email, setEmail] = useState("")
//     const [passwrd, setPassword] = useState("")
//     const [passwrdShow, setPasswordShow] = useState(false)

//     const [loading, setLoading] = useState(false)
//     const router = useRouter()

//     const { cookie } = useCookie();

//     function handleLogin(e: any) {
//         e.preventDefault()
//         setLoading(true)

//         const encryptedPassword = CryptoJS.AES.encrypt(
//             passwrd,
//             "m4AfXfQ&1brl3LjQFYO"
//         ).toString();

//         renderInstance.post("/user/login", {
//             email: email.trim(),
//             password: encryptedPassword,
//             authType: "EMAIL"
//         }).then((res) => {
//             if (res.status === 201 && res.data.access_token) {

//                 const user = decode(res.data.access_token)

//                 const expiryDate = new Date();
//                 expiryDate.setDate(expiryDate.getDate() + 1);

//                 // Set the cookie with the calculated expiry date
//                 cookie.set('access_token', res.data.access_token, { path: '/', expires: expiryDate });
//                 cookie.set('user', user, { path: '/', expires: expiryDate });
//                 cookie.set('isFarmer', res.data.isFarmer, { path: '/', expires: expiryDate });
//                 cookie.set('isOperator', res.data.isOperator, { path: '/', expires: expiryDate });
//                 cookie.set('isOwner', res.data.isOwner, { path: '/', expires: expiryDate });
//                 cookie.set('isDealer', res.data.isDealer, { path: '/', expires: expiryDate });

//                 successMessage("Log in successfull")
//                 setEmail("")
//                 setPassword("")
//                 if (res.data.isFarmer) {
//                     router.push("/farmer")
//                 }
//                 else if (res.data.isOperator) {
//                     router.push("/operator")
//                 }
//                 else if (res.data.isOwner) {
//                     router.push("/owner")
//                 }
//                 else if (res.data.isDealer) {
//                     router.push("/dealer")
//                 }
//                 else {
//                     router.push("/")
//                 }
//             }
//         }).catch((err) => {
//             if (err.response && err.response.status === 409 && err.response.data.message === "User not found") {
//                 errorMessage("User not found")
//                 setEmail("")
//                 setPassword("")
//             } else if (err.response && err.response.status === 409 && err.response.data.message === "Wrong password") {
//                 errorMessage("Wrong password")
//                 setPassword("")
//             } else if (err.response && err.response.status === 400 && err.response.data.message === "Acount not active") {
//                 errorMessage("Acount not active")
//                 setPassword("")
//             } else {
//                 errorMessage("Some error occured")
//             }
//         }).finally(() => {
//             setLoading(false)
//         })
//     }

//     return (
//         <div className='w-full min-h-[100vh] max-h-fit flex items-center justify-center text-[18px]'>

//             <Image
//                 src={"https://holadashboard.s3.us-west-2.amazonaws.com/tract.webp"}
//                 alt='Sign_In_page_right_image'
//                 className='w-1/2 min-h-[100vh] object-cover hidden 900px:block'
//                 width={400}
//                 height={400}
//                 unoptimized={true} />

//             <div className='w-[80vw] 768px:w-1/2 h-full flex items-center justify-center'>

//                 <div className='flex flex-col gap-[20px] items-center justify-center w-[360px]'>

//                     <p
//                         className='text-[26px] w-fit font-[600] relative before:absolute before:left-0 before:bottom-[-4px] before:w-[75%] before:h-[3px] before:rounded-full before:bg-[#AB0F0C]'>
//                         Welcome back
//                     </p>

//                     <p className='text-[14px] font-[500]'>
//                         Please sign in to enter the dashboard
//                     </p>

//                     <div className='w-full'>

//                         <Label htmlFor="log_in_email">
//                             Email
//                         </Label>

//                         <Input
//                             type="email"
//                             name="log_in_email"
//                             id="log_in_email"
//                             placeholder='Enter your email'
//                             value={email}
//                             onChange={e => { setEmail(e.target.value) }} />

//                     </div>

//                     <div className='w-full'>

//                         <Label>
//                             Password
//                         </Label>

//                         <div className='flex items-center gap-3'>

//                             <Input
//                                 id="password"
//                                 type={`${passwrdShow ? "text" : "password"}`}
//                                 placeholder='********'
//                                 value={passwrd}
//                                 onChange={e => { setPassword(e.target.value) }} />
//                             <div onClick={() => { setPasswordShow(pre => !pre) }}>
//                                 {
//                                     passwrdShow ?
//                                         <EyeOff />
//                                         :
//                                         <Eye />
//                                 }
//                             </div>

//                         </div>

//                     </div>

//                     <button
//                         name="add_role_submit_button"
//                         className='px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-full mx-auto'
//                         onClick={e => handleLogin(e)}>
//                         {
//                             loading ?
//                                 <CircularProgress className='text-primaryColor' />
//                                 :
//                                 "Log in"
//                         }
//                     </button>

//                     <GoogleSignIn />

//                     <p className='underline cursor-pointer'>
//                         Forgot your password?
//                     </p>

//                     <p>
//                         Don't have an account? <Link href={"/register"} className='text-primaryColor'>Sign up</Link>
//                     </p>

//                 </div>

//             </div>

//             {/* <Backdrop
//                         sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
//                         open={loading}
//                     >
//                         <CircularProgress />
//                     </Backdrop> */}

//         </div>
//     )
// }

// export default LogInPage

// const GoogleSignIn = () =>{

//     const [loading, setLoading] = useState(false)

//     const router = useRouter()

//     const { cookie } = useCookie();

//     const login = useGoogleLogin({
//         onSuccess: (codeResponse) => {
//             axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${codeResponse.access_token}`, {
//                 headers: {
//                     Authorization: `Bearer ${codeResponse.access_token}`,
//                     Accept: 'application/json'
//                 }
//             })
//                 .then((res) => {
//                     setLoading(true)

//                     renderInstance.post("/user/login", {
//                         email: res.data.email,
//                         authType: "GOOGLE"
//                     }).then((res) => {
//                         if (res.status === 201 && res.data.access_token) {

//                             const user = decode(res.data.access_token)

//                             const expiryDate = new Date();
//                             expiryDate.setDate(expiryDate.getDate() + 1);

//                             // Set the cookie with the calculated expiry date
//                             cookie.set('access_token', res.data.access_token, { path: '/', expires: expiryDate });
//                             cookie.set('user', user, { path: '/', expires: expiryDate });
//                             cookie.set('isFarmer', res.data.isFarmer, { path: '/', expires: expiryDate });
//                             cookie.set('isOperator', res.data.isOperator, { path: '/', expires: expiryDate });
//                             cookie.set('isOwner', res.data.isOwner, { path: '/', expires: expiryDate });
//                             cookie.set('isDealer', res.data.isDealer, { path: '/', expires: expiryDate });

//                             successMessage("Log in successfull")
//                             if (res.data.isFarmer) {
//                                 router.push("/farmer")
//                             }
//                             else if (res.data.isOperator) {
//                                 router.push("/operator")
//                             }
//                             else if (res.data.isOwner) {
//                                 router.push("/owner")
//                             }
//                             else if (res.data.isDealer) {
//                                 router.push("/dealer")
//                             }
//                             else {
//                                 router.push("/")
//                             }
//                         }
//                     }).catch((err) => {
//                         if (err.response && err.response.status === 409 && err.response.data.message === "User not found") {
//                             errorMessage("User not found")
//                         } else if (err.response && err.response.status === 409 && err.response.data.message === "Wrong password") {
//                             errorMessage("Wrong password")
//                         } else {
//                             errorMessage("Some error occured")
//                         }
//                     }).finally(() => {
//                         setLoading(false)
//                     })
//                 })
//                 .catch((err) => errorMessage('Login Failed'));
//         },
//         onError: (error) => errorMessage('Login Failed')
//     });

//     return(
//         <div className="flex items-center justify-center gap-[10px]" onClick={() => { login() }}>
//             Or continue with
//             <Image
//                 src={
//                     "https://res.cloudinary.com/spiralyze/image/upload/v1694499636/expensify/1001/icon-googlesvg.svg"
//                 }
//                 className="w-[40px] h-auto object-cover cursor-pointer"
//                 alt="Google image"
//                 width={40}
//                 height={40}
//             />

// <Backdrop
//                         sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
//                         open={loading}
//                     >
//                         <CircularProgress />
//                     </Backdrop>
//         </div>
//     )
// }
