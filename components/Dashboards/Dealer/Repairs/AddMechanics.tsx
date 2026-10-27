"use client";
import React, { useState, useEffect, useRef, useMemo, ChangeEvent, FormEvent } from "react";
import { 
  X, Upload, User, Mail, Lock, Phone, Calendar, Briefcase, Award, 
  Check, Link2, Eye, EyeOff, Sparkles, Copy, Camera, ChevronLeft, 
  ChevronRight, ChevronDown, UserCheck, AlertCircle 
} from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth";
import { CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";

const SPECIALIZATIONS = ["Engine", "Hydraulics", "Electrical"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface AddMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
}

interface FormData {
  first_name: string; last_name: string; email: string; password: string; mobile: string;
  country_code: string; gender: string; dob: string; image: string;
  specialization: string[]; experience_years: string; license_number: string;
}

interface InputFieldProps {
  icon: React.ElementType;
  [key: string]: any;
}

const InputField = ({ icon: Icon, ...props }: InputFieldProps) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
      <Icon size={20} />
    </div>
    <input 
      {...props} 
      className="w-full pl-12 pr-4 py-3 h-[48px] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none text-sm text-gray-800" 
    />
  </div>
);

// Sleek Custom Date Picker Widget
const DatePickerWidget = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date(1995, 0, 15);
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  const displayString = useMemo(() => {
    if (!value) return "";
    const parts = value.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    }
    return value;
  }, [value]);

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 16;
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= 1950; y--) {
      list.push(y);
    }
    return list;
  }, [maxYear]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-10 py-3 h-[48px] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none text-left flex items-center justify-between hover:bg-gray-100/70 cursor-pointer"
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Calendar size={20} />
        </div>
        <span className={displayString ? "text-gray-800 text-sm font-medium" : "text-gray-400 text-sm"}>
          {displayString || "Select date of birth..."}
        </span>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-4 bg-white border border-gray-200 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-red-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-red-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="text-[11px] font-semibold text-gray-400 py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const formattedCurrent = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === formattedCurrent;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 text-xs rounded-xl flex items-center justify-center font-medium transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white font-bold shadow-md scale-105"
                      : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AddMechanicModal({ isOpen, onClose, onAddSuccess }: AddMechanicModalProps) {
  const { cookie } = useCookie();
  const cookieToken = cookie?.get("access_token");

  const [dealerId, setDealerId] = useState<string>("");
  const [baseId, setBaseId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stepError, setStepError] = useState<string>("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    first_name: "", last_name: "", email: "", password: "", mobile: "", country_code: "+91",
    gender: "male", dob: "", image: "", specialization: [], experience_years: "", license_number: "",
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    pwd += "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
    pwd += "abcdefghijkmnpqrstuvwxyz"[Math.floor(Math.random() * 24)];
    pwd += "23456789"[Math.floor(Math.random() * 8)];
    pwd += "!@#$%&*"[Math.floor(Math.random() * 7)];
    for (let i = 4; i < 12; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    pwd = pwd.split("").sort(() => 0.5 - Math.random()).join("");
    setFormData(prev => ({ ...prev, password: pwd }));
    setShowPassword(true);
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pwd);
    }
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3500);
    setStepError("");
  };

  const copyPasswordToClipboard = () => {
    if (!formData.password) return;
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(formData.password);
    }
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 3500);
  };

  const handleImageFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStepError("Please upload a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStepError("Image size exceeds 5MB limit");
      return;
    }

    setUploadingImage(true);
    setStepError("");
    try {
      const url = await uploadFileToS3(file, file.name);
      if (url) {
        setFormData(prev => ({ ...prev, image: url }));
        setImageUploaded(true);
        setTimeout(() => setImageUploaded(false), 3500);
      } else {
        setStepError("Failed to upload profile photo");
      }
    } catch (err: any) {
      console.error("Error uploading profile photo:", err);
      setStepError("Failed to upload profile photo");
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const activeToken = getAuthToken() || cookieToken || "";
      const authUser = getAuthUser();
      const rawUserCookie = cookie?.get ? cookie.get("user") : null;
      let dynDealerId = (authUser as any)?.dealer_id || authUser?.userId || "";
      if (!dynDealerId && rawUserCookie) {
        try {
          const parsed = typeof rawUserCookie === "string" ? JSON.parse(rawUserCookie) : rawUserCookie;
          dynDealerId = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id || "";
        } catch {}
      }

      if (dynDealerId) {
        setDealerId(dynDealerId);
      }
      if ((authUser as any)?.base_id) {
        setBaseId((authUser as any).base_id);
      }

      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;
      renderInstance.get("/dealer", { headers })
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setDealerId(res.data[0].id || dynDealerId);
            setBaseId(res.data[0].base_id || "");
          }
        })
        .catch(() => {
          setDealerId(dynDealerId);
          setBaseId((authUser as any)?.base_id || "");
        });
    }
  }, [isOpen, cookieToken]);

  function handleInputChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (stepError) setStepError("");
  }

  function handleSpecChange(spec: string) {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
    if (stepError) setStepError("");
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.first_name.trim()) {
        setStepError("Please fill in First Name (*)");
        return false;
      }
      if (!formData.last_name.trim()) {
        setStepError("Please fill in Last Name (*)");
        return false;
      }
      if (!formData.mobile.trim()) {
        setStepError("Please fill in Mobile Number (*)");
        return false;
      }
      if (!formData.dob) {
        setStepError("Please select Date of Birth (*)");
        return false;
      }
      if (!formData.gender) {
        setStepError("Please select Gender (*)");
        return false;
      }
      setStepError("");
      return true;
    }

    if (step === 2) {
      if (!formData.license_number.trim()) {
        setStepError("Please fill in License Number (*)");
        return false;
      }
      if (formData.experience_years === "" || isNaN(Number(formData.experience_years)) || Number(formData.experience_years) < 0) {
        setStepError("Please enter valid Experience (years) (*)");
        return false;
      }
      if (formData.specialization.length === 0) {
        setStepError("Please select at least one Specialization (*)");
        return false;
      }
      setStepError("");
      return true;
    }

    if (step === 3) {
      if (!formData.email.trim()) {
        setStepError("Please fill in Email Address (*)");
        return false;
      }
      if (!formData.password.trim()) {
        setStepError("Please enter or generate a Password (*)");
        return false;
      }
      setStepError("");
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setStepError("");
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStepError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    const authUser = getAuthUser();
    const rawUserCookie = cookie?.get ? cookie.get("user") : null;
    let dynDealerId = dealerId || (authUser as any)?.dealer_id || authUser?.userId || "";
    if (!dynDealerId && rawUserCookie) {
      try {
        const parsed = typeof rawUserCookie === "string" ? JSON.parse(rawUserCookie) : rawUserCookie;
        dynDealerId = parsed?.dealer_id || parsed?.dealerId || parsed?.userId || parsed?.id || "";
      } catch {}
    }

    const payload = { 
      ...formData, 
      experience_years: parseInt(formData.experience_years, 10), 
      dealer_id: dynDealerId, 
      base_id: baseId || undefined 
    };

    const activeToken = getAuthToken() || cookieToken || "";
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

    setLoading(true);
    setStepError("");
    try {
      await renderInstance.post("/dealer/mechanic", payload, { headers });
      // Closes modal and refreshes mechanics without showing top-right toast dialog
      onAddSuccess();
      setTimeout(() => {
        setFormData({
          first_name: "", last_name: "", email: "", password: "", mobile: "", country_code: "+91",
          gender: "male", dob: "", image: "", specialization: [], experience_years: "", license_number: "",
        });
        setCurrentStep(1);
        setStepError("");
      }, 300);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to add mechanic";
      setStepError(errorMsg);
      errorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const stepVariants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col transform transition-all">
        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Add New Mechanic</h2>
          <button onClick={onClose} className="text-white hover:bg-red-800 rounded-full p-2 transition-colors"><X size={24} /></button>
        </div>

        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center">
            {["Personal", "Professional", "Account"].map((title, index) => (
              <React.Fragment key={title}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep > index ? "bg-red-600 text-white" : currentStep === index + 1 ? "bg-red-600 text-white ring-4 ring-red-200" : "bg-gray-200 text-gray-500"}`}>
                    {currentStep > index + 1 ? <Check size={20} /> : index + 1}
                  </div>
                  <p className={`mt-2 text-xs font-semibold w-20 ${currentStep >= index + 1 ? "text-red-600" : "text-gray-500"}`}>{title}</p>
                </div>
                {index < 2 && <div className={`flex-1 h-1 mx-2 transition-all ${currentStep > index + 1 ? "bg-red-600" : "bg-gray-200"}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {stepError && (
            <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{stepError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={currentStep} variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="px-8 py-6">
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={User} 
                      type="text" 
                      name="first_name" 
                      placeholder="Enter first name" 
                      required 
                      value={formData.first_name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={User} 
                      type="text" 
                      name="last_name" 
                      placeholder="Enter last name" 
                      required 
                      value={formData.last_name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={Phone} 
                      type="tel" 
                      name="mobile" 
                      placeholder="Enter mobile number" 
                      required 
                      value={formData.mobile} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <DatePickerWidget 
                      value={formData.dob} 
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, dob: val }));
                        if (stepError) setStepError("");
                      }} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-semibold block mb-2 text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <UserCheck size={20} />
                      </div>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleInputChange} 
                        className="w-full pl-12 pr-10 py-3 h-[48px] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none text-gray-800 text-sm appearance-none cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div>
                      <label className="font-semibold block mb-2 text-gray-700">
                        License Number <span className="text-red-500">*</span>
                      </label>
                      <InputField 
                        icon={Award} 
                        type="text" 
                        name="license_number" 
                        placeholder="Enter license number" 
                        required 
                        value={formData.license_number} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-2 text-gray-700">
                        Experience (years) <span className="text-red-500">*</span>
                      </label>
                      <InputField 
                        icon={Briefcase} 
                        type="number" 
                        name="experience_years" 
                        placeholder="Years of experience" 
                        required 
                        min={0} 
                        value={formData.experience_years} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-3 text-gray-700">
                      Specializations <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {SPECIALIZATIONS.map((spec) => {
                        const isSelected = formData.specialization.includes(spec);
                        return (
                          <label 
                            key={spec} 
                            className={`cursor-pointer px-4 py-2 rounded-full font-medium text-sm transition-all border-2 ${
                              isSelected 
                                ? "bg-red-600 text-white border-red-600 shadow-md" 
                                : "bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:bg-red-50"
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              onChange={() => handleSpecChange(spec)} 
                              checked={isSelected} 
                            />
                            {spec}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={Mail} 
                      type="email" 
                      name="email" 
                      placeholder="mechanic@example.com" 
                      required 
                      value={formData.email} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Password with Auto Generate and Copy */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {passwordCopied && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                            <Check size={12} /> Auto-generated & copied!
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>Auto Generate</span>
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="text-gray-400" size={20} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter or auto-generate password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-20 py-3 h-[48px] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none text-sm text-gray-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
                        {formData.password && (
                          <button
                            type="button"
                            onClick={copyPasswordToClipboard}
                            title="Copy Password"
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Image with File Upload */}
                  <div className="md:col-span-2">
                    <label className="font-semibold block mb-2 text-gray-700">
                      Profile Image
                    </label>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      {/* Avatar preview */}
                      <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 group shadow-inner">
                        {formData.image ? (
                          <>
                            <img
                              src={formData.image}
                              alt="Mechanic profile"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                            {uploadingImage ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              <>
                                <Camera size={26} />
                                <span className="text-[10px] mt-1 font-medium text-gray-500">No Image</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Upload controls */}
                      <div className="flex-1 space-y-2.5 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:border-red-400 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-red-50 transition-all">
                            {uploadingImage ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Upload size={15} className="text-red-600" />
                            )}
                            <span>{uploadingImage ? "Uploading to S3..." : "Upload Photo"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>

                          {imageUploaded && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                              <Check size={12} /> Photo uploaded!
                            </span>
                          )}

                          <span className="text-xs text-gray-400">or enter image URL below</span>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Link2 className="text-gray-400" size={16} />
                          </div>
                          <input
                            type="url"
                            name="image"
                            placeholder="https://example.com/mechanic-photo.jpg"
                            value={formData.image}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-4 py-2 h-[38px] bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-red-500 outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Supports JPG, PNG, WEBP. Max file size: 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between gap-4 px-8 pb-6 pt-4 mt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <div>{currentStep > 1 && (<button type="button" onClick={prevStep} className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Back</button>)}</div>
            <div>
              {currentStep < 3 && (<button type="button" onClick={nextStep} className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all">Next Step</button>)}
              {currentStep === 3 && (<button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (<><CircularProgress size={20} color="inherit" /> Adding...</>) : (<><Upload size={20} /> Add Mechanic</>)}
                </button>)}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}