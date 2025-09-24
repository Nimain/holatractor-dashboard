"use client";

import { useState, useEffect, useCallback } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import PurchaseAction from "./PurchaseAction"; // Import the new component

// Define the structure of a Purchase object
interface Purchase {
  id: string;
  user: {
    name: string;
    email: string;
  };
  credits: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

const PurchaseManagement = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Function to fetch all purchases from the API
  const fetchPurchases = useCallback(async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const res = await renderInstance.get("/credits/purchases", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setPurchases(res.data.data || []);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      errorMessage("Error fetching purchase list.");
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Function to handle the approve/reject action
  const handleUpdateStatus = async (purchaseId: string, status: 'Approved' | 'Rejected') => {
    setIsUpdating(true);
    try {
      // API call to update the status of a purchase
      // IMPORTANT: Ensure your backend has this endpoint
      await renderInstance.patch(`/credits/purchases/${purchaseId}/status`, { status }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage(`Purchase has been ${status.toLowerCase()}.`);
      await fetchPurchases(); // Refresh the list to show the new status
    } catch (err: any) {
      errorMessage(err.response?.data?.message || `Failed to update purchase.`);
      console.error("Update error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="py-10 px-8 w-full bg-white rounded-lg shadow-md">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || isUpdating}
      >
        <CircularProgress />
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-5 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Credit Purchases ({purchases.length})
        </h2>
      </div>

      {/* Table Header */}
      <div className="text-sm font-semibold text-gray-500 grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 bg-gray-50 p-4 rounded-t-lg border-b">
        <p>#</p>
        <p>User</p>
        <p>Credits</p>
        <p>Amount</p>
        <p>Status</p>
        <p>Date</p>
        <p className="text-center">Actions</p>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {purchases.length === 0 && !loading ? (
          <div className="w-full min-h-[40vh] flex items-center justify-center">
            <p className="text-gray-500 text-xl">No purchases found.</p>
          </div>
        ) : (
          purchases.map((purchase, index) => (
            <PurchaseAction
              key={purchase.id}
              purchase={purchase}
              index={index}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PurchaseManagement;