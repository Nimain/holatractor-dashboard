"use client";

import { useState, useEffect } from "react";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import { Plus } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import Link from "next/link";

// Data structure for a single currency
interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  status: number;
  createdAt: string;
}

const CurrencyManagement = () => {
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Fetch currencies from the API
  async function fetchCurrencies() {
    if (!access_token) {
      errorMessage("Authentication token not found.");
      return;
    }
    setLoading(true);
    try {
      // NOTE: I am assuming your API endpoint is '/currencies'. Please change if needed.
      const res = await renderInstance.get("/currencies", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      setAllCurrencies(res.data);
    } catch (err) {
      console.error("Error fetching currencies:", err);
      errorMessage("Error fetching currency list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrencies();
  }, [access_token]);

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px] px-2">
        <p className="text-[20px] font-bold">
          Total Currencies: {allCurrencies.length}
        </p>
        <Link
          href="/currencymanagement/new" // Link to create a new currency
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Currency</span>
        </Link>
      </div>

      {/* ---------- Header ---------- */}
      <div className="text-[18px] font-[600] grid grid-cols-[60px_2fr_1fr_1fr_1.5fr_1fr_1fr] items-center gap-x-4 bg-[#ededed] p-[20px] rounded">
        <p>Sl No</p>
        <p>Name</p>
        <p>Code</p>
        <p>Symbol</p>
        <p>Exchange Rate</p>
        <p>Status</p>
        <p>Created</p>
      </div>

      {/* ---------- Rows ---------- */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {allCurrencies.length === 0 ? (
          <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No currencies found"
              className="w-[300px] lg:w-[500px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          allCurrencies.map((currency, index) => (
            <div
              key={currency.id}
              className="text-[16px] grid grid-cols-[60px_2fr_1fr_1fr_1.5fr_1fr_1fr] items-center gap-x-4 px-[20px] py-[15px] rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              <p>{index + 1}</p>
              <p className="font-medium">{currency.name}</p>
              <p className="text-gray-600 font-mono">{currency.code}</p>
              <p className="font-bold text-center">{currency.symbol}</p>
              <p>{currency.exchangeRate}</p>
              <p>
                {currency.status === 1 ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </p>
              <p>{currency.createdAt?.split("T")[0]}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CurrencyManagement;