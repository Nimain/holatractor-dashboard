"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { X, Upload, User, Mail, Lock, Phone, Calendar, Briefcase, Award, Check, Link2 } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const SPECIALIZATIONS = ["Engine", "Hydraulics", "Electrical"];

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
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon className="text-gray-400" size={20} />
    </div>
    <input {...props} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none" />
  </div>
);

export default function AddMechanicModal({ isOpen, onClose, onAddSuccess }: AddMechanicModalProps) {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [dealerId, setDealerId] = useState<string>("");
  const [baseId, setBaseId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    first_name: "", last_name: "", email: "", password: "", mobile: "", country_code: "+91",
    gender: "male", dob: "", image: "", specialization: [], experience_years: "", license_number: "",
  });

  const imagePreview = formData.image;

  useEffect(() => {
    if (isOpen && access_token && !dealerId) {
      renderInstance.get("/dealer", { headers: { Authorization: `Bearer ${access_token}` } })
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setDealerId(res.data[0].id);
            setBaseId(res.data[0].base_id || "");
          }
        })
        .catch(() => errorMessage("Failed to fetch dealer info"));
    }
  }, [isOpen, access_token]);

  function handleInputChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSpecChange(spec: string) {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.mobile || !formData.license_number || !formData.dob || formData.specialization.length === 0 || !formData.experience_years) {
      errorMessage("Please fill in all required fields (*)");
      return;
    }
    if (!dealerId) {
      errorMessage("Dealer information is not available. Please try again.");
      return;
    }

    const payload = { ...formData, experience_years: parseInt(formData.experience_years, 10), dealer_id: dealerId, base_id: baseId };

    setLoading(true);
    try {
      await renderInstance.post("/dealer/mechanic", payload, { headers: { Authorization: `Bearer ${access_token}` } });
      successMessage("Mechanic added successfully!");
      onAddSuccess(); // This will close the modal and trigger a refetch
      // Reset form after a short delay to allow closing animation
      setTimeout(() => {
        setFormData({
          first_name: "", last_name: "", email: "", password: "", mobile: "", country_code: "+91",
          gender: "male", dob: "", image: "", specialization: [], experience_years: "", license_number: "",
        });
        setCurrentStep(1);
      }, 300);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to add mechanic";
      errorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

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
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="px-8 py-6">
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div><label className="font-semibold block mb-2 text-gray-700">First Name <span className="text-red-500">*</span></label><InputField icon={User} type="text" name="first_name" placeholder="Enter first name" required value={formData.first_name} onChange={handleInputChange} /></div>
                  <div><label className="font-semibold block mb-2 text-gray-700">Last Name <span className="text-red-500">*</span></label><InputField icon={User} type="text" name="last_name" placeholder="Enter last name" required value={formData.last_name} onChange={handleInputChange} /></div>
                  <div><label className="font-semibold block mb-2 text-gray-700">Mobile <span className="text-red-500">*</span></label><InputField icon={Phone} type="tel" name="mobile" placeholder="Enter mobile number" required value={formData.mobile} onChange={handleInputChange} /></div>
                  <div><label className="font-semibold block mb-2 text-gray-700">Date of Birth <span className="text-red-500">*</span></label><InputField icon={Calendar} type="date" name="dob" required value={formData.dob} onChange={handleInputChange} /></div>
                  <div className="md:col-span-2"><label className="font-semibold block mb-2 text-gray-700">Gender <span className="text-red-500">*</span></label><select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div><label className="font-semibold block mb-2 text-gray-700">License Number <span className="text-red-500">*</span></label><InputField icon={Award} type="text" name="license_number" placeholder="Enter license number" required value={formData.license_number} onChange={handleInputChange} /></div>
                    <div><label className="font-semibold block mb-2 text-gray-700">Experience (years) <span className="text-red-500">*</span></label><InputField icon={Briefcase} type="number" name="experience_years" placeholder="Years of experience" required min={0} value={formData.experience_years} onChange={handleInputChange} /></div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-3 text-gray-700">Specializations <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-3">
                      {SPECIALIZATIONS.map((spec) => {
                        const isSelected = formData.specialization.includes(spec);
                        return (<label key={spec} className={`cursor-pointer px-4 py-2 rounded-full font-medium text-sm transition-all border-2 ${isSelected ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:bg-red-50"}`}><input type="checkbox" className="hidden" onChange={() => handleSpecChange(spec)} checked={isSelected} />{spec}</label>);
                      })}
                    </div>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div><label className="font-semibold block mb-2 text-gray-700">Email <span className="text-red-500">*</span></label><InputField icon={Mail} type="email" name="email" placeholder="mechanic@example.com" required value={formData.email} onChange={handleInputChange} /></div>
                  <div><label className="font-semibold block mb-2 text-gray-700">Password <span className="text-red-500">*</span></label><InputField icon={Lock} type="password" name="password" placeholder="Enter secure password" required value={formData.password} onChange={handleInputChange} /></div>
                  <div className="md:col-span-2">
                    <label className="font-semibold block mb-2 text-gray-700">Profile Image URL</label>
                    <InputField icon={Link2} type="url" name="image" placeholder="https://example.com/image.jpg" value={formData.image} onChange={handleInputChange} />
                    {imagePreview && <div className="mt-4"><img src={imagePreview} alt="Preview" className="rounded-lg shadow-md w-24 h-24 object-cover border-2 border-gray-200" /></div>}
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