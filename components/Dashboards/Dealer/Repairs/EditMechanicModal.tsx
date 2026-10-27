"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Camera,
  Loader2,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { MechanicData } from "./ViewMechanicModal";

const AVAILABLE_SPECIALIZATIONS = [
  "Engine",
  "Hydraulics",
  "Electrical",
  "Transmission",
  "Brake Systems",
  "Fuel Injection",
  "Air Conditioning",
  "General Maintenance",
  "GPS & Telematics",
];

interface EditMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanic: MechanicData | null;
  onSuccess: () => void;
}

export default function EditMechanicModal({
  isOpen,
  onClose,
  mechanic,
  onSuccess,
}: EditMechanicModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [customSpec, setCustomSpec] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mechanic) {
      setFirstName(mechanic.user?.first_name || "");
      setLastName(mechanic.user?.last_name || "");
      setMobile(mechanic.user?.mobile || "");
      setEmail(mechanic.user?.email || "");
      setExperienceYears(String(mechanic.experience_years ?? 1));
      setLicenseNumber(mechanic.license_number || "");
      setStatus(mechanic.Status === 0 ? 0 : 1);
      setIsAvailable(mechanic.is_available !== false);
      setSpecializations(
        Array.isArray(mechanic.specialization) && mechanic.specialization.length > 0
          ? [...mechanic.specialization]
          : ["Engine"]
      );
      setImagePreview(mechanic.user?.image || "");
      setImageFile(null);
      setErrorMsg("");
    }
  }, [mechanic, isOpen]);

  if (!isOpen || !mechanic) return null;

  const toggleSpecialization = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleAddCustomSpec = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSpec.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations((prev) => [...prev, trimmed]);
      setCustomSpec("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim()) {
      setErrorMsg("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg("Last name is required");
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg("Mobile number is required");
      return;
    }
    if (specializations.length === 0) {
      setErrorMsg("Please select at least one technical specialization");
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = imagePreview;
      if (imageFile) {
        try {
          finalImageUrl = await uploadFileToS3(imageFile, imageFile.name);
        } catch (uploadErr) {
          console.warn("Image upload failed, preserving existing photo:", uploadErr);
        }
      }

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        experience_years: parseInt(experienceYears) || 0,
        license_number: licenseNumber.trim(),
        Status: status,
        is_available: isAvailable,
        specialization: specializations,
        image: finalImageUrl,
      };

      await renderInstance.put(`/dealer/mechanic/${mechanic.id}`, payload);

      successMessage("Mechanic updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update mechanic";
      setErrorMsg(msg);
      errorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <Wrench size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Edit Mechanic</h2>
              <p className="text-xs text-white/80">Updating ID: {mechanic.id}</p>
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Profile Photo & Status Row */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm border border-red-200">
                    <Camera size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">Mechanic Photo</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {imageFile ? imageFile.name : "JPEG, PNG up to 5MB"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="text-xs text-red-600 hover:underline px-1 font-medium cursor-pointer"
                >
                  Remove
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 px-3 border-gray-300 hover:bg-white cursor-pointer"
              >
                <Upload size={13} className="mr-1.5" />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos"
                className="h-10 text-sm border-gray-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ramirez"
                className="h-10 text-sm border-gray-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+591 70001234"
                className="h-10 text-sm border-gray-200 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@holatractor.com"
                className="h-10 text-sm border-gray-200 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Experience (Years)
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="h-10 text-sm border-gray-200 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                License / Certification No.
              </label>
              <Input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="CERT-JD-9821"
                className="h-10 text-sm border-gray-200 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <Select
                value={String(status)}
                onValueChange={(val) => setStatus(Number(val))}
              >
                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-red-500">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Availability</label>
              <Select
                value={isAvailable ? "available" : "in_service"}
                onValueChange={(val) => setIsAvailable(val === "available")}
              >
                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-red-500">
                  <SelectValue placeholder="Select Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available (On-Call)</SelectItem>
                  <SelectItem value="in_service">In Service (Busy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Specializations */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Technical Specializations <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {AVAILABLE_SPECIALIZATIONS.map((spec) => {
                const isSelected = specializations.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {spec}
                  </button>
                );
              })}
              {/* Custom ones added */}
              {specializations
                .filter((s) => !AVAILABLE_SPECIALIZATIONS.includes(s))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => toggleSpecialization(custom)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white shadow-xs cursor-pointer"
                  >
                    <Check size={12} />
                    {custom}
                  </button>
                ))}
            </div>

            {/* Add Custom Tag Input */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add other specialization (e.g. Combine Harvesters)"
                value={customSpec}
                onChange={(e) => setCustomSpec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSpec(e);
                  }
                }}
                className="h-8 text-xs border-gray-200"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomSpec}
                className="h-8 text-xs px-2.5 shrink-0 border-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                <Plus size={13} className="mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs h-10 px-4 border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-xs h-10 px-6 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
