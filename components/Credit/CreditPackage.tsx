"use client";

import { useState, useEffect } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress, Switch } from "@mui/material";
import { Plus } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";

interface CreditPackage {
  id: string;
  name: string;
  base_credits: number;
  price: number;
  currency_id: string;
  user_type: "OWNER" | "AGENT" | "FARMER" | "DEALER";
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
  const [allPackages, setAllPackages] = useState<CreditPackage[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPackage, setAddingPackage] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    base_credits: "",
    price: "",
    currency_id: "",
    user_type: "FARMER", // Default value
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  async function fetchData() {
    if (!access_token) return;
    setLoading(true);
    try {
      const [packagesRes, currenciesRes] = await Promise.all([
        renderInstance.get("/credits/packages", { headers: { Authorization: `Bearer ${access_token}` } }),
        renderInstance.get("/credits/currencies?isActive=true", { headers: { Authorization: `Bearer ${access_token}` } })
      ]);
      setAllPackages(packagesRes.data);
      setCurrencies(currenciesRes.data);
    } catch (err) {
      errorMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [access_token]);

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
      price: parseFloat(price),
    };

    try {
      await renderInstance.post("/credits/packages", payload, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      fetchData(); // Refetch all data
      setOpenModal(false);
      successMessage("Package added successfully!");
    } catch (err: any) {
      errorMessage(err.response?.data?.message || "Failed to add package.");
    } finally {
      setAddingPackage(false);
    }
  };
  
    const handleStatusToggle = async (packageId: string, currentStatus: boolean) => {
    try {
      await renderInstance.patch(`/credits/packages/${packageId}`, { is_active: !currentStatus }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Status updated successfully!");
      setAllPackages(prev => prev.map(p => p.id === packageId ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      errorMessage("Failed to update status.");
    }
  };


  return (
    <div className="py-10 w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingPackage}
      >
        <CircularProgress />
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-5 mb-10 px-2">
         <h2 className="text-2xl font-bold">Total Packages: {allPackages.length}</h2>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Package</span>
        </button>
      </div>

      <div className="text-lg font-semibold grid grid-cols-[60px_3fr_2fr_2fr_2fr_1.5fr_1.5fr] items-center gap-x-4 bg-[#ededed] p-5 rounded">
        <p>#</p>
        <p>Name</p>
        <p>Credits</p>
        <p>Price</p>
        <p>User Type</p>
        <p>Status</p>
        <p>Created</p>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        {allPackages.length === 0 && !loading ? (
           <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
                 <p className="text-gray-500 text-xl">No packages found.</p>
            </div>
        ) : (
          allPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="text-base grid grid-cols-[60px_3fr_2fr_2fr_2fr_1.5fr_1.5fr] items-center gap-x-4 px-5 py-4 rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              <p>{index + 1}</p>
              <p className="font-medium">{pkg.name}</p>
              <p>{pkg.base_credits}</p>
              <p>{currencies.find(c => c.id === pkg.currency_id)?.symbol} {pkg.price.toLocaleString()}</p>
              <p>{pkg.user_type}</p>
              <p>
                 <Switch
                    checked={pkg.is_active}
                    onChange={() => handleStatusToggle(pkg.id, pkg.is_active)}
                    color="success"
                  />
              </p>
              <p>{new Date(pkg.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] text-gray-900">
            <h3 className="text-xl font-semibold mb-4">Add New Credit Package</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Package Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Farmer Starter Pack"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
               <div>
                <label className="block text-sm font-medium mb-1">Base Credits *</label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={form.base_credits}
                  onChange={(e) => setForm({ ...form, base_credits: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
               <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <input
                  type="number"
                  placeholder="e.g., 50.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency *</label>
                <select
                  value={form.currency_id}
                  onChange={(e) => setForm({ ...form, currency_id: e.target.value })}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="" disabled>Select a currency</option>
                  {currencies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">User Type *</label>
                 <select
                  value={form.user_type}
                  onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="OWNER">OWNER</option>
                  <option value="AGENT">AGENT</option>
                  <option value="FARMER">FARMER</option>
                  <option value="DEALER">DEALER</option>
                </select>
              </div>
            </div>
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