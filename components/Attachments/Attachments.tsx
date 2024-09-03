"use client";

import { Attachment } from "@/utils/Types/types";
import { Avatar, Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import Link from "next/link";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import NullImage from "@/assets/AnimateIcons/Attachment.svg"

const Attachments = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function fetchAllAttachments() {
    if (access_token) {
      setFetchingAttachments(true);
      renderInstance
        .get("/attachment", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => {
          if (res.status === 200) setAllAttachments(res.data);
        })
        .catch((err) => {
          console.log(err);
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingAttachments(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    fetchAllAttachments();
  }, []);

  return (
    <div className="w-full py-[20px]">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={fetchingAttachments}
      >
        {fetchingAttachments && <CircularProgress />}
      </Backdrop>

      <div className="w-full flex items-center justify-between gap-[20px]">
        <p className="text-[20px]">
          <span className="font-[600]">
            Total Attachments: {allAttachments.length}
          </span>
        </p>

        <Link
          href={"/Attachments/new"}
          className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px]"
        >
          <AddIcon />
          <span>New attachment</span>
        </Link>
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer mt-[30px]">
        <div className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
          <Avatar />
        </div>

        <div
          className="w-[300px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Tractor name");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>
            {activeHover === "Tractor name" ? "Atta..." : "Attachment name"}
          </p>
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
          className="w-[300px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Model");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          <p>
            {activeHover === "Model" ? "Desc..." : "Attachment description"}
          </p>
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
        {allAttachments.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
          <Image
          src={NullImage}
          alt="No image found"
          className="w-[400px] h-auto object-cover"
          width={400}
          height={400}
          unoptimized={true} />
      </div>
        ) : (
          allAttachments.map((tractorDetails, index) => {
            return (
              <div
                // href={`/Tractors/${index}`}
                className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer transition-all duration-500 hover:bg-white"
                key={index}
              >
                {tractorDetails.images.length === 0 ? (
                  <div className="w-[50px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400">
                    <Avatar />
                  </div>
                ) : (
                  <Image
                    src={tractorDetails.images[0]}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                    alt={tractorDetails.name}
                    width={50}
                    height={50}
                    unoptimized={true}
                  />
                )}

                <p className="w-[300px]">{tractorDetails.name}</p>

                <p className="w-[300px]">{tractorDetails.description}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Attachments;
