"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Trash2 } from "lucide-react";
import { useCookie } from "next-cookie";
import { useState } from "react";

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

interface CouponActionProps {
  coupon: Coupon;
  index: number;
  onUpdate: () => void;
}

const CouponAction = ({ coupon, index, onUpdate }: CouponActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    code: coupon.code,
    name: coupon.name,
    discount_percentage: coupon.discount_percentage,
    minimum_purchase: coupon.minimum_purchase,
    maximum_discount: coupon.maximum_discount,
    usage_limit: coupon.usage_limit,
    usage_per_user: coupon.usage_per_user,
    user_type: coupon.user_type,
    valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
    valid_until: coupon.valid_until.split('T')[0],
    is_active: coupon.is_active,
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        discount_percentage: Number(form.discount_percentage),
        minimum_purchase: Number(form.minimum_purchase),
        maximum_discount: Number(form.maximum_discount),
        usage_limit: Number(form.usage_limit),
        usage_per_user: Number(form.usage_per_user),
        user_type: form.user_type,
        valid_until: new Date(form.valid_until).toISOString(),
        is_active: form.is_active,
        ...(form.valid_from && { valid_from: new Date(form.valid_from).toISOString() })
      };

      await renderInstance.patch(`/credits/coupons/${coupon.id}`, payload, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Coupon updated successfully!");
      onUpdate();
      setIsSheetOpen(false);
    } catch (err: any) {
      console.error("Error updating coupon:", err);
      errorMessage(err.response?.data?.message || "Failed to update coupon.");
    } finally {
      setLoading(false);
    }
  };

  // PURE DELETE FUNCTION - Only deletes from backend, no status toggle
  const handleDelete = async () => {
    setLoading(true);
    try {
      console.log(`🗑️ DELETING COUPON - ID: ${coupon.id}, Name: ${coupon.name}`); // Debug log
      
      // Make the DELETE API call
      const response = await renderInstance.delete(`/credits/coupons/${coupon.id}`, {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log("✅ DELETE SUCCESS - Response:", response.status); // Debug log
      successMessage(`Coupon "${coupon.name}" deleted successfully!`);
      setDeleteModalOpen(false);
      onUpdate(); // Refresh the coupon list
    } catch (err: any) {
      console.error("❌ DELETE FAILED - Error:", err);
      console.error("❌ DELETE FAILED - Response:", err.response?.data); // More detailed error log
      console.error("❌ DELETE FAILED - Status:", err.response?.status); // Status code
      errorMessage(err.response?.data?.message || "Failed to delete coupon from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (userType: string) => {
    setForm(prev => ({
      ...prev,
      user_type: prev.user_type.includes(userType)
        ? prev.user_type.filter(type => type !== userType)
        : [...prev.user_type, userType]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* Row */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="text-sm text-gray-700 grid grid-cols-[60px_2.5fr_1.2fr_1fr_1.2fr_1.2fr_1.5fr_1fr_80px] items-center gap-x-4 px-4 py-3 border-b cursor-pointer hover:bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{index + 1}</p>
            
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-900 truncate" title={coupon.name}>
                {coupon.name}
              </p>
              <p className="text-xs text-gray-500">
                Min: ${coupon.minimum_purchase} | Max: ${coupon.maximum_discount}
              </p>
            </div>
            
            <p className="text-sm text-gray-700 font-mono font-medium">{coupon.code}</p>
            
            <p className="text-sm text-gray-700 font-medium">
              {coupon.discount_percentage}%
            </p>
            
            <p className="text-sm text-gray-700">
              {coupon.usage_limit} ({coupon.usage_per_user}/user)
            </p>
            
            <div className="flex flex-col">
              <p className="text-sm text-gray-700">
                {formatDate(coupon.valid_until)}
              </p>
              {isExpired(coupon.valid_until) && (
                <span className="text-xs text-red-600 font-medium">Expired</span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {coupon.user_type.map(type => (
                <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {type}
                </span>
              ))}
            </div>
            
            <div className="flex items-center">
              {coupon.is_active ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Inactive
                </span>
              )}
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Delete button clicked for coupon:", coupon.id); // Debug log
                  setDeleteModalOpen(true);
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                disabled={loading}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </SheetTrigger>

        {/* Edit Sheet */}
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Coupon</SheetTitle>
            <SheetDescription>Update details for {coupon.name}.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-1 space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coupon Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Coupon Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.discount_percentage}
                  onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Min Purchase ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.minimum_purchase}
                  onChange={(e) => setForm({ ...form, minimum_purchase: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Max Discount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.maximum_discount}
                  onChange={(e) => setForm({ ...form, maximum_discount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Usage Limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Usage Per User</Label>
                <Input
                  type="number"
                  value={form.usage_per_user}
                  onChange={(e) => setForm({ ...form, usage_per_user: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label className="block mb-2">User Types</Label>
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
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
              <span className="font-medium">Active Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                </div>
              </label>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal - FIXED */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Coupon</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-gray-900">"{coupon.name}"</span> ({coupon.code})?
              <br />
              <span className="text-sm text-red-500 mt-2 block">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Coupon"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CouponAction;