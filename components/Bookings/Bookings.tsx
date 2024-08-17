"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Booking } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import NewBooking from "./NewBooking";

const Bookings = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  function fetchBookings() {
    setLoading(true);
    renderInstance
      .get("/booking")
      .then((res) => {
        setAllBookings(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching booking list");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        {loading && <CircularProgress />}
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px]">
        <p className="text-[20px] font-bold">
          Total Bookings: {allBookings.length}
        </p>

        <NewBooking />
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
          <p>{activeHover === "Duration" ? "Dura..." : "Duration"}</p>
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

        <div
          className="w-[200px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Agent's name");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>{activeHover === "Agent's name" ? "Agen..." : "Agent's name"}</p>
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
        {
            allBookings.length === 0 ? <p>No bookings have been done</p>
            :
            allBookings.map((details, index)=>{
                return(
                    <div
                    // href={`/ParticularBooking/${details.BookingID}`}
                    className={`text-[18px] flex items-center justify-between gap-[10px] px-[20px] py-[20px] rounded cursor-pointer bg-[#ededed] hover:bg-white transition-all duration-500`}
                    key={index}
                  >
                    <p className="w-[50px]">{index + 1}</p>
      
                    <p className="w-[200px]">{details.id}</p>
      
                    <div className="w-[120px]">{`${details.start_date}`}</div>
      
                    <p className="w-[140px]">{details.end_date? `${details.end_date}`: `${details.booking_hours}`} Days</p>
      
                    <p className="w-[140px]">${details.total_cost}</p>
      
                    {/* <p className="w-[200px]">{details.AgentName}</p> */}
                  </div>
                )
            })
        }
      </div>
    </div>
  );
};

export default Bookings;
