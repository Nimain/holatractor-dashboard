"use client";
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from "react";
import { X, Wrench, MapPin, User, Hash, Check, ArrowRight, Loader2, ChevronDown, Search, Truck } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth";
import { motion, AnimatePresence } from "framer-motion";

const PROBLEM_CATEGORIES = ["Engine", "Hydraulics", "Electrical", "Transmission", "Brakes", "Other"];
const PRIORITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
  dealerId?: string;
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
  <div className="relative flex items-center">
    <div className="absolute left-3.5 flex items-center pointer-events-none">
      <Icon className="text-gray-400" size={18} />
    </div>
    <input
      {...props}
      className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition outline-none text-gray-800"
    />
  </div>
);

export default function AddScheduleRepairModal({ isOpen, onClose, onAddSuccess, dealerId: propDealerId }: AddModalProps) {
  const cookie = useCookie();
  const rawCookieUser = cookie?.get ? cookie.get("user") : null;
  const cookieToken = cookie?.get ? cookie.get("access_token") : null;
  const authUser = getAuthUser();

  const dynamicDealerId = useMemo(() => {
    if (propDealerId && propDealerId !== "all") return propDealerId;
    try {
      const parsed = typeof rawCookieUser === "string" ? JSON.parse(rawCookieUser) : rawCookieUser;
      return (
        parsed?.dealer_id ||
        parsed?.dealerId ||
        (authUser as any)?.dealer_id ||
        (typeof window !== "undefined" ? localStorage.getItem("dealer_id") : null) ||
        parsed?.userId ||
        parsed?.id ||
        authUser?.userId ||
        authUser?.id ||
        ""
      );
    } catch {
      return (authUser as any)?.dealer_id || authUser?.userId || authUser?.id || "";
    }
  }, [propDealerId, rawCookieUser, authUser]);

  const [dealerId, setDealerId] = useState<string>(dynamicDealerId);
  const [baseId, setBaseId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tractors, setTractors] = useState<any[]>([]);
  const [loadingTractors, setLoadingTractors] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

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

  // Load dealer customers
  useEffect(() => {
    if (isOpen) {
      const activeToken = getAuthToken() || cookieToken || "";
      const currentDealerId = dynamicDealerId || dealerId;
      setDealerId(currentDealerId);

      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;

      // Load customers dynamically scoped to dealer
      const custParams = currentDealerId ? { dealer_id: currentDealerId } : undefined;
      renderInstance.get("/dealer/customers", { headers, params: custParams })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : (res.data?.customers || []);
          setCustomers(list);
          if (list.length > 0 && !formData.user_id) {
            const firstCust = list[0];
            setFormData(prev => ({ 
              ...prev, 
              user_id: firstCust.id,
              location_address: prev.location_address || firstCust.city || "Santa Cruz, Bolivia"
            }));
          }
        })
        .catch(() => setCustomers([]));
    }
  }, [isOpen, cookieToken, dynamicDealerId]);

  // Load tractors & equipment dynamically strictly for selected customer
  useEffect(() => {
    if (!isOpen) return;
    if (!formData.user_id) {
      setTractors([]);
      setFormData((prev) => ({ ...prev, tractor_id: "" }));
      return;
    }

    const activeToken = getAuthToken() || cookieToken || "";
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;
    const currentDealerId = dynamicDealerId || dealerId;

    setLoadingTractors(true);
    const params: Record<string, string> = { customer_id: formData.user_id };
    if (currentDealerId) params.dealer_id = currentDealerId;

    renderInstance
      .get("/dealer/tractors", { headers, params })
      .then((res) => {
        const list = Array.isArray(res.data?.tractors)
          ? res.data.tractors
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setTractors(list);
        if (list.length > 0) {
          const hasCurrent = list.some((t: any) => t.id === formData.tractor_id);
          if (!hasCurrent) {
            setFormData((prev) => ({ ...prev, tractor_id: list[0].id }));
          }
        } else {
          setFormData((prev) => ({ ...prev, tractor_id: "" }));
        }
      })
      .catch((err) => {
        console.error("Error loading customer equipment:", err);
        setTractors([]);
        setFormData((prev) => ({ ...prev, tractor_id: "" }));
      })
      .finally(() => setLoadingTractors(false));
  }, [isOpen, formData.user_id, dynamicDealerId, cookieToken]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === formData.user_id || c.user_id === formData.user_id) || null;
  }, [customers, formData.user_id]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(c => {
      const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
      const phone = String(c.mobile || "").toLowerCase();
      const email = String(c.email || "").toLowerCase();
      const city = String(c.city || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || city.includes(q);
    });
  }, [customers, customerSearch]);

  const customerTractors = useMemo(() => {
    return tractors.filter(t => (t.equipment_type === "tractor" || !t.equipment_type) && t.source !== "liked_booked");
  }, [tractors]);

  const customerAttachments = useMemo(() => {
    return tractors.filter(t => t.equipment_type === "attachment");
  }, [tractors]);

  const customerLikedEquipment = useMemo(() => {
    return tractors.filter(t => t.source === "liked_booked");
  }, [tractors]);

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
    
    const activeDealerId = dealerId || dynamicDealerId;

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
      dealer_id: activeDealerId,
      base_id: baseId || undefined
    };

    const activeToken = getAuthToken() || cookieToken || "";
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : undefined;
    
    setLoading(true);
    try {
      const response = await renderInstance.post(
        "/dealer/repair-service", 
        payload, 
        { headers }
      );
      
      successMessage("Repair scheduled successfully!");
      onAddSuccess();
      
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
                  {/* Searchable Customer Field */}
                  <div className="relative">
                    <label className="font-semibold block mb-2 text-gray-700 flex items-center justify-between">
                      <span>Customer (Dealer's Client) <span className="text-red-500">*</span></span>
                      {selectedCustomer && (
                        <span className="text-xs text-green-700 bg-green-100 font-medium px-2 py-0.5 rounded-full">
                          Selected: {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </span>
                      )}
                    </label>

                    {/* Search / Select Container */}
                    <div className="relative">
                      <div className="flex items-center gap-2 h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500">
                        <User size={18} className="text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder={selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ""} (${selectedCustomer.mobile || selectedCustomer.email || "ID: " + String(selectedCustomer.id).slice(0, 8)})` : "Search customer by name, phone or email..."}
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          onFocus={() => setIsCustomerDropdownOpen(true)}
                          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-800"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {/* Dropdown list */}
                      {isCustomerDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-30 divide-y divide-gray-50">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">
                              No matching customers found for this dealer
                            </div>
                          ) : (
                            filteredCustomers.map((cust) => {
                              const isSelected = cust.id === formData.user_id || cust.user_id === formData.user_id;
                              return (
                                <div
                                  key={cust.id}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      user_id: cust.id,
                                      location_address: prev.location_address || cust.city || "Santa Cruz, Bolivia"
                                    }));
                                    setCustomerSearch(`${cust.first_name || ""} ${cust.last_name || ""}`.trim());
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className={`p-3 text-left hover:bg-red-50 cursor-pointer transition-colors flex items-center justify-between ${
                                    isSelected ? "bg-red-50/70 border-l-4 border-red-600" : ""
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {cust.first_name} {cust.last_name || ""}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {cust.mobile || cust.email || "No contact info"} {cust.city ? `• ${cust.city}` : ""}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check size={16} className="text-red-600" />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Dynamic Tractor / Equipment Field (Scoped Strictly to Customer) */}
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700 flex items-center justify-between">
                      <span>Tractor / Equipment <span className="text-red-500">*</span></span>
                      {loadingTractors && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Loading customer equipment...
                        </span>
                      )}
                    </label>

                    <div className="relative flex items-center">
                      <Truck size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                      <select
                        name="tractor_id"
                        required
                        value={formData.tractor_id}
                        onChange={handleInputChange}
                        disabled={loadingTractors || tractors.length === 0}
                        className="w-full h-11 pl-10 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-60 appearance-none cursor-pointer"
                      >
                        <option value="">
                          {loadingTractors
                            ? "-- Loading customer equipment... --"
                            : tractors.length === 0
                            ? "-- No equipment in customer's fleet --"
                            : "-- Select Tractor or Equipment --"}
                        </option>
                        {customerTractors.length > 0 && (
                          <optgroup label="Customer Fleet - Tractors">
                            {customerTractors.map((t) => (
                              <option key={t.id} value={t.id}>
                                🚜 {t.name} {t.model && t.model !== t.name ? `(${t.model})` : ""} {t.identifier ? `• VIN: ${t.identifier}` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {customerAttachments.length > 0 && (
                          <optgroup label="Customer Fleet - Implements & Attachments">
                            {customerAttachments.map((a) => (
                              <option key={a.id} value={a.id}>
                                🔧 {a.name} {a.identifier ? `• Serial: ${a.identifier}` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {customerLikedEquipment.length > 0 && (
                          <optgroup label="Customer Liked / Booked Equipment">
                            {customerLikedEquipment.map((t) => (
                              <option key={t.id} value={t.id}>
                                ⭐ {t.name} ({t.model || t.brand})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <div className="absolute right-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>

                    {tractors.length > 0 ? (
                      <p className="mt-1 text-xs text-green-700 font-medium">
                        Found {tractors.length} registered equipment item(s) in this customer's fleet.
                      </p>
                    ) : !loadingTractors && formData.user_id ? (
                      <p className="mt-1 text-xs text-amber-600 font-medium">
                        No registered tractors or attachments found for this client. You can add machinery to their fleet in Customer Details.
                      </p>
                    ) : null}
                  </div>
                  
                  <div>
                    <label className="font-semibold block mb-2 text-gray-700">
                      Problem Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Wrench size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                      <select 
                        name="problem_category" 
                        value={formData.problem_category} 
                        onChange={handleInputChange} 
                        className="w-full h-11 pl-10 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {PROBLEM_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
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
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none" 
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
                    <div className="relative flex items-center">
                      <Hash size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                      <select 
                        name="priority_level" 
                        value={formData.priority_level} 
                        onChange={handleInputChange} 
                        className="w-full h-11 pl-10 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {PRIORITY_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
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