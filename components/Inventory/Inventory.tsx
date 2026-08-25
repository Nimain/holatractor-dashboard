"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Inventory } from "@/utils/Types/types";
import { Avatar, Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import { useState, useEffect } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Image from 'next/image';
import NullImage from "@/assets/AnimateIcons/Tractor.svg"

const InventorySection = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  async function fetchAllTractors() {
    setFetchingRoles(true);
    let loaded = false;

    // 1. Try Next.js API route first
    try {
      const res = await fetch("/api/inventory", {
        headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllTractors(data);
          loaded = true;
        }
      }
    } catch (apiErr) {
      console.warn("Local inventory fetch notice:", apiErr);
    }

    // 2. Fallback to renderInstance (NestJS)
    if (!loaded) {
      try {
        const res = await renderInstance.get("/inventory");
        if (res.status === 200 && Array.isArray(res.data)) {
          setAllTractors(res.data);
          loaded = true;
        }
      } catch (err) {
        console.warn("NestJS inventory fetch notice:", err);
      }
    }

    setFetchingRoles(false);
  }

  useEffect(() => {
    fetchAllTractors();
  }, []);

  return (
    <div className="w-full py-[20px]">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={fetchingRoles}
      >
        {fetchingRoles && <CircularProgress />}
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-[20px]">
        <p className="text-[20px]">
          <span className="font-[600]">
            Total tractors: {allTractors.length}
          </span>
        </p>

        <Link
          href={"/Inventory/new"}
          className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px]"
        >
          <AddIcon />
          <span>New inventory</span>
        </Link>
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer mt-[30px]">
        <div className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          <Avatar />
        </div>

        <div
          className="w-[200px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Tractor name");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Tractor name" ? "Trac..." : "Tractor name"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[150px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Model");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Model" ? "Mode..." : "Model"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Category");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Category" ? "Cate..." : "Category"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          <p>Date</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          <p>Status</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[20px]">
        {allTractors.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
          <Image
          src={NullImage}
          alt="No image found"
          className="w-[400px] lg:w-[700px] h-auto object-cover"
          width={400}
          height={400}
          unoptimized={true} />
      </div>
        ) : (
          allTractors.map((tractorDetails, index) => {
            return (
              <Link
                href={`/Inventory/${tractorDetails.id}`}
                className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer transition-all duration-500 hover:bg-white"
                key={index}
              >
                {tractorDetails.tractor.images.length > 0 ? (
                  <Image
                    src={tractorDetails.tractor.images[0]}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                    alt={tractorDetails.tractor.name}
                    width={50}
                    height={50}
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
                    <Avatar />
                  </div>
                )}

                <p className="w-[200px]">{tractorDetails.tractor.name}</p>

                <p className="w-[150px]">
                  {tractorDetails.tractor.model ?? "Data not present"}
                </p>

                <p className="w-[180px]">{tractorDetails.tractor.type}</p>

                <p className="w-[140px]">
                  {tractorDetails.tractor.year
                    ? new Date(tractorDetails.tractor.year)
                        .toISOString()
                        .slice(0, 10)
                    : "Date not available"}
                </p>

                {/* <p
                                    className={`w-[140px] px-[16px] py-[8px] rounded-full text-center ${tractorDetails.TractorStatus ? 'text-[#3e875e]' : 'text-red-400'} bg-[#dfe4e2]`}>
                                    {tractorDetails.TractorStatus ? 'Available' : 'Not available'}
                                </p> */}
                <p
                  className={`w-[140px] px-[16px] py-[8px] rounded-full text-center text-[#3e875e] bg-[#dfe4e2]`}
                >
                  Available
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventorySection;