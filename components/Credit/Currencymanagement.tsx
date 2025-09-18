"use client";

import { useState, useEffect } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress, Switch } from "@mui/material";
import { Plus } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";

// Updated interface to match your API response
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

const CurrencyManagement = () => {
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCurrency, setAddingCurrency] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    symbol: "",
    exchange_rate: "1",
    country_codes: "", // Storing as comma-separated string for input
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  async function fetchCurrencies() {
    if (!access_token) return;
    setLoading(true);
    try {
      const res = await renderInstance.get("/credits/currencies", { // API Endpoint updated
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      setAllCurrencies(res.data);
    } catch (err) {
      errorMessage("Error fetching currency list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrencies();
  }, [access_token]);

  const handleAddCurrency = async () => {
    if (!form.name || !form.code || !form.symbol || !form.country_codes) {
      errorMessage("Please fill all required fields.");
      return;
    }
    setAddingCurrency(true);

    const payload = {
      ...form,
      exchange_rate: parseFloat(form.exchange_rate) || 1.0,
      country_codes: form.country_codes.split(",").map(code => code.trim()),
    };

    try {
      const res = await renderInstance.post("/credits/currencies", payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      fetchCurrencies(); // Refetch the list to get the latest data
      setOpenModal(false);
      successMessage("Currency added successfully!");
    } catch (err: any) {
      errorMessage(err.response?.data?.message || "Failed to add currency.");
    } finally {
      setAddingCurrency(false);
    }
  };
  
    const handleStatusToggle = async (currencyId: string, currentStatus: boolean) => {
    try {
      await renderInstance.patch(`/credits/currencies/${currencyId}`, { is_active: !currentStatus }, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage("Status updated successfully!");
      // Update the state locally for a faster UI response
      setAllCurrencies(prev => prev.map(c => c.id === currencyId ? { ...c, is_active: !currentStatus } : c));
    } catch (err) {
      errorMessage("Failed to update status.");
    }
  };


  return (
    <div className="py-10 w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingCurrency}
      >
        <CircularProgress />
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-5 mb-10 px-2">
        <h2 className="text-2xl font-bold">Total Currencies: {allCurrencies.length}</h2>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Currency</span>
        </button>
      </div>

      <div className="text-lg font-semibold grid grid-cols-[60px_2fr_1fr_1fr_2fr_1.5fr_1fr_1.5fr] items-center gap-x-4 bg-[#ededed] p-5 rounded">
        <p>#</p>
        <p>Name</p>
        <p>Code</p>
        <p>Symbol</p>
        <p>Country Codes</p>
        <p>Exchange Rate</p>
        <p>Status</p>
        <p>Created</p>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        {allCurrencies.length === 0 && !loading ? (
            <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
                 <p className="text-gray-500 text-xl">No currencies found.</p>
            </div>
        ) : (
          allCurrencies.map((currency, index) => (
            <div
              key={currency.id}
              className="text-base grid grid-cols-[60px_2fr_1fr_1fr_2fr_1.5fr_1fr_1.5fr] items-center gap-x-4 px-5 py-4 rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              <p>{index + 1}</p>
              <p className="font-medium">{currency.name}</p>
              <p className="text-gray-600 font-mono">{currency.code}</p>
              <p className="font-bold text-center">{currency.symbol}</p>
              <p className="text-gray-600 font-mono">{currency.country_codes.join(", ")}</p>
              <p>{currency.exchange_rate}</p>
              <p>
                 <Switch
                    checked={currency.is_active}
                    onChange={() => handleStatusToggle(currency.id, currency.is_active)}
                    color="success"
                  />
              </p>
              <p>{new Date(currency.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] text-gray-900">
            <h3 className="text-xl font-semibold mb-4">Add New Currency</h3>
            <div className="flex flex-col gap-4">
               <div>
                <label className="block text-sm font-medium mb-1">Currency Name *</label>
                <input
                  type="text"
                  placeholder="e.g., US Dollar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
               <div>
                <label className="block text-sm font-medium mb-1">Currency Code *</label>
                <input
                  type="text"
                  placeholder="e.g., USD"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Symbol *</label>
                <input
                  type="text"
                  placeholder="e.g., $"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
               <div>
                <label className="block text-sm font-medium mb-1">Country Codes *</label>
                <input
                  type="text"
                  placeholder="e.g., US, CA"
                  value={form.country_codes}
                  onChange={(e) => setForm({ ...form, country_codes: e.target.value })}
                  className="w-full border rounded p-2"
                />
                 <small className="text-gray-500">Use commas to separate multiple codes.</small>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exchange Rate</label>
                <input
                  type="number"
                  placeholder="e.g., 1.00"
                  value={form.exchange_rate}
                  onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
                disabled={addingCurrency}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCurrency}
                disabled={addingCurrency}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {addingCurrency ? "Adding..." : "Add Currency"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagement;