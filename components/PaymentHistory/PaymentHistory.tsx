"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import axios from "axios";

// 1. ADD "NotGenerated" TO THE LIST OF ALLOWED STATUSES
type PaymentStatus = "Success" | "Pending" | "Failed" | "NotGenerated";

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];
  return token || null;
};

// 3. UPDATE THE HELPER TO FORMAT THE TEXT FOR DISPLAY
const formatStatus = (status: PaymentStatus): string => {
  if (status === "NotGenerated") return "Not Generated";
  return status;
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: "",
    status: "Pending" as PaymentStatus,
  });

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://holatractor-backend-render.onrender.com";

  const access_token = getAccessToken();

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      if (!access_token) {
        setError("Please login to view your payment history.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/subscriptionpayment`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        setPayments(res.data || []);
        setError(null);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
        } else {
          setError("Failed to fetch payments. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [API_BASE, access_token]);

  const handleAddPayment = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!access_token) {
      alert("⚠️ Please login to add payments.");
      return;
    }
    try {
      const newPayment = {
        amount: Number(form.amount),
        status: form.status,
      };
      const res = await axios.post(
        `${API_BASE}/subscriptionpayment`,
        newPayment,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data && res.data.id) {
        setPayments((prevPayments) => [...prevPayments, res.data]);
        setForm({ amount: "", status: "Pending" });
        setOpenModal(false);
      } else {
        alert(
          res.data.message ||
            "An unknown error occurred while adding the payment."
        );
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert("Your session has expired. Please login again.");
      } else {
        alert(
          `Failed to add payment: ${err.response?.data?.message || err.message}`
        );
      }
    }
  };

  return (
    <div className="w-full py-[20px]">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
      )}
      <div className="w-full flex items-center justify-between gap-[20px]">
        <h1 className="text-[20px] font-[600]">
          Total Payments: {payments.length}
        </h1>
        <button
          onClick={() => setOpenModal(true)}
          disabled={!access_token}
          className={`px-[20px] py-[10px] text-[18px] rounded-md w-fit flex items-center justify-center gap-[10px] ml-auto transition-all ${
            access_token
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Plus size={20} />
          <span>Add Payment</span>
        </button>
      </div>
      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded mt-[30px]">
        <p className="w-[80px]">Sl. No.</p>
        <p className="w-[200px]">ID</p>
        <p className="w-[150px]">Amount ($)</p>
        <p className="w-[150px]">Status</p>
        <p className="w-[200px]">Created At</p>
      </div>
      <div className="flex flex-col gap-[5px] mt-[20px] min-h-[60vh]">
        {error ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        ) : !loading && payments.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">No payments found</p>
          </div>
        ) : (
          payments.map((payment, index) => (
            <div
              key={payment.id}
              className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded transition-all duration-300 hover:bg-white"
            >
              <p className="w-[80px]">{index + 1}</p>
              <p className="w-[200px] truncate" title={payment.id}>
                {payment.id}
              </p>
              <p className="w-[150px]">${payment.amount.toFixed(2)}</p>
              <div className="w-[150px]">
                <span
                  className={`px-[8px] py-[4px] rounded text-[14px] font-[500] ${
                    // 2. ADD A SPECIFIC STYLE FOR "NotGenerated"
                    payment.status === "Success"
                      ? "bg-green-100 text-green-700"
                      : payment.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : payment.status === "NotGenerated"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {formatStatus(payment.status)}
                </span>
              </div>
              <p className="w-[200px]">
                {new Date(payment.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] relative">
            <h2 className="text-xl font-semibold mb-4">Add New Payment</h2>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Amount in $"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black"
                min="0.01"
                step="0.01"
              />
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as PaymentStatus })
                }
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {/* 4. ADD "NotGenerated" AS AN OPTION IN THE MODAL */}
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="NotGenerated">Not Generated</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setOpenModal(false);
                  setForm({ amount: "", status: "Pending" });
                }}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}