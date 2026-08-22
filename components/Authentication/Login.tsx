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

const LogInPage = () => {
  const [email, setEmail] = useState("");
  const [passwrd, setPassword] = useState("");
  const [passwrdShow, setPasswordShow] = useState(false);

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
    const rawUser: any = decode(data.access_token) || {};
    const user = {
      ...rawUser,
      userId: rawUser?.userId || rawUser?.id || rawUser?.sub || rawUser?._id || data?.user?.id || data?.user?.userId || "",
      name: rawUser?.name || `${rawUser?.first_name || ""} ${rawUser?.last_name || ""}`.trim() || data?.user?.name || "User",
      email: rawUser?.email || data?.user?.email || "",
      email_varified: rawUser?.email_varified ?? rawUser?.emailVerified ?? false,
      image: rawUser?.image || data?.user?.image || "",
    };
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);

    const isFarmer = data.isFarmer === true || (Array.isArray(data.role) && data.role.includes("farmer"));
    const isOperator = data.isOperator === true || (Array.isArray(data.role) && data.role.includes("operator"));
    const isOwner = data.isOwner === true || (Array.isArray(data.role) && data.role.includes("owner"));
    const isDealer = data.isDealer === true || (Array.isArray(data.role) && data.role.includes("dealer"));
    const isAgent = data.isAgent === true || (Array.isArray(data.role) && data.role.includes("agent"));

    cookie.set("access_token", data.access_token, {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("user", JSON.stringify(user), {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isFarmer", isFarmer ? "true" : "false", {
      path: "/",
      expires: expiryDate,
    });
    cookie.set("isOperator", isOperator ? "true" : "false", {
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

    successMessage("Log in successful");

    const redirectPath = isFarmer
      ? "/farmer"
      : isOperator
      ? "/operator"
      : isOwner
      ? "/owner"
      : isDealer
      ? "/dealer"
      : isAgent
      ? "/agent"
      : "/";

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
      const res = await renderInstance.post("/user/login", {
        email: email.trim(),
        password: encryptedPassword,
        authType: "EMAIL",
      });

      // Log API response to localStorage
      const apiLog = {
        type: "Email Login API Response",
        status: res.status,
        data: res.data,
        allRoles: {
          isFarmer: res.data.isFarmer,
          isOperator: res.data.isOperator,
          isOwner: res.data.isOwner,
          isDealer: res.data.isDealer,
          isAgent: res.data.isAgent,
        },
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("loginDebugLog", JSON.stringify(apiLog));

      if ((res.status === 200 || res.status === 201) && res.data.access_token) {
        setCookiesAndRedirect(res.data);
        setEmail("");
        setPassword("");
      } else if (res.data === "Email verification link sent successfully") {
        successMessage("Email verification link sent successfully");
      } else {
        errorMessage("Try again");
      }
    } catch (err: any) {
      // console.error("Email Login Error:", err); // Commented out
      localStorage.setItem(
        "errorDebugLog",
        JSON.stringify({
          type: "Email Login Error",
          error: err.message,
          response: err.response?.data,
          timestamp: new Date().toISOString(),
        })
      );
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

          <div className="w-full">
            <Label htmlFor="log_in_email">Email</Label>
            <Input
              type="email"
              name="log_in_email"
              id="log_in_email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="w-full">
            <Label>Password</Label>
            <div className="flex items-center gap-3">
              <Input
                id="password"
                type={passwrdShow ? "text" : "password"}
                placeholder="********"
                value={passwrd}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div onClick={() => setPasswordShow((prev) => !prev)}>
                {passwrdShow ? <EyeOff /> : <Eye />}
              </div>
            </div>
          </div>

          <button
            name="add_role_submit_button"
            className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center justify-center gap-[10px] w-full mx-auto"
            onClick={handleLogin}
          >
            {isLoading ? (
              <CircularProgress className="text-primaryColor" />
            ) : (
              "Log in"
            )}
          </button>

          <GoogleSignIn setCookiesAndRedirect={setCookiesAndRedirect} />

          <p className="underline cursor-pointer">Forgot your password?</p>

          <p>
            Don't have an account?{" "}
            <Link href={"/register"} className="text-primaryColor">
              Sign up
            </Link>
          </p>
        </div>
      </div>
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

        const loginRes = await renderInstance.post("/user/login", {
          email: res.data.email,
          authType: "GOOGLE",
        });

        // Log API response to localStorage
        const apiLog = {
          type: "Google Login API Response",
          status: loginRes.status,
          data: loginRes.data,
          isAgent: loginRes.data.isAgent,
          allRoles: {
            isFarmer: loginRes.data.isFarmer,
            isOperator: loginRes.data.isOperator,
            isOwner: loginRes.data.isOwner,
            isDealer: loginRes.data.isDealer,
            isAgent: loginRes.data.isAgent,
          },
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem("googleLoginDebugLog", JSON.stringify(apiLog));

        if ((loginRes.status === 200 || loginRes.status === 201) && loginRes.data.access_token) {
          setCookiesAndRedirect(loginRes.data);
        }
      } catch (err: any) {
        // console.error("Google Login Error:", err); // Commented out
        localStorage.setItem(
          "googleErrorDebugLog",
          JSON.stringify({
            type: "Google Login Error",
            error: err.message,
            response: err.response?.data,
            timestamp: new Date().toISOString(),
          })
        );
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
