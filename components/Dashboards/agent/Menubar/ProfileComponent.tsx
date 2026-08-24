"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCookie } from "next-cookie";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import userImage from "./user.png";
import { useDropzone } from "react-dropzone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  LogIn,
  Camera,
  Copy,
  Share2,
  CheckCircle2,
  XCircle,
  Tractor,
  UserCheck,
} from "lucide-react";
import SwitchAccountModal from "@/components/wrappers/SwitchAccountModal";

const ProfileComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [emailVerification, setEmailVerification] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { push } = useRouter();
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const user = cookie.get("user");

  const isOwner = cookie.get("isOwner") === "true";
  const isFarmer = cookie.get("isFarmer") === "true";
  const isDealer = cookie.get("isDealer") === "true";
  const isAgent = cookie.get("isAgent") === "true";
  const isOperator = cookie.get("isOperator") === "true";
  const hasMultipleRoles = [isOwner, isFarmer, isDealer, isAgent, isOperator].filter(Boolean).length > 1;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const image = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setSelectedImage(result);
    };
    reader.readAsDataURL(image);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  function RedirectToLogin() {
    push("/login");
  }

  async function handleLogInLogOut() {
    const cookiesToRemove = [
      "access_token", "user", "isFarmer", "isOperator",
      "isAgent", "isOwner", "isDealer", "isODealer",
    ];
    cookiesToRemove.forEach((name) => {
      cookie.remove(name, { path: "/" });
      cookie.remove(name);
      if (typeof document !== "undefined") {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    push("/login");
  }

  async function handleEmailVerification() {
    setEmailVerification(true);
    const token = cookie.get("access_token");
    renderInstance
      .post("/user/SendVerificationLink", {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.status === 201) successMessage("Verification email sent!");
      })
      .catch(() => errorMessage("Failed to send verification link"))
      .finally(() => setEmailVerification(false));
  }

  function handleCopyRef() {
    const ref = user?.referral_code || "0xxxxxx";
    navigator.clipboard.writeText(ref).catch(() => {});
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  const avatarSrc = selectedImage || (user?.image ?? userImage);
  const displayName = user?.name || user?.first_name || "Guest User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (emailVerification) {
    return (
      <div className="flex items-center justify-center p-2">
        <CircularProgress size={24} />
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          className="relative group"
          onClick={() => {
            access_token ? setDialogOpen(true) : RedirectToLogin();
          }}
        >
          {/* Avatar trigger button */}
          <div className="w-9 h-9 rounded-full ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-slate-900 overflow-hidden transition-all group-hover:ring-emerald-400 group-hover:scale-105">
            {user?.image ? (
              <Image
                src={user.image}
                alt={displayName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs font-black">
                {initials || <User className="w-4 h-4" />}
              </div>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="p-0 border-0 bg-transparent shadow-none max-w-sm w-[92vw] [&>button]:top-4 [&>button]:right-4 [&>button]:z-20 [&>button]:text-slate-400 [&>button]:hover:text-white [&>button]:bg-slate-800/80 [&>button]:rounded-xl [&>button]:p-1.5"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl shadow-black/60">

          {/* ─── GRADIENT HERO HEADER ─── */}
          <div className="relative h-24 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="absolute -bottom-4 right-8 w-24 h-24 rounded-full bg-teal-400/10 blur-xl" />
            <div className="absolute top-3 right-3">
              <Tractor className="w-8 h-8 text-emerald-500/20" />
            </div>
          </div>

          {/* ─── AVATAR (overlapping header) ─── */}
          <div className="relative -mt-12 px-6 flex items-end justify-between">
            <div className="relative group/avatar">
              <div
                {...(user ? {} : getRootProps())}
                className="w-20 h-20 rounded-2xl ring-4 ring-slate-900 overflow-hidden cursor-pointer shadow-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center"
              >
                {!user && <input {...getInputProps()} />}
                {user?.image || selectedImage ? (
                  <Image
                    src={selectedImage || user.image}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-black">{initials || "?"}</span>
                )}
              </div>
              {!user && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Verified badge */}
            {user?.email_varified && (
              <div className="mb-2 flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/50 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">Verified</span>
              </div>
            )}
          </div>

          {/* ─── NAME & ROLE ─── */}
          <div className="px-6 pt-2 pb-1">
            <h2 className="text-lg font-bold text-white leading-tight">{displayName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.isAdmin?.includes("admin") ? "System Administrator" : "HolaTractor User"}
            </p>
          </div>

          {/* ─── INFO FIELDS ─── */}
          <div className="px-6 py-3 space-y-2.5">
            {/* Name */}
            <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 group">
              <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</p>
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || "—"}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</p>
                <p className="text-sm font-semibold text-white truncate">{user?.email || "—"}</p>
              </div>
              {user && (
                <button
                  onClick={() => !user.email_varified && handleEmailVerification()}
                  className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    user.email_varified
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      : "bg-red-950/60 text-red-400 border border-red-800/50 hover:bg-red-900/60 cursor-pointer"
                  }`}
                >
                  {user.email_varified ? (
                    <><CheckCircle2 className="w-3 h-3" /> Verified</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Verify</>
                  )}
                </button>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</p>
                <p className="text-sm font-semibold text-white truncate">
                  {user?.country_code && user?.phone
                    ? `${user.country_code} ${user.phone}`
                    : "—"}
                </p>
              </div>
              {user && (
                <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                  user.phone_verified
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}>
                  {user.phone_verified ? (
                    <><CheckCircle2 className="w-3 h-3" /> Verified</>
                  ) : (
                    <><ShieldAlert className="w-3 h-3" /> Pending</>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* ─── REFERRAL CODE ─── */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/60 to-slate-800/60 border border-emerald-800/40 rounded-2xl px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Referral Code</p>
                <p className="text-sm font-mono font-bold text-emerald-300 tracking-widest mt-0.5">
                  {user?.referral_code || "HT-XXXXXX"}
                </p>
              </div>
              <button
                onClick={handleCopyRef}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 text-emerald-400 text-xs font-semibold transition-all active:scale-95"
              >
                {copiedRef ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRef ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* ─── SOCIAL SHARE ─── */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Share via</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { Icon: WhatsAppIcon, color: "text-green-400 hover:text-green-300", bg: "hover:bg-green-950/60" },
                  { Icon: InstagramIcon, color: "text-pink-400 hover:text-pink-300", bg: "hover:bg-pink-950/60" },
                  { Icon: TwitterIcon, color: "text-sky-400 hover:text-sky-300", bg: "hover:bg-sky-950/60" },
                  { Icon: FacebookIcon, color: "text-blue-400 hover:text-blue-300", bg: "hover:bg-blue-950/60" },
                ].map(({ Icon, color, bg }, i) => (
                  <button
                    key={i}
                    className={`w-8 h-8 rounded-xl ${bg} border border-slate-700/50 flex items-center justify-center transition-all active:scale-95 ${color}`}
                  >
                    <Icon style={{ fontSize: 16 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── SWITCH ACCOUNT / ROLE (Only shown if user has multiple roles) ─── */}
          {hasMultipleRoles && (
            <div className="px-6 pb-2">
              <button
                onClick={() => setSwitchModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-800/60 hover:from-emerald-900/60 hover:to-slate-700/60 border border-emerald-700/40 hover:border-emerald-500/60 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Switch Account / Role Dashboard
              </button>
            </div>
          )}

          {/* ─── DIVIDER ─── */}
          <div className="border-t border-slate-800/80 mx-6" />

          {/* ─── ACTION BUTTONS ─── */}
          <div className="px-6 py-4 flex gap-3">
            <button
              onClick={() => setDialogOpen(false)}
              className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-sm font-semibold transition-all active:scale-[0.98]"
            >
              Close
            </button>
            <button
              onClick={handleLogInLogOut}
              className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98] shadow-lg ${
                user
                  ? "bg-red-600/90 hover:bg-red-500 text-white shadow-red-600/25"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
              }`}
            >
              {user ? (
                <><LogOut className="w-4 h-4" /> Sign Out</>
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </div>

        </div>
      </DialogContent>

      <SwitchAccountModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
      />
    </Dialog>
  );
};

export default ProfileComponent;
