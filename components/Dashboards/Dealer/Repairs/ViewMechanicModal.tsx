"use client";
import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Award,
  ShieldCheck,
  Wrench,
  Edit,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MechanicData {
  id: string;
  user_id?: string;
  dealer_id?: string;
  specialization: string[];
  experience_years: number;
  license_number?: string;
  Status: number;
  is_available?: boolean;
  temporary_password?: string;
  password?: string;
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    image?: string;
    temporary_password?: string;
    password?: string;
  };
}

interface ViewMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanic: MechanicData | null;
  onEdit: (mechanic: MechanicData) => void;
}

export default function ViewMechanicModal({
  isOpen,
  onClose,
  mechanic,
  onEdit,
}: ViewMechanicModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen || !mechanic) return null;

  const fullName = `${mechanic.user?.first_name || ""} ${mechanic.user?.last_name || ""}`.trim() || "Certified Mechanic";
  const isActive = mechanic.Status === 1;
  const isAvailable = mechanic.is_available !== false;

  const rawPassword =
    mechanic.temporary_password ||
    (mechanic as any).password ||
    mechanic.user?.temporary_password ||
    (mechanic.user as any)?.password;

  const tempPassword =
    rawPassword && !rawPassword.startsWith("$2")
      ? rawPassword
      : "mechanic123";

  const handleCopyPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Wrench size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Mechanic Details</h2>
              <p className="text-xs text-white/80">ID: {mechanic.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer"
            type="button"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Top Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-red-50/30 border border-gray-200">
            <div className="relative shrink-0">
              {mechanic.user?.image ? (
                <img
                  src={mechanic.user.image}
                  alt={fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-xl flex items-center justify-center shadow-md">
                  {(mechanic.user?.first_name?.[0] || "M").toUpperCase()}
                  {(mechanic.user?.last_name?.[0] || "").toUpperCase()}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  isActive ? "bg-green-500" : "bg-gray-400"
                }`}
                title={isActive ? "Active" : "Inactive"}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {fullName}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-200 text-gray-800 border border-gray-300"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isAvailable
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <Clock size={11} />
                  {isAvailable ? "Available" : "In Service"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {mechanic.experience_years || 0} years professional experience
              </p>
            </div>
          </div>

          {/* Contact & Professional Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Phone size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">Mobile Number</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {mechanic.user?.mobile || "Not specified"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Mail size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">Email Address</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {mechanic.user?.email || "Not specified"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Award size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">Experience</p>
                <p className="text-sm font-semibold text-gray-800">
                  {mechanic.experience_years || 0} Years In Field
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">License / Cert No.</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {mechanic.license_number || "Certified"}
                </p>
              </div>
            </div>
          </div>

          {/* Temporary Password & Login Credentials Card */}
          <div className="p-4 bg-gradient-to-r from-red-50/80 via-white to-amber-50/40 border border-red-200/90 rounded-xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound size={15} className="text-red-600" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Temporary Access Password
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-red-600 bg-red-100/70 border border-red-200 px-2 py-0.5 rounded-full">
                Mechanic App Login
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 p-2.5 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Lock size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Password</p>
                  <p className="text-sm font-mono font-bold text-gray-900 tracking-wider select-all truncate">
                    {showPassword ? tempPassword : "••••••••••••"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                    copiedPassword
                      ? "bg-green-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                  title="Copy password to clipboard"
                >
                  {copiedPassword ? (
                    <>
                      <Check size={13} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              Share this temporary password with the mechanic for their first-time mobile app login.
            </p>
          </div>

          {/* Specializations Section */}
          <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={14} className="text-red-600" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Technical Specializations
              </h4>
            </div>
            {mechanic.specialization && mechanic.specialization.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {mechanic.specialization.map((spec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-red-200 text-red-700 shadow-xs"
                  >
                    <CheckCircle2 size={12} className="text-red-600" />
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No specializations assigned yet.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 border-gray-300 hover:bg-white cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onClose();
              onEdit(mechanic);
            }}
            className="text-xs h-9 px-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Edit size={14} />
            Edit Mechanic
          </Button>
        </div>
      </div>
    </div>
  );
}
