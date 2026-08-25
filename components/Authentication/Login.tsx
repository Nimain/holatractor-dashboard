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
import { Eye, EyeOff } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useLoading } from "../wrappers/LoaderWrappers";
import SwitchAccountModal from "../wrappers/SwitchAccountModal";
import PasswordlessPushLogin from "./PasswordlessPushLogin";

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

    const rawUser: any = decode(token) || {};
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
    expiryDate.setDate(expiryDate.getDate() + 1);

    const isOwner =
      payload.isOwner === true ||
      (Array.isArray(payload.role) && payload.role.includes("owner")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("owner"));
    const isDealer =
      payload.isDealer === true ||
      (Array.isArray(payload.role) && payload.role.includes("dealer")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("dealer"));
    const isAgent =
      payload.isAgent === true ||
      (Array.isArray(payload.role) && payload.role.includes("agent")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("agent"));
    const isOperator =
      payload.isOperator === true ||
      (Array.isArray(payload.role) && payload.role.includes("operator")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("operator"));
    const isFarmer =
      payload.isFarmer === true ||
      (Array.isArray(payload.role) && payload.role.includes("farmer")) ||
      (Array.isArray(rawUser?.role) && rawUser.role.includes("farmer"));

    cookie.set("access_token", token, {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("user", JSON.stringify(user), {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isOwner", isOwner ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isDealer", isDealer ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isAgent", isAgent ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isOperator", isOperator ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isFarmer", isFarmer ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access_token", token);
      } catch {}
    }

    successMessage("Log in successful");

    const activeRolesCount = [isOwner, isDealer, isAgent, isOperator, isFarmer].filter(Boolean).length;

    // If user has multiple roles (e.g. Owner AND Farmer), open switch account modal immediately
    if (activeRolesCount > 1) {
      setShowRoleSelector(true);
      return;
    }

    // Single role detected: set active_role cookie and navigate
    const singleRole = isOwner
      ? "owner"
      : isDealer
      ? "dealer"
      : isAgent
      ? "agent"
      : isOperator
      ? "operator"
      : isFarmer
      ? "farmer"
      : "";

    if (singleRole) {
      cookie.set("active_role", singleRole, { path: "/", expires: expiryDate });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("active_role", singleRole);
          document.cookie = `active_role=${singleRole}; path=/; expires=${expiryDate.toUTCString()};`;
        } catch {}
      }
    }

    const redirectPath = singleRole ? `/${singleRole}` : "/";

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
    <div className="w-full min-h-[100vh] max-h-fit flex items-center justify-center text-[18px]">
      <Image
        src={"https://holadashboard.s3.us-west-2.amazonaws.com/tract.webp"}
        alt="Sign_In_page_right_image"
        className="w-1/2 min-h-[100vh] object-cover hidden 900px:block"
        width={400}
        height={400}
        unoptimized={true}
      />

      <div className="w-[80vw] 768px:w-1/2 h-full flex items-center justify-center">
        <div className="flex flex-col gap-[20px] items-center justify-center w-[360px]">
          <p className="text-[26px] w-fit font-[600] relative before:absolute before:left-0 before:bottom-[-4px] before:w-[75%] before:h-[3px] before:rounded-full before:bg-[#AB0F0C]">
            Welcome back
          </p>

          <p className="text-[14px] font-[500]">
            Please sign in to enter the dashboard
          </p>

          {/* ── AUTH METHOD TOGGLE TABS ── */}
          <div className="w-full flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setAuthMethod("push")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMethod === "push"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>📱 Mobile App</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black">
                No Password
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("password")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMethod === "password"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🔑 Password
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
              <div className="w-full">
                <Label htmlFor="log_in_email" className="text-xs font-bold">Email</Label>
                <Input
                  type="email"
                  name="log_in_email"
                  id="log_in_email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="w-full">
                <Label className="text-xs font-bold">Password</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="password"
                    type={passwrdShow ? "text" : "password"}
                    placeholder="********"
                    value={passwrd}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                  <div onClick={() => setPasswordShow((prev) => !prev)} className="cursor-pointer">
                    {passwrdShow ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                name="add_role_submit_button"
                className="px-[20px] py-[10px] bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-[10px] w-full mx-auto h-11 transition-all"
              >
                {isLoading ? (
                  <CircularProgress size={20} className="text-white" />
                ) : (
                  "Log in with Password"
                )}
              </button>
            </form>
          )}

          <div className="w-full flex items-center gap-2 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>OR</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <GoogleSignIn setCookiesAndRedirect={setCookiesAndRedirect} />

          <p>
            Don't have an account?{" "}
            <Link href={"/register"} className="text-emerald-600 font-bold hover:underline">
              Sign up
            </Link>
          </p>
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
