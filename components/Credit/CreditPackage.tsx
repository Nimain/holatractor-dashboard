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

// Data structure for a single credit package
interface CreditPackage {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  status: number;
  createdAt: string;
}

const CreditPackage = () => {
  const [allPackages, setAllPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Fetch credit packages from the API
  async function fetchCreditPackages() {
    if (!access_token) {
      errorMessage("Authentication token not found.");
      return;
    }
    setLoading(true);
    try {
      // NOTE: I am assuming your API endpoint is '/credit-packages'. Please change if needed.
      const res = await renderInstance.get("/credit-packages", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      setAllPackages(res.data);
    } catch (err) {
      console.error("Error fetching credit packages:", err);
      errorMessage("Error fetching package list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCreditPackages();
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
          Total Packages: {allPackages.length}
        </p>
        <Link
          href="/creditpackage/new" // Link to create a new package
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Package</span>
        </Link>
      </div>

      {/* ---------- Header ---------- */}
      <div className="text-[18px] font-[600] grid grid-cols-[60px_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr] items-center gap-x-4 bg-[#ededed] p-[20px] rounded">
        <p>Sl No</p>
        <p>Name</p>
        <p>Amount</p>
        <p>Interest (%)</p>
        <p>Duration (Months)</p>
        <p>Status</p>
        <p>Created</p>
      </div>

      {/* ---------- Rows ---------- */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {allPackages.length === 0 ? (
          <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No packages found"
              className="w-[300px] lg:w-[500px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          allPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="text-[16px] grid grid-cols-[60px_2fr_1.5fr_1.5fr_1.5fr_1fr_1fr] items-center gap-x-4 px-[20px] py-[15px] rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              <p>{index + 1}</p>
              <p className="font-medium">{pkg.name}</p>
              <p>{pkg.amount.toLocaleString()}</p>
              <p className="text-center">{pkg.interestRate}%</p>
              <p className="text-center">{pkg.durationMonths}</p>
              <p>
                {pkg.status === 1 ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </p>
              <p>{pkg.createdAt?.split("T")[0]}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CreditPackage;