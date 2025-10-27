"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { X, Wrench, MapPin, User, Hash, Check, ArrowRight, Loader2 } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { motion, AnimatePresence } from "framer-motion";

const PROBLEM_CATEGORIES = ["Engine", "Hydraulics", "Electrical", "Transmission", "Brakes", "Other"];
const PRIORITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
}

interface FormData {
  user_id: string;
  tractor_id: string;
  problem_description: string;
  problem_category: string;
  priority_level: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  location_address: string;
  location_lat: string;
  location_lng: string;
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

export default function AddScheduleRepairModal({ isOpen, onClose, onAddSuccess }: AddModalProps) {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [dealerId, setDealerId] = useState<string>("");
  const [baseId, setBaseId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    user_id: "", 
    tractor_id: "", 
    problem_description: "", 
    problem_category: "Engine",
    priority_level: "MEDIUM", 
    location_address: "", 
    location_lat: "", 
    location_lng: "",
  });

  useEffect(() => {
    if (isOpen && access_token) {
      renderInstance.get("/dealer", { headers: { Authorization: `Bearer ${access_token}` } })
        .then((res) => {
          console.log("Dealer Response:", res.data);
          if (Array.isArray(res.data) && res.data.length > 0) {
            setDealerId(res.data[0].id);
            setBaseId(res.data[0].base_id || "");
          }
        })
        .catch((error) => {
          console.error("Dealer Fetch Error:", error.response?.data || error.message);
          errorMessage("Failed to fetch dealer info");
        });
    }
  }, [isOpen, access_token]);

  function handleInputChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validation
    if (!formData.user_id || !formData.tractor_id || !formData.problem_description || !formData.location_address) {
      errorMessage("Please fill in all required fields (*)");
      return;
    }
    
    if (!dealerId || !baseId) {
      errorMessage("Dealer information is missing. Cannot schedule repair.");
      return;
    }

    // Prepare payload
    const payload = { 
      user_id: formData.user_id,
      tractor_id: formData.tractor_id,
      problem_description: formData.problem_description,
      problem_category: formData.problem_category,
      priority_level: formData.priority_level,
      location_address: formData.location_address,
      location_lat: parseFloat(formData.location_lat) || 0,
      location_lng: parseFloat(formData.location_lng) || 0,
      dealer_id: dealerId,
      base_id: baseId
    };

    console.log("Submitting Repair Request:", payload);
    console.log("Using Token:", access_token ? "Token exists" : "No token");
    
    setLoading(true);
    try {
      const response = await renderInstance.post(
        "/dealer/repair-service", 
        payload, 
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      
      console.log("Success Response:", response.data);
      successMessage("Repair scheduled successfully!");
      onAddSuccess();
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          user_id: "", 
          tractor_id: "", 
          problem_description: "", 
          problem_category: "Engine",
          priority_level: "MEDIUM", 
          location_address: "", 
          location_lat: "", 
          location_lng: "",
        });
        setCurrentStep(1);
      }, 300);
    } catch (err: any) {
      console.error("Submit Error:", err.response?.data || err.message);
      console.error("Error Status:", err.response?.status);
      console.error("Error Headers:", err.response?.headers);
      
      // More detailed error message
      const errorMsg = err?.response?.data?.message 
        || err?.response?.data?.error 
        || `Failed to schedule repair (Status: ${err.response?.status || 'Unknown'})`;
      
      errorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  const stepVariants = { 
    hidden: { opacity: 0, x: 50 }, 
    visible: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -50 } 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Schedule New Repair</h2>
          <button onClick={onClose} className="text-white hover:bg-red-800 rounded-full p-2 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Stepper */}
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center">
            {["Details", "Location"].map((title, index) => (
              <React.Fragment key={title}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep > index + 1 
                      ? "bg-red-600 text-white" 
                      : currentStep === index + 1 
                      ? "bg-red-600 text-white ring-4 ring-red-200" 
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > index + 1 ? <Check size={20} /> : index + 1}
                  </div>
                  <p className={`mt-2 text-xs font-semibold w-20 ${
                    currentStep >= index + 1 ? "text-red-600" : "text-gray-500"
                  }`}>
                    {title}
                  </p>
                </div>
                {index < 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > index + 1 ? "bg-red-600" : "bg-gray-200"
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep} 
              variants={stepVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              transition={{ duration: 0.3 }} 
              className="px-8 py-6"
            >
              {/* Step 1: Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      User ID <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={User} 
                      type="text" 
                      name="user_id" 
                      placeholder="Enter the user's ID" 
                      required 
                      value={formData.user_id} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Tractor ID <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={Hash} 
                      type="text" 
                      name="tractor_id" 
                      placeholder="Enter the tractor's ID" 
                      required 
                      value={formData.tractor_id} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Problem Category <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="problem_category" 
                      value={formData.problem_category} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {PROBLEM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Problem Description <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      name="problem_description" 
                      placeholder="Describe the issue in detail..." 
                      required 
                      value={formData.problem_description} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              )}
              
              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Priority Level <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="priority_level" 
                      value={formData.priority_level} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {PRIORITY_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Location Address <span className="text-red-500">*</span>
                    </label>
                    <InputField 
                      icon={MapPin} 
                      type="text" 
                      name="location_address" 
                      placeholder="e.g., Farm House, Village Road..." 
                      required 
                      value={formData.location_address} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold block mb-2 text-gray-700">Latitude</label>
                      <InputField 
                        icon={MapPin} 
                        type="number" 
                        step="any" 
                        name="location_lat" 
                        placeholder="e.g., 28.7041" 
                        value={formData.location_lat} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-2 text-gray-700">Longitude</label>
                      <InputField 
                        icon={MapPin} 
                        type="number" 
                        step="any" 
                        name="location_lng" 
                        placeholder="e.g., 77.1025" 
                        value={formData.location_lng} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Buttons */}
          <div className="flex justify-between gap-4 px-8 pb-6 pt-4 mt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <div>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div>
              {currentStep < 2 && (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Next Step <ArrowRight size={18}/>
                </button>
              )}
              {currentStep === 2 && (
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Wrench size={20} />
                      Schedule Repair
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}