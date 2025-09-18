"use client";

import { useState, useEffect, useMemo } from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import { Plus } from "lucide-react";
import { useCookie } from "next-cookie";

import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import CreditPackageAction from "./CreditPackageAction";

// --- Types ---
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

const CreditPackage = () => {
  // --- State ---
  const [allPackages, setAllPackages] = useState<CreditPackage[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPackage, setAddingPackage] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    base_credits: "",
    bonus_credits: "0",
    price: "",
    currency_id: "",
    discount_percentage: "0",
    user_type: "FARMER",
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!access_token) return;
    setLoading(true);
    try {
      const [packagesRes, currenciesRes] = await Promise.all([
          renderInstance.get("/credits/packages?isActive=true", {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
        renderInstance.get("/credits/currencies", {
          headers: { Authorization: `Bearer ${access_token}` },
        }),
      ]);
      setAllPackages(packagesRes.data);
      setCurrencies(currenciesRes.data);
    } catch {
      errorMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [access_token]);

  // --- Add Package ---
  const handleAddPackage = async () => {
    const { name, base_credits, price, currency_id, user_type } = form;

    if (!name || !base_credits || !price || !currency_id || !user_type) {
      errorMessage("Please fill all required fields.");
      return;
    }

    setAddingPackage(true);

    const payload = {
      ...form,
      base_credits: parseInt(base_credits),
      bonus_credits: parseInt(form.bonus_credits),
      price: parseFloat(price),
      discount_percentage: parseInt(form.discount_percentage),
    };

    try {
      await renderInstance.post("/credits/packages", payload, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      fetchData();
      setOpenModal(false);
      setForm({
        name: "",
        base_credits: "",
        bonus_credits: "0",
        price: "",
        currency_id: "",
        discount_percentage: "0",
        user_type: "FARMER",
      });
      successMessage("Package added successfully!");
    } catch (err: any) {
      errorMessage(err.response?.data?.message || "Failed to add package.");
    } finally {
      setAddingPackage(false);
    }
  };

  // --- Stats ---
  const totalPackages = allPackages.length;
  const activePackages = useMemo(
    () => allPackages.filter((p) => p.is_active).length,
    [allPackages]
  );
  const featuredPackages = useMemo(
    () => allPackages.filter((p) => p.is_featured).length,
    [allPackages]
  );

  // --- JSX ---
  return (
    <div className="py-10 px-8 w-full bg-white rounded-lg shadow-md">
      {/* Loader */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingPackage}
      >
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-5 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Credit Packages ({totalPackages})
        </h2>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-base font-medium rounded-md bg-black text-white flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>Add Package</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="text-sm font-semibold text-gray-500 grid grid-cols-[40px_3fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 bg-gray-50 p-4 rounded-t-lg border-b">
        <p>Sl No</p>
        <p>Package Name</p>
        <p>Base Credits</p>
        <p>Bonus Credits</p>
        <p>Total Credits</p>
        <p>Price</p>
        <p>Status</p>
        <p>Created</p>
        <p className="text-center">Actions</p>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col">
        {allPackages.length === 0 && !loading ? (
          <div className="w-full h-full min-h-[40vh] flex items-center justify-center">
            <p className="text-gray-500 text-xl">No packages found.</p>
          </div>
        ) : (
          allPackages.map((pkg, index) => (
            <CreditPackageAction
              key={pkg.id}
              pkg={pkg}
              currencies={currencies}
              index={index}
              onUpdate={fetchData}
            />
          ))
        )}
      </div>

      {/* Stats Section */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-800">{totalPackages}</p>
          <p className="text-sm text-gray-500">Total Packages</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{activePackages}</p>
          <p className="text-sm text-gray-500">Active Packages</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{featuredPackages}</p>
          <p className="text-sm text-gray-500">Featured Packages</p>
        </div>
      </div> */}

      {/* --- Add Package Modal --- */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] text-gray-900">
            <h3 className="text-xl font-semibold mb-4">
              Add New Credit Package
            </h3>

            {/* Form */}
            <div className="flex flex-col gap-4">
              {/* Package Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Farmer Starter Pack"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Base Credits */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Base Credits *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={form.base_credits}
                  onChange={(e) =>
                    setForm({ ...form, base_credits: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Bonus Credits */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bonus Credits
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={form.bonus_credits}
                  onChange={(e) =>
                    setForm({ ...form, bonus_credits: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 50.00"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Currency *
                </label>
                <select
                  value={form.currency_id}
                  onChange={(e) =>
                    setForm({ ...form, currency_id: e.target.value })
                  }
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="" disabled>
                    Select a currency
                  </option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  User Type *
                </label>
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

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={form.discount_percentage}
                  onChange={(e) =>
                    setForm({ ...form, discount_percentage: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
                disabled={addingPackage}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPackage}
                disabled={addingPackage}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {addingPackage ? "Adding..." : "Add Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditPackage;
