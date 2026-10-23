"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Image from "next/image";
import PaymentAction from "./PaymentAction";
import NullImage from "@/assets/AnimateIcons/Owner.svg"; // Make sure this path is correct
import axios from "axios";
// Imports for the icons needed for the hover effect
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";


// Interface for payment data from the API
interface Payment {
  id: string;
  amount: number;
  status: "Success" | "Pending" | "Failed" | "NotGenerated";
  createdAt: string;
  updatedAt?: string;
  user?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email?: string;
  };
  // ... other fields
}

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];
  return token || null;
};

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [mailHover, setMailHover] = useState(-1); // This is for rows
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    status: "Pending" as Payment["status"],
  });
  
  // ✨ 1. State to manage hover on table HEADERS
  const [activeHeaderHover, setActiveHeaderHover] = useState("");

  const API_BASE =
    process.env.NEXT_PUBLIC_TRACTOR_AI_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://tractorai.sinsignal.com";
  const access_token = getAccessToken();

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      if (!access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/subscriptionpayment`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const sortedData = (res.data || []).sort(
          (a: Payment, b: Payment) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPayments(sortedData);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [API_BASE, access_token]);

  const handleAddPayment = async () => {
    if (!form.amount || Number(form.amount) <= 0)
      return alert("Enter a valid amount");
    if (!access_token) return alert("Please login first");

    try {
      const res = await axios.post(
        `${API_BASE}/subscriptionpayment`,
        { amount: Number(form.amount), status: form.status },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (res.data?.id) {
        setPayments((prev) => [res.data, ...prev]);
        setForm({ amount: "", status: "Pending" });
        setOpenModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add payment");
    }
  };

  return (
    <div className="mt-[40px] text-[18px]">
      {/* Header and Add Payment Button */}
      <div className="mb-[20px] flex items-center justify-between">
        <p className="text-[22px] font-[600]">
          Total Payments: {payments.length}
        </p>
        <button
          onClick={() => setOpenModal(true)}
          disabled={!access_token}
          className={`px-[20px] py-[10px] text-[18px] rounded-md flex items-center gap-[10px] transition-all ${
            access_token
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus size={20} />
          Add Payment
        </button>
      </div>

      {/* ✨ 2. The JSX for the interactive headers */}
      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        {/* SLNO Header */}
        <div
          className="w-[100px] flex items-center justify-between group"
          onMouseEnter={() => setActiveHeaderHover("slno")}
          onMouseLeave={() => setActiveHeaderHover("")}
        >
          {activeHeaderHover === "slno" ? "sl..." : "slno"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><ArrowUpwardIcon /></div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><MoreVertIcon /></div>
          </div>
        </div>

        {/* ID Header */}
        <div
          className="w-[250px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHeaderHover("id")}
          onMouseLeave={() => setActiveHeaderHover("")}
        >
          {activeHeaderHover === "id" ? "id..." : "id"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><ArrowUpwardIcon /></div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><MoreVertIcon /></div>
          </div>
        </div>

        {/* Amount Header */}
        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHeaderHover("amount")}
          onMouseLeave={() => setActiveHeaderHover("")}
        >
          {activeHeaderHover === "amount" ? "amou..." : "amount($)"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><ArrowUpwardIcon /></div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><MoreVertIcon /></div>
          </div>
        </div>
        
        {/* Status Header */}
        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHeaderHover("status")}
          onMouseLeave={() => setActiveHeaderHover("")}
        >
          {activeHeaderHover === "status" ? "sta..." : "status"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><ArrowUpwardIcon /></div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><MoreVertIcon /></div>
          </div>
        </div>

        {/* Created Header */}
        <div
          className="w-[220px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHeaderHover("created")}
          onMouseLeave={() => setActiveHeaderHover("")}
        >
          {activeHeaderHover === "created" ? "crea..." : "created"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><ArrowUpwardIcon /></div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all hover:bg-gray-300"><MoreVertIcon /></div>
          </div>
        </div>
      </div>

     {/* Payment List */}
<div className="flex flex-col gap-[5px] mt-[20px] min-h-[60vh]">
  {loading ? (
    <p className="text-center mt-8">Fetching payments...</p>
  ) : payments.length === 0 ? (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
      <Image
        src={NullImage}
        alt="No payment found"
        className="w-[400px] lg:w-[700px] h-auto object-cover"
        width={400}
        height={400}
        unoptimized
      />
    </div>
  ) : (
    payments.map((payment, index) => (
      <div
        key={payment.id}
        onMouseEnter={() => setMailHover(index)}
        onMouseLeave={() => setMailHover(-1)}
        className="w-full"
      >
        <PaymentAction
          payment={payment}
          index={index}
          mailHover={mailHover}
        />
      </div>
    ))
  )}
</div>

      {/* Add Payment Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-2xl border border-gray-100 overflow-hidden relative">
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Financial Records</p>
              <h2 className="text-xl font-bold">Add New Payment</h2>
              <p className="text-xs text-slate-300 mt-1">Record a manual transaction or settlement entry.</p>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Payment Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Transaction Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Payment["status"],
                    })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                >
                  <option value="Pending">🟡 Pending Verification</option>
                  <option value="Success">🟢 Completed (Success)</option>
                  <option value="Failed">🔴 Failed / Rejected</option>
                  <option value="NotGenerated">⚪ Not Generated</option>
                </select>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;