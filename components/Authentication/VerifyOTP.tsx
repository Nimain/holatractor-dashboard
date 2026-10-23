"use client";

import { useState, useEffect, useRef } from "react";
// --- Firebase Imports ---
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, UserCredential } from "firebase/auth";

// By declaring this interface, we are telling TypeScript that we expect
// to attach the reCAPTCHA verifier to the global window object.
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

// --- START: PLACEHOLDERS FOR COMPILATION ---
// NOTE: In your actual Next.js project, you should replace these placeholders
// with your real imports to resolve module-related errors.

// 1. Replace with your actual Firebase app instance import
// e.g., import { app } from "@/config/firebase";
import { FirebaseApp } from "firebase/app"; // Importing the type for correctness
const app = {} as FirebaseApp; // This is a placeholder, cast to the correct type

// 2. Replace with your actual Toastify/notification utility
// e.g., import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
const errorMessage = (message: string) => console.error(message);
const successMessage = (message: string) => console.log(message);

// 3. Replace with your actual logo import or use a direct URL
// e.g., import Logo from "@/assets/logo.png";
const Logo = "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/logo.png";

// 4. These stubs replace Next.js components and hooks. Use your actual imports.
const Image = (props: any) => <img {...props} alt={props.alt || ""} />;
const Link = (props: any) => <a href={props.href}>{props.children}</a>;
const useRouter = () => ({
    push: (path: string) => { if (typeof window !== "undefined") window.location.href = path; }
});
const useSearchParams = () => {
    if (typeof window !== "undefined") {
        return new URL(window.location.href).searchParams;
    }
    return new Map();
};
// --- END: PLACEHOLDERS FOR COMPILATION ---


// Get Firebase auth instance
const auth = getAuth(app);

const VerifyOTP = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Component State ---
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // --- Timer State ---
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // --- User Data State ---
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Effect for Timer ---
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);


  // --- Effect to get user data from URL and send initial OTP ---
  useEffect(() => {
    const userIdFromQuery = searchParams.get('userId');
    const phoneFromQuery = searchParams.get('phone');

    if (userIdFromQuery && phoneFromQuery) {
        setUserId(userIdFromQuery);
        const fullPhoneNumber = `+91${phoneFromQuery}`;
        setPhoneNumber(fullPhoneNumber);
        
        setupRecaptchaAndSendOtp(fullPhoneNumber);
    } else {
        errorMessage("User details not found. Please sign up again.");
        router.push('/register'); // Redirect if no user data
    }
  // The dependency array is intentionally left to run once on mount with the initial searchParams.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Function to Setup reCAPTCHA and Send OTP ---
  const setupRecaptchaAndSendOtp = async (phone: string) => {
    try {
        setLoading(true);
        if (typeof window !== 'undefined') {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        
            const verifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, verifier);
            
            setConfirmationResult(result);
            successMessage("OTP Sent Successfully!");
            setTimer(60); // Reset timer
            setCanResend(false);
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        errorMessage("Failed to send OTP. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  // --- Function to Handle Resending OTP ---
  const handleResendOtp = () => {
    if (phoneNumber) {
      setupRecaptchaAndSendOtp(phoneNumber);
    }
  };
  
  // --- Function to Handle OTP input change and auto-focus ---
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const joinedOtp = newOtp.join("");
    if (joinedOtp.length === 6) {
      handleVerifyOtp(joinedOtp);
    }
  };

  // --- Function to handle backspace ---
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- Function to Verify OTP and Call Your Backend ---
  const handleVerifyOtp = async (finalOtp: string) => {
    if (!confirmationResult) {
      return errorMessage("Please request an OTP first.");
    }
    if (finalOtp.length !== 6) {
      return errorMessage("Please enter the complete 6-digit OTP.");
    }

    setLoading(true);
    try {
      const userCredential: UserCredential = await confirmationResult.confirm(finalOtp);
      const firebaseToken = await userCredential.user.getIdToken();
      const backendResponse = await fetch('https://www.holatractor.com/farmer/verify-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, firebaseToken }),
      });

      const data = await backendResponse.json();

      if (backendResponse.ok) {
        successMessage("Phone verification successful!");
        router.push('/dashboard');
      } else {
        errorMessage(data.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      errorMessage("Invalid OTP or error during verification.");
      setOtp(new Array(6).fill("")); // Clear OTP on error
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100vh] max-h-fit text-[18px] flex items-center justify-center">
        <div id="recaptcha-container"></div>

        <div
            className="w-[90%] min-h-[90vh] max-h-fit relative rounded 768px:rounded-[40px] overflow-hidden text-white flex flex-col items-center justify-center gap-[30px] py-[40px] bg-cover bg-no-repeat bg-blend-multiply bg-gray-500"
            style={{
                backgroundImage: `url('https://holaimagesdata.s3.us-west-2.amazonaws.com/web/dashboard/create_account.webp')`,
            }}
        >
            <div className="w-full px-[30px] flex items-center justify-center 768px:justify-start">
                <Image
                    src={Logo}
                    alt="Logo"
                    width={100}
                    height={100}
                    className="w-[160px] h-auto object-cover"
                />
            </div>

            <div className="w-full px-[20px] 768px:px-[50px] bg-black/30 backdrop-blur-sm rounded-2xl max-w-lg mx-auto py-10 flex flex-col items-center gap-6">
                <p className="text-[26px] 768px:text-[32px] font-bold text-center">
                    Phone Verification
                </p>

                <p className="text-center text-gray-200">
                    We've sent a 6-digit code to <br /> 
                    <span className="font-semibold text-white">{phoneNumber || 'your mobile'}</span>.
                </p>

                <div className="flex items-center justify-center gap-2 768px:gap-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            // This ref function is now correctly typed to return void.
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 768px:w-14 768px:h-16 text-center text-2xl font-bold bg-white/20 rounded-lg outline-none border-2 border-transparent focus:border-[#AB0F0C] transition-all text-white"
                        />
                    ))}
                </div>

                <button
                    name="Verify_OTP_button"
                    className="w-full max-w-xs px-[30px] py-[12px] bg-[#AB0F0C] rounded-full text-lg font-semibold disabled:bg-gray-500 transition-colors"
                    onClick={() => handleVerifyOtp(otp.join(""))}
                    disabled={loading || otp.join("").length < 6}
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </button>

                <div className="text-center text-gray-300">
                    Didn't receive the code? {" "}
                    {canResend ? (
                      <button onClick={handleResendOtp} disabled={loading} className="font-semibold text-white underline hover:text-red-300">
                        Resend Code
                      </button>
                    ) : (
                      <span className="font-semibold text-white">
                        Resend in {timer}s
                      </span>
                    )}
                </div>
            </div>
             <p className="text-sm text-gray-400 absolute bottom-5">
                Go back to <Link href="/register" className="underline hover:text-white">Sign Up</Link>
            </p>
        </div>
    </div>
  );
};

export default VerifyOTP;