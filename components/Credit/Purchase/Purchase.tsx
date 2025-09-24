"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Eye, Check, X, Receipt, User, Calendar, CreditCard, Hash } from "lucide-react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";

// Updated interface to match API response
interface Purchase {
  id: string;
  user_id: string;
  package_id: string;
  coupon_id: string | null;
  currency_id: string;
  credit_id: string;
  credits_received: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_reference: string | null;
  payment_proof: string[];
  status: 'Pending' | 'Completed' | 'Rejected';
  base_id: string;
  createdAt: string;
  updatedAt: string;
  // Optional user data that might be populated
  user?: {
    name: string;
    email: string;
  };
}

interface PurchaseActionProps {
  purchase: Purchase;
  index: number;
  isUpdating: boolean;
  onUpdateStatus: (purchaseId: string, status: 'Completed' | 'Rejected') => void;
}

const PurchaseAction = ({ purchase, index, onUpdateStatus, isUpdating }: PurchaseActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'Qr_code':
        return 'QR Code';
      case 'CoD':
        return 'Cash on Delivery';
      case 'UPI':
        return 'UPI';
      default:
        return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <>
      {/* Table Row */}
      <div
        className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <p className="text-sm font-medium">{index + 1}</p>
        <div>
          <p className="font-medium text-gray-800">
            {purchase.user?.name || `User ${purchase.user_id.slice(-8)}`}
          </p>
          <p className="text-xs text-gray-500">
            {purchase.user?.email || purchase.user_id}
          </p>
        </div>
        <p className="font-bold text-blue-600">+{purchase.credits_received}</p>
        <p className="text-sm">
          <span className="text-gray-500 line-through">
            {purchase.original_amount !== purchase.final_amount && formatCurrency(purchase.original_amount)}
          </span>
          <span className="ml-1 font-medium">{formatCurrency(purchase.final_amount)}</span>
        </p>
        <p className="text-sm">{formatPaymentMethod(purchase.payment_method)}</p>
        <p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(purchase.status)}`}>
            {purchase.status}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          {new Date(purchase.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </p>
        <div className="text-center">
          <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          className: "rounded-lg"
        }}
      >
        <DialogTitle className="border-b">
          <div className="flex items-center gap-3">
            <Receipt className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Purchase Details</h3>
          </div>
        </DialogTitle>
        <DialogContent className="p-0">
          <div className="p-6 space-y-6">
            {/* User Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="text-gray-600" size={20} />
                <h4 className="font-semibold text-gray-800">Customer Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Name</p>
                  <p className="font-medium">{purchase.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Email</p>
                  <p className="font-medium">{purchase.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">User ID</p>
                  <p className="font-mono text-xs">{purchase.user_id}</p>
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-blue-600" size={20} />
                <h4 className="font-semibold text-gray-800">Purchase Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Credits</p>
                  <p className="font-bold text-blue-600 text-lg">+{purchase.credits_received}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(purchase.status)}`}>
                    {purchase.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Original Amount</p>
                  <p className="font-medium">{formatCurrency(purchase.original_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Final Amount</p>
                  <p className="font-bold text-green-600">{formatCurrency(purchase.final_amount)}</p>
                </div>
                {purchase.discount_amount > 0 && (
                  <div>
                    <p className="text-gray-600 mb-1">Discount</p>
                    <p className="font-medium text-green-600">-{formatCurrency(purchase.discount_amount)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="text-yellow-600" size={20} />
                <h4 className="font-semibold text-gray-800">Payment Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Payment Method</p>
                  <p className="font-medium">{formatPaymentMethod(purchase.payment_method)}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Payment Reference</p>
                  <p className="font-mono text-xs break-all">
                    {purchase.payment_reference || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-gray-600" size={20} />
                <h4 className="font-semibold text-gray-800">Transaction Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Transaction ID</p>
                  <p className="font-mono text-xs break-all">{purchase.id}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Package ID</p>
                  <p className="font-mono text-xs break-all">{purchase.package_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Created At</p>
                  <p className="font-medium">
                    {new Date(purchase.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Updated At</p>
                  <p className="font-medium">
                    {new Date(purchase.updatedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            {purchase.payment_proof && purchase.payment_proof.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Payment Proof</h4>
                <div className="grid grid-cols-2 gap-4">
                  {purchase.payment_proof.map((proof, index) => (
                    <img 
                      key={index} 
                      src={proof} 
                      alt={`Payment proof ${index + 1}`}
                      className="rounded-lg border max-h-40 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>

        {/* Action Buttons */}
        <div className="border-t bg-gray-50 p-4 flex justify-end gap-3">
          <Button 
            onClick={() => setIsModalOpen(false)} 
            variant="outlined" 
            disabled={isUpdating}
            className="text-gray-600"
          >
            Close
          </Button>
          {purchase.status === 'Pending' && (
            <>
              <Button
                onClick={() => {
                  onUpdateStatus(purchase.id, 'Rejected');
                  setIsModalOpen(false);
                }}
                variant="contained" 
                color="error" 
                disabled={isUpdating} 
                startIcon={<X size={16} />}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  onUpdateStatus(purchase.id, 'Completed');
                  setIsModalOpen(false);
                }}
                variant="contained" 
                color="success" 
                disabled={isUpdating} 
                startIcon={<Check size={16} />}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

const PurchaseManagement = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed' | 'Rejected'>('all');

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const fetchPurchases = useCallback(async () => {
    if (!access_token) return;
    
    setLoading(true);
    try {
      const res = await renderInstance.get("/credits/purchases", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      // The API returns data directly as an array
      const purchaseData = Array.isArray(res.data) ? res.data : res.data.data || [];
      setPurchases(purchaseData);
    } catch (err: any) {
      console.error("Error fetching purchases:", err);
      errorMessage("Error fetching purchase list.");
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleUpdateStatus = async (purchaseId: string, status: 'Completed' | 'Rejected') => {
    setIsUpdating(true);
    try {
      // Use the correct API endpoint for updates
      await renderInstance.patch(`/credits/purchases/${purchaseId}`, 
        { status }, 
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      
      const action = status === 'Completed' ? 'approved' : 'rejected';
      successMessage(`Purchase has been ${action}.`);
      await fetchPurchases();
    } catch (err: any) {
      console.error("Error updating purchase:", err);
      errorMessage(err.response?.data?.message || `Failed to update purchase.`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter purchases based on selected filter
  const filteredPurchases = purchases.filter(purchase => 
    filter === 'all' || purchase.status === filter
  );

  const getStatusCounts = () => {
    return {
      all: purchases.length,
      Pending: purchases.filter(p => p.status === 'Pending').length,
      Completed: purchases.filter(p => p.status === 'Completed').length,
      Rejected: purchases.filter(p => p.status === 'Rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="py-10 px-8 w-full bg-white rounded-lg shadow-md">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || isUpdating}
      >
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-5 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Credit Purchases ({filteredPurchases.length})
        </h2>
        
        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="text-sm font-semibold text-gray-500 grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 bg-gray-50 p-4 rounded-t-lg border-b">
        <p>Id</p>
        <p>Customer</p>
        <p>Credits</p>
        <p>Amount</p>
        <p>Payment</p>
        <p>Status</p>
        <p>Date</p>
        <p className="text-center">Actions</p>
      </div>

      {/* Table Body */}
      <div className="flex flex-col border border-t-0 rounded-b-lg">
        {filteredPurchases.length === 0 && !loading ? (
          <div className="w-full min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-xl">No purchases found.</p>
              <p className="text-gray-400 text-sm mt-2">
                {filter !== 'all' ? `No ${filter.toLowerCase()} purchases to display.` : ''}
              </p>
            </div>
          </div>
        ) : (
          filteredPurchases.map((purchase, index) => (
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

      {/* Summary Stats */}
      {!loading && purchases.length > 0 && (
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-600 text-sm font-medium">Total Credits</p>
            <p className="text-2xl font-bold text-blue-800">
              {purchases.reduce((sum, p) => sum + p.credits_received, 0)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-600 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-green-800">
              ₹{purchases.reduce((sum, p) => sum + p.final_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">
              {statusCounts.Pending}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">Completed</p>
            <p className="text-2xl font-bold text-gray-800">
              {statusCounts.Completed}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseManagement;