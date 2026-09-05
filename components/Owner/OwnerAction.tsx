"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import {
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  Trash2,
  Power,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Shield,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getAuthToken } from "@/utils/auth/clientAuth";

export function formatDateOnly(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (t.startsWith("file://") || t.startsWith("file:/") || t === "NO" || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

interface UserDetails {
  id?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  dob?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  mobile?: string | null;
  phoneVerified?: boolean | null;
  country_code?: string | null;
  image?: string | null;
  authType?: string | null;
}

interface DocumentDetails {
  document_number?: string;
  attachment?: string;
  expire_date?: string | null;
}

interface LocationDetails {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  lat?: string;
  lng?: string;
}

export interface OwnerActionProps {
  index: number;
  mailHover?: number;
  name: string;
  email: string;
  emailVerified: boolean;
  creatDate: string;
  updateDate: string;
  status: number;
  id: string;
  screenshots?: string[];
  user?: UserDetails;
  document?: DocumentDetails;
  location?: LocationDetails;
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

const OwnerAction = ({
  index,
  name,
  email,
  emailVerified,
  creatDate,
  updateDate,
  status: initialStatus,
  id,
  screenshots = [],
  user,
  document,
  location,
  onUpdate,
  trigger,
}: OwnerActionProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "document" | "location">("profile");

  // Editable Form State
  const [firstName, setFirstName] = useState(user?.first_name || name.split(" ")[0] || "");
  const [middleName, setMiddleName] = useState(user?.middle_name || "");
  const [lastName, setLastName] = useState(user?.last_name || name.split(" ").slice(1).join(" ") || "");
  const [ownerEmail, setOwnerEmail] = useState(user?.email || email || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [countryCode, setCountryCode] = useState(user?.country_code || "+591");
  const [gender, setGender] = useState(user?.gender || "male");
  const [status, setStatus] = useState<number>(initialStatus);

  // Operation States
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setFirstName(user?.first_name || name.split(" ")[0] || "");
    setMiddleName(user?.middle_name || "");
    setLastName(user?.last_name || name.split(" ").slice(1).join(" ") || "");
    setOwnerEmail(user?.email || email || "");
    setMobile(user?.mobile || "");
    setCountryCode(user?.country_code || "+591");
    setGender(user?.gender || "male");
    setStatus(initialStatus);
  }, [user, name, email, initialStatus]);

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Save Profile Changes via FastAPI ───────────────────────────
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const token = getAuthToken();
      const res = await axios.patch(
        "/api/owner",
        {
          id,
          user_id: user?.id || id,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email: ownerEmail,
          mobile,
          country_code: countryCode,
          gender,
          status,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "x-admin-key": token,
                "x-api-key": token,
              }
            : {},
        }
      );

      if (res.data?.success) {
        successMessage(
          getTranslation(locale, {
            en: "Owner updated successfully in FastAPI!",
            es: "¡Propietario actualizado exitosamente en FastAPI!",
            ay: "Jilata suma askichata FastAPI-pi!",
            qu: "Dueño allinta musuqchasqa FastAPI-pi!",
            gn: "Jára oñemboheko porã FastAPI-pe!",
          })
        );
        onUpdate?.();
        setOpen(false);
      } else {
        throw new Error(res.data?.message || "Failed to update");
      }
    } catch (err: any) {
      console.error("Save owner error:", err);
      errorMessage(err?.response?.data?.message || err?.message || "Error updating owner data");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Status via FastAPI ──────────────────────────────────
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    const newStatus = status === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "inactivate";

    try {
      const token = getAuthToken();
      const res = await axios.post(
        "/api/owner",
        {
          action,
          id,
          user_id: user?.id || id,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "x-admin-key": token,
                "x-api-key": token,
              }
            : {},
        }
      );

      if (res.data?.success) {
        setStatus(newStatus);
        successMessage(
          newStatus === 1
            ? getTranslation(locale, {
                en: "Owner activated successfully",
                es: "Propietario activado exitosamente",
                ay: "Suma ch'amanchata",
                qu: "Allinta llamk'achisqa",
                gn: "Oñemyendy porã",
              })
            : getTranslation(locale, {
                en: "Owner deactivated successfully",
                es: "Propietario desactivado exitosamente",
                ay: "Suma jani ch'amanchata",
                qu: "Allinta sayachisqa",
                gn: "Oñembogue porã",
              })
        );
        onUpdate?.();
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Failed to change status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // ── Delete Owner via FastAPI ───────────────────────────────────
  const handleDeleteOwner = async () => {
    if (
      !confirm(
        getTranslation(locale, {
          en: `Are you sure you want to delete owner "${name}"?`,
          es: `¿Está seguro de eliminar al propietario "${name}"?`,
          ay: `Chiqaqiti "${name}" jilata chhaqtayaña munta?`,
          qu: `Chiqaqtachu "${name}" dueñota chinkachiyta munanki?`,
          gn: `Reikuaasepa añetehápe rembogueteséha "${name}" járape?`,
        })
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        "/api/owner",
        {
          action: "delete",
          id,
          user_id: user?.id || id,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "x-admin-key": token,
                "x-api-key": token,
              }
            : {},
        }
      );

      if (res.data?.success) {
        successMessage(
          getTranslation(locale, {
            en: "Owner deleted successfully",
            es: "Propietario eliminado exitosamente",
            ay: "Jilata suma chhaqtayata",
            qu: "Dueño allinta chinkachisqa",
            gn: "Jára oñemboguete porã",
          })
        );
        onUpdate?.();
        setOpen(false);
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Failed to delete owner");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            className="w-full text-left focus:outline-none"
            aria-label={`View or edit ${name}`}
          >
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                  {isValidImageUrl(user?.image) ? (
                    <Image
                      src={user!.image!}
                      alt={name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover rounded-xl"
                      unoptimized
                    />
                  ) : (
                    name.charAt(0).toUpperCase() || "O"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    status === 1
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      status === 1 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {status === 1 ? "Active" : "Inactive"}
                </span>

                <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Edit3 size={15} />
                </div>
              </div>
            </div>
          </button>
        )}
      </SheetTrigger>

      <SheetContent
        className="flex flex-col h-full w-full sm:max-w-[540px] p-0 border-l border-gray-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header with gradient banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 text-white relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30 shadow-lg flex-shrink-0">
                {isValidImageUrl(user?.image) ? (
                  <Image
                    src={user!.image!}
                    alt={name}
                    width={60}
                    height={60}
                    className="w-full h-full object-cover rounded-xl"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-white/30 flex items-center justify-center text-white font-bold text-2xl">
                    {firstName.charAt(0).toUpperCase() || "O"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/25 text-white border border-white/30">
                    Tractor Owner
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                      emailVerified
                        ? "bg-emerald-400/30 text-emerald-100 border border-emerald-300/40"
                        : "bg-amber-400/30 text-amber-100 border border-amber-300/40"
                    }`}
                  >
                    {emailVerified ? (
                      <>
                        <CheckCircle size={10} /> Verified
                      </>
                    ) : (
                      <>
                        <XCircle size={10} /> Unverified
                      </>
                    )}
                  </span>
                </div>
                <h2 className="text-xl font-bold truncate leading-tight text-white">
                  {firstName} {lastName}
                </h2>
                <p className="text-white/80 text-xs truncate mt-0.5">{ownerEmail}</p>
              </div>
            </div>
          </div>

          {/* Quick ID Badge */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
            <div className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[280px]">
              <span className="opacity-70">ID:</span>
              <span className="truncate">{id}</span>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] transition-colors"
            >
              {copied ? <Check size={11} className="text-emerald-300" /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/75 px-4 pt-2 gap-2">
          {[
            { id: "profile", label: "Edit Profile", icon: User },
            { id: "document", label: "Documents", icon: FileText },
            { id: "location", label: "Location", icon: MapPin },
          ].map(({ id: tabId, label, icon: TabIcon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === tabId
                  ? "bg-white text-blue-600 border-blue-600 shadow-sm"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              }`}
            >
              <TabIcon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
          {activeTab === "profile" && (
            <form id="owner-edit-form" onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1 text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Middle Name (Optional)</Label>
                <Input
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="mt-1 text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">Email Address *</Label>
                <div className="relative mt-1">
                  <Input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    required
                    className="text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl pl-9"
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Code</Label>
                  <Input
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+591"
                    className="mt-1 text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-semibold text-gray-700">Mobile Phone</Label>
                  <div className="relative mt-1">
                    <Input
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="61234567"
                      className="text-sm bg-gray-50/80 focus:bg-white border-gray-200 rounded-xl pl-9"
                    />
                    <Phone size={15} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Gender</Label>
                  <select
                    value={gender.toLowerCase()}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full h-10 px-3 text-sm bg-gray-50/80 focus:bg-white border border-gray-200 rounded-xl outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Account Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="mt-1 w-full h-10 px-3 text-sm bg-gray-50/80 focus:bg-white border border-gray-200 rounded-xl outline-none font-semibold text-gray-800"
                  >
                    <option value={1}>🟢 Active (1)</option>
                    <option value={0}>🔴 Inactive (0)</option>
                  </select>
                </div>
              </div>

              {/* Metadata Info Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Created At:</span>
                  <span className="font-mono">{creatDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Last Updated:</span>
                  <span className="font-mono">{updateDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">FastAPI Sync:</span>
                  <span className="font-semibold text-emerald-600">● Live Connected</span>
                </div>
              </div>
            </form>
          )}

          {activeTab === "document" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Identification & Documents
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Document Number:</span>
                    <span className="font-semibold text-gray-800">
                      {document?.document_number || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Expiry Date:</span>
                    <span className="font-semibold text-gray-800">
                      {formatDateOnly(document?.expire_date)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 font-medium">Attachment:</span>
                    <span className="text-blue-600 font-semibold">
                      {document?.attachment ? (
                        <a
                          href={document.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View Document Link ↗
                        </a>
                      ) : (
                        "No file attached"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Screenshots if available */}
              {screenshots && screenshots.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-gray-800">Payment Verification Screenshots</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {screenshots.map((src, i) => (
                      isValidImageUrl(src) ? (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl overflow-hidden border border-gray-200 hover:opacity-90"
                        >
                          <Image
                            src={src}
                            alt="Screenshot"
                            width={200}
                            height={120}
                            className="w-full h-24 object-cover"
                            unoptimized
                          />
                        </a>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <MapPin size={16} className="text-cyan-600" />
                  Address & Coordinates
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Facility / Yard:</span>
                    <span className="font-semibold text-gray-800">{location?.name || "Main Yard"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Street Address:</span>
                    <span className="font-semibold text-gray-800">{location?.address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">City / State:</span>
                    <span className="font-semibold text-gray-800">
                      {location?.city || "N/A"}, {location?.state || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 font-medium">Country:</span>
                    <span className="font-semibold text-gray-800">{location?.country || "Bolivia"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 font-medium">GPS Coordinates:</span>
                    <span className="font-mono text-gray-700">
                      {location?.lat || "—"}, {location?.lng || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-gray-100 bg-gray-50 flex flex-row items-center justify-between gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteOwner}
            disabled={isDeleting || isSaving}
            className="rounded-xl text-xs h-9 px-3 gap-1.5 font-semibold"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus || isSaving}
              className={`rounded-xl text-xs h-9 px-3 gap-1.5 font-semibold border ${
                status === 1
                  ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                  : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {isTogglingStatus ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Power size={14} />
              )}
              {status === 1 ? "Deactivate" : "Activate"}
            </Button>

            <Button
              type="button"
              onClick={() => handleSaveChanges()}
              disabled={isSaving}
              className="rounded-xl text-xs h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OwnerAction;