"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { useCookie } from "next-cookie";
import { useState, useEffect } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { User } from "@/utils/Types/types";

const Users = () => {
  const [activeHover, setActiveHover] = useState("");
  const [mailHover, setMailHover] = useState(-1);

  const [users, setUsers] = useState<User[]>([]);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function fetchAllUsers() {
    renderInstance
      .get("/user", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching roles");
      })
      .finally(() => {
        // setFetchingRoles(false)
      });
  }

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString(undefined, options);
  };

  return (
    <div className="mt-[40px] text-[18px]">
      <p className="mb-[20px] text-[22px] font-[600]">All users</p>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[100px] flex items-center justify-between group">
          Id
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
          Name
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
          Email
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
            setActiveHover("Verified");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          {activeHover === "Verified" ? "Veri..." : "Verified"}
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
          Status
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
          Role
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
            setActiveHover("Joined at");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          {activeHover === "Joined at" ? "Join..." : "Joined at"}
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
            setActiveHover("Updated at");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          {activeHover === "Updated at" ? "Upda..." : "Updated at"}
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
        {users.length !== 0 &&
          users.map((details, index) => {
            const name = `${details.first_name} ${
              details.middle_name ? details.middle_name + " " : ""
            }${details.last_name}`;
            return (
              <div
                className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500"
                key={index}
                onMouseEnter={() => {
                  setMailHover(index);
                }}
                onMouseLeave={() => {
                  setMailHover(-1);
                }}
              >
                <p className="w-[100px]">{index + 1}</p>

                <p className="w-[140px]">{name}</p>

                <p
                  className={`transition ${
                    index === mailHover ? "w-fit" : "w-[140px]"
                  }`}
                >
                  {mailHover === index
                    ? details.email
                    : `${details.email.slice(0, 5)}...`}
                </p>

                <div
                  className={`px-[10px] text-[14px] py-[6px] ${
                    details.emailVerified ? "text-[#3e875e]" : "text-red-400"
                  } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
                >
                  {details.emailVerified ? "Yes" : "No"}
                </div>

                <p
                  className={`px-[10px] text-[14px] py-[6px] ${
                    details.emailVerified ? "text-[#3e875e]" : "text-red-400"
                  } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
                >
                  {details.emailVerified ? "Active" : "Inactive"}
                </p>

                <div className="w-[140px]">
                  {details.profiles.map((detail, idx) => {
                    return (
                      <p key={`${details.id}-${idx}`}>{detail.role.name}</p>
                    );
                  })}
                </div>

                <p className="w-[180px]">
                  {mailHover === index
                    ? formatDate(details.createdAt)
                    : `${formatDate(details.createdAt).slice(0, 12)}...`}
                </p>

                <p className="w-[180px]">
                  {mailHover === index
                    ? formatDate(details.updatedAt)
                    : `${formatDate(details.updatedAt).slice(0, 12)}...`}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Users;
