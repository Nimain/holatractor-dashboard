"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@mui/material";
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
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Trash2 } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  base_credits: number;
  bonus_credits: number;
  price: number;
  currency_id: string;
  discount_percentage: number;
  user_type: "OWNER" | "AGENT" | "FARMER" | "DEALER";
  is_featured: boolean;
  is_active: boolean;
  createdAt: string;
}

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
}

interface PackageActionProps {
  pkg: CreditPackage;
  currencies: Currency[];
  index: number;
  onUpdate: () => void;
}

const CreditPackageAction = ({ pkg, currencies, index, onUpdate }: PackageActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    name: pkg.name,
    base_credits: pkg.base_credits,
    bonus_credits: pkg.bonus_credits,
    price: pkg.price,
    currency_id: pkg.currency_id,
    discount_percentage: pkg.discount_percentage,
    user_type: pkg.user_type,
    is_active: pkg.is_active,
  });

  const currency = currencies.find((c) => c.id === pkg.currency_id);

  /** ------------------ UPDATE ------------------ */
  const handleUpdate = async () => {
    try {
      await renderInstance.patch(`/credits/packages/${pkg.id}`, form, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Package updated successfully!");
      onUpdate();
      setIsSheetOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to update package.";
      errorMessage(errorMsg);
      console.error("Update Error:", err);
    }
  };

  /** ------------------ DELETE ------------------ */
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await renderInstance.delete(`/credits/packages/${pkg.id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (response.status === 200 || response.status === 204) {
        successMessage(response.data?.message || "Package deleted successfully!");
        onUpdate();
        setShowDeleteModal(false);
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete package.";
      errorMessage(errorMsg);
      console.error("Delete Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[40px_3fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 px-4 py-3 border-b hover:bg-gray-50">
        {/* Row Trigger */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <div className="col-span-8 cursor-pointer grid grid-cols-[40px_3fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4">
              <p>{index + 1}</p>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-800">{pkg.name}</p>

                {/* ✅ Discount Badge Fix */}
                {pkg.discount_percentage > 0 && (
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full w-fit mt-1">
                    {pkg.discount_percentage}% OFF
                  </span>
                )}
              </div>
              <p>{pkg.base_credits}</p>
              <p className="text-green-600 font-medium">+{pkg.bonus_credits}</p>
              <p className="font-bold text-blue-600">
                {pkg.base_credits + pkg.bonus_credits}
              </p>
              <p className="font-semibold">
                {currency?.symbol}
                {pkg.price.toLocaleString()}
              </p>
              <p>
                {pkg.is_active ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </p>
              <p>{new Date(pkg.createdAt).toLocaleDateString()}</p>
            </div>
          </SheetTrigger>

          {/* Sheet Content */}
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Edit Credit Package</SheetTitle>
              <SheetDescription>
                Update the details for <b>{pkg.name}</b>.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-1 space-y-4 my-4">
              <div>
                <Label>Package Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Base Credits</Label>
                <Input
                  type="number"
                  value={form.base_credits}
                  onChange={(e) =>
                    setForm({ ...form, base_credits: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Bonus Credits</Label>
                <Input
                  type="number"
                  value={form.bonus_credits}
                  onChange={(e) =>
                    setForm({ ...form, bonus_credits: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Currency</Label>
                <select
                  value={form.currency_id}
                  onChange={(e) =>
                    setForm({ ...form, currency_id: e.target.value })
                  }
                  className="w-full border rounded p-2 bg-white"
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>User Type</Label>
                <select
                  value={form.user_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      user_type: e.target.value as
                        | "FARMER"
                        | "AGENT"
                        | "DEALER"
                        | "OWNER",
                    })
                  }
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="FARMER">FARMER</option>
                  <option value="AGENT">AGENT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="DEALER">DEALER</option>
                </select>
              </div>
              <div>
                <Label>Discount Percentage</Label>
                <Input
                  type="number"
                  value={form.discount_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium">Active Status</span>
                <Switch
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  color="success"
                />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete button OUTSIDE trigger */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleDeleteClick}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete package"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Credit Package
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to delete{" "}
                  <strong>"{pkg.name}"</strong>?
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Base Credits: {pkg.base_credits}</div>
                  <div>Bonus Credits: +{pkg.bonus_credits}</div>
                  <div>
                    Price: {currency?.symbol}
                    {pkg.price}
                  </div>
                  <div>User Type: {pkg.user_type}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {isDeleting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isDeleting ? "Deleting..." : "Delete Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditPackageAction;
