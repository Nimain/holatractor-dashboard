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
import { Backdrop, CircularProgress, Switch } from "@mui/material";
import { Trash2 } from "lucide-react";
import { useCookie } from "next-cookie";
import { useState } from "react";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
  is_base: boolean;
  country_codes: string[];
  createdAt: string;
}

interface CurrencyActionProps {
  currency: Currency;
  index: number;
  onUpdate: () => void;
}

const CurrencyAction = ({ currency, index, onUpdate }: CurrencyActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: currency.name,
    code: currency.code,
    symbol: currency.symbol,
    exchange_rate: currency.exchange_rate,
    country_codes: currency.country_codes.join(", "),
    is_active: currency.is_active,
    is_base: currency.is_base,
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await renderInstance.patch(`/credits/currencies/${currency.id}`, {
        ...form,
        exchange_rate: Number(form.exchange_rate),
        country_codes: form.country_codes.split(",").map((c) => c.trim()),
      }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Currency updated successfully!");
      onUpdate();
      setIsSheetOpen(false);
    } catch (err) {
      errorMessage("Failed to update currency.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await renderInstance.delete(`/credits/currencies/${currency.id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Currency deleted!");
      setDeleteModalOpen(false);
      onUpdate();
    } catch (err) {
      errorMessage("Failed to delete currency.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop Loader */}
      <Backdrop sx={{ color: "#fff", zIndex: 9999 }} open={loading}>
        <CircularProgress />
      </Backdrop>

      {/* Row */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="text-sm text-gray-700 grid grid-cols-[40px_3fr_1fr_1fr_1.5fr_1fr_1fr_1fr] items-center gap-x-4 px-4 py-3 border-b cursor-pointer hover:bg-gray-50">
            <p>{index + 1}</p>
            <p className="font-semibold text-gray-800">{currency.name}</p>
            <p>{currency.code}</p>
            <p>{currency.symbol}</p>
            <p>{currency.exchange_rate}</p>
            <p>
              {currency.is_active ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </p>
            <p>{new Date(currency.createdAt).toLocaleDateString()}</p>
            <div className="flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModalOpen(true);
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </SheetTrigger>

        {/* Edit Sheet */}
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Currency</SheetTitle>
            <SheetDescription>Update details for {currency.name}.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-1 space-y-4 my-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
            </div>
            <div>
              <Label>Exchange Rate</Label>
              <Input
                type="number"
                value={form.exchange_rate}
                onChange={(e) => setForm({ ...form, exchange_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Country Codes</Label>
              <Input
                value={form.country_codes}
                onChange={(e) => setForm({ ...form, country_codes: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="font-medium">Active Status</span>
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Currency</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-bold">{currency.name}</span> ({currency.code})?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CurrencyAction;