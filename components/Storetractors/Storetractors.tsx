"use client";

import { useEffect, useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import { errorMessage } from "@/utils/Toastify/Messages";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Tractor {
  id: string;
  hourly_price: number;
  createdAt: string;
  store_id: string;
  baseTractor: {
    id: string;
    name: string;
    description: string;
    images: string[];
  };
}

const StoreTractors = () => {
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  async function fetchTractors() {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }
    setLoading(true);
    try {
      const res = await renderInstance.get(`/store/getalluniversaltractors`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setTractors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching tractors:", err);
      errorMessage("Failed to fetch tractors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTractors();
  }, [access_token]);

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px] px-2">
        <p className="text-[20px] font-bold">
          Store Tractors: {tractors.length}
        </p>
        <Link
          href="/StoreTractors/add"
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>Add Store Tractor</span>
        </Link>
      </div>

      {/* ---------- Header ---------- */}
      <div className="text-[18px] font-[600] grid grid-cols-[60px_120px_1fr_1fr_120px_120px_160px] items-center gap-x-4 bg-[#ededed] p-[20px] rounded">
        <p>Sl No</p>
        <p>Image</p>
        <p>Name</p>
        <p>Store ID</p>
        <p>Price</p>
        <p>Status</p>
        <p>Created At</p>
      </div>

      {/* ---------- Rows ---------- */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {tractors.length === 0 ? (
          <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No tractors found"
              className="w-[300px] lg:w-[500px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized
            />
          </div>
        ) : (
          tractors.map((tractor, index) => (
            <div
              key={tractor.id}
              className="text-[16px] grid grid-cols-[60px_120px_1fr_1fr_120px_120px_160px] items-center gap-x-4 px-[20px] py-[15px] rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              {/* Sl No */}
              <p>{index + 1}</p>

              {/* Image */}
              {tractor.baseTractor?.images?.[0] ? (
                <Image
                  src={tractor.baseTractor.images[0]}
                  alt={tractor.baseTractor.name}
                  width={50}
                  height={50}
                  className="w-[50px] h-[50px] object-cover rounded"
                />
              ) : (
                <div className="w-[50px] h-[50px] bg-gray-300 rounded flex items-center justify-center text-gray-500 text-sm">
                  N/A
                </div>
              )}

              {/* Name */}
              <p>{tractor.baseTractor?.name || "N/A"}</p>

              {/* Store ID (replace with store name if available) */}
              <p>{tractor.store_id || "N/A"}</p>

              {/* Price */}
              <p>₹{tractor.hourly_price}</p>

              {/* Status (hardcoded active if exists, else inactive) */}
              <p>
                {tractor.hourly_price > 0 ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </p>

              {/* Created Date */}
              <p>{tractor.createdAt?.split("T")[0]}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StoreTractors;