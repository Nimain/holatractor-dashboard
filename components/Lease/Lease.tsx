"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Lease } from '@/utils/Types/types';
import { Backdrop, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react'
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NewLease from './NewLease';
import Image from 'next/image';
import NullImage from "@/assets/AnimateIcons/Tractor.svg"

const LeaseSection = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allLease, setAllLease] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);

  function fetchLease() {
    setLoading(true);
    renderInstance
      .get("/lease")
      .then((res) => {
        // Check if res.data is an array before setting it
        if (Array.isArray(res.data)) {
          setAllLease(res.data);
        } else if (res.data && typeof res.data === 'object') {
          // If res.data is an object with array data inside
          // This handles cases where the API returns {data: [...]} structure
          setAllLease(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          // Default to empty array if data is not in expected format
          setAllLease([]);
          console.error("API did not return an array:", res.data);
        }
      })
      .catch((err) => {
        errorMessage("Error fetching booking list");
        console.error(err);
        setAllLease([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchLease();
  }, []);

  return (
    <div className="w-full py-10">

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        {loading && <CircularProgress />}
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px]">
        <p className="text-[20px] font-bold">
          Total Lease: {Array.isArray(allLease) ? allLease.length : 0}
        </p>

        <NewLease />
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <p className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          Sn
        </p>

        <div
          className="w-[200px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Booking ID");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Booking ID" ? "Book..." : "Booking ID"}</p>
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Date
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
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Duration");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Duration" ? "End..." : "EndDate"}</p>
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
          Value
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
        {!Array.isArray(allLease) ? (
          <div className="w-full text-center py-5">Error loading lease data</div>
        ) : allLease.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No image found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          allLease.map((details, index) => {
            return (
              <div
                className={`text-[18px] flex items-center justify-between gap-[10px] px-[20px] py-[20px] rounded cursor-pointer bg-[#ededed] hover:bg-white transition-all duration-500`}
                key={index}
              >
                <p className="w-[50px]">{index + 1}</p>
                <p className="w-[200px]">{details.id}</p>
                <div className="w-[120px]">{`${details.start_date}`}</div>
                <p className="w-[140px]">{`${details.end_date}`}</p>
                <p className="w-[140px]">${details.total_cost}</p>
              </div>
            );
          })
        )}
      </div>

    </div>
  )
}

export default LeaseSection