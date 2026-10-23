"use client";

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Import your actual API instance and utilities
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import CouponAction from './CouponAction';

// TypeScript interfaces
interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_percentage: number;
  minimum_purchase: number;
  maximum_discount: number;
  usage_limit: number;
  usage_per_user: number;
  user_type: string[];
  is_active: boolean;
  valid_from?: string;
  valid_until: string;
  createdAt: string;
  updatedAt: string;
}

interface CouponForm {
  code: string;
  name: string;
  discount_percentage: string;
  minimum_purchase: string;
  maximum_discount: string;
  usage_limit: string;
  usage_per_user: string;
  user_type: string[];
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const CouponManagement = () => {
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addingCoupon, setAddingCoupon] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>({
    code: "",
    name: "",
    discount_percentage: "",
    minimum_purchase: "",
    maximum_discount: "",
    usage_limit: "",
    usage_per_user: "1",
    user_type: [],
    valid_from: "",
    valid_until: "",
    is_active: true
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const fetchCoupons = async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const res = await renderInstance.get<Coupon[]>("/credits/coupons", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setAllCoupons(res.data);
      console.log("📋 Fetched coupons:", res.data.length); // Debug log
    } catch (err: any) {
      console.error("Error fetching coupons:", err);
      errorMessage("Error fetching coupon list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [access_token]);

  const handleOpenModal = (coupon: Coupon | null = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        name: coupon.name,
        discount_percentage: coupon.discount_percentage.toString(),
        minimum_purchase: coupon.minimum_purchase.toString(),
        maximum_discount: coupon.maximum_discount.toString(),
        usage_limit: coupon.usage_limit.toString(),
        usage_per_user: coupon.usage_per_user.toString(),
        user_type: coupon.user_type,
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_until: coupon.valid_until.split('T')[0],
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setForm({
        code: "",
        name: "",
        discount_percentage: "",
        minimum_purchase: "",
        maximum_discount: "",
        usage_limit: "",
        usage_per_user: "1",
        user_type: [],
        valid_from: "",
        valid_until: "",
        is_active: true
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingCoupon(null);
    setForm({
      code: "",
      name: "",
      discount_percentage: "",
      minimum_purchase: "",
      maximum_discount: "",
      usage_limit: "",
      usage_per_user: "1",
      user_type: [],
      valid_from: "",
      valid_until: "",
      is_active: true
    });
  };

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.discount_percentage || !form.valid_until) {
      errorMessage("Please fill all required fields.");
      return;
    }

    setAddingCoupon(true);

    const payload = {
      code: form.code,
      name: form.name,
      discount_percentage: parseFloat(form.discount_percentage),
      minimum_purchase: parseFloat(form.minimum_purchase) || 0,
      maximum_discount: parseFloat(form.maximum_discount) || 0,
      usage_limit: parseInt(form.usage_limit) || 0,
      usage_per_user: parseInt(form.usage_per_user) || 1,
      user_type: form.user_type,
      valid_until: new Date(form.valid_until).toISOString(),
      is_active: form.is_active,
      ...(form.valid_from && { valid_from: new Date(form.valid_from).toISOString() })
    };

    try {
      if (editingCoupon) {
        await renderInstance.patch(`/credits/coupons/${editingCoupon.id}`, payload, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        successMessage("Coupon updated successfully!");
      } else {
        await renderInstance.post("/credits/coupons", payload, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        successMessage("Coupon added successfully!");
      }
      
      fetchCoupons();
      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving coupon:", err);
      errorMessage(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setAddingCoupon(false);
    }
  };

  // REMOVED handleToggleStatus - no more status interference
  // REMOVED handleDelete - let CouponAction handle its own delete

  const handleUserTypeChange = (userType: string) => {
    setForm((prev: CouponForm) => ({
      ...prev,
      user_type: prev.user_type.includes(userType)
        ? prev.user_type.filter(type => type !== userType)
        : [...prev.user_type, userType]
    }));
  };

  return (
    <div className="py-10 px-8 w-full bg-white rounded-lg shadow-md">
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingCoupon}
      >
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-5 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Coupons ({allCoupons.length})
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 text-base font-medium rounded-md bg-black text-white flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="text-sm font-semibold text-gray-500 grid grid-cols-[60px_2.5fr_1.2fr_1fr_1.2fr_1.2fr_1.5fr_1fr_80px] items-center gap-x-4 bg-gray-50 p-4 rounded-t-lg border-b">
        <p>Sl No</p>
        <p>Name</p>
        <p>Code</p>
        <p>Discount</p>
        <p>Usage Limit</p>
        <p>Valid Until</p>
        <p>User Type</p>
        <p>Status</p>
        <p className="text-center">Actions</p>
      </div>

      {/* Table Content */}
      <div className="flex flex-col">
        {allCoupons.length === 0 && !loading ? (
          <div className="w-full h-full min-h-[40vh] flex items-center justify-center">
            <p className="text-gray-500 text-xl">No coupons found.</p>
          </div>
        ) : (
          allCoupons.map((coupon, index) => (
            <CouponAction
              key={coupon.id}
              coupon={coupon}
              index={index}
              onUpdate={fetchCoupons} // This will refresh the list after delete
            />
          ))
        )}
      </div>

      {/* Add/Edit Coupon Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] text-gray-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Coupon Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20% Off Summer Sale"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SAVE20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Discount (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={form.discount_percentage}
                    onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={form.minimum_purchase}
                    onChange={(e) => setForm({ ...form, minimum_purchase: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={form.maximum_discount}
                    onChange={(e) => setForm({ ...form, maximum_discount: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Per User</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={form.usage_per_user}
                    onChange={(e) => setForm({ ...form, usage_per_user: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">User Types</label>
                <div className="flex gap-4">
                  {["FARMER", "OWNER"].map(userType => (
                    <label key={userType} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.user_type.includes(userType)}
                        onChange={() => handleUserTypeChange(userType)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{userType}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <small className="text-gray-500">Optional - leave empty for immediate activation</small>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active Coupon
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={addingCoupon}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={addingCoupon}
                className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {addingCoupon ? (editingCoupon ? "Updating..." : "Adding...") : (editingCoupon ? "Update Coupon" : "Add Coupon")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;