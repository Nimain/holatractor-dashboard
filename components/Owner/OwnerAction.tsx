"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { MouseEvent, useState } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import Image from "next/image";

interface OwnerActionProps {
  index: number;
  mailHover: number;
  name: string;
  email: string;
  emailVerified: boolean;
  creatDate: string;
  updateDate: string;
  status: number;
  id: string;
  screenShots: string[];
}

const OwnerAction = ({
  index,
  name,
  mailHover,
  email,
  emailVerified,
  creatDate,
  updateDate,
  status,
  id,
  screenShots,
}: OwnerActionProps) => {
  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function InactiveOwner(
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(
        `/owner/inactivate_owner/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => {
        errorMessage("Try again");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function ActiveOwner(
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(
        `/owner/activate_owner/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => {
        errorMessage("Try again");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <p className="w-[100px]">{index + 1}</p>

          <p className="w-[140px]">
            {mailHover === index ? name : `${name.slice(0, 5)}...`}
          </p>

          <p
            className={`transition ${
              index === mailHover ? "w-fit" : "w-[140px]"
            }`}
          >
            {mailHover === index ? email : `${email.slice(0, 5)}...`}
          </p>

          <div
            className={`px-[10px] text-[14px] py-[6px] ${
              emailVerified ? "text-[#3e875e]" : "text-red-400"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {emailVerified ? "Yes" : "No"}
          </div>

          <p
            className={`px-[10px] text-[14px] py-[6px] ${
              status === 1 ? "text-[#3e875e]" : "text-red-400"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {status === 1 ? "Active" : "Inactive"}
          </p>

          <p className="w-[180px]">
            {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
          </p>

          <p className="w-[180px]">
            {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
          </p>
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Update status of {name}</SheetTitle>
          <SheetDescription>
            {status === 1
              ? `${name} is an active operator`
              : `${name} is an inactive operator. Click on the active button to active the operator.`}
          </SheetDescription>
        </SheetHeader>
        
        {/* Main content area - takes up available space */}
        <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              readOnly={true}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Email
            </Label>
            <Input
              id="username"
              value={email}
              readOnly={true}
              className="col-span-3"
            />
          </div>
          {screenShots.map((imageLink, i) => (
            <Image
              key={i}
              src={
                imageLink && imageLink.trim() !== ""
                  ? imageLink
                  : "/pic.jpg"
              }
              alt="Payment proof"
              width={400}
              height={400}
              className="w-[90%] mx-auto object-cover"
              onError={(e) => {
                e.currentTarget.src = "/pic.jpg"; // fallback if image fails
              }}
            />
          ))}

          {/* Additional Information Section */}
          <div className="grid gap-3 mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-lg mb-2">Additional Details</h3>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">User ID</Label>
              <Input
                value={id}
                readOnly={true}
                className="col-span-3 text-gray-600 bg-gray-50"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Email Verified</Label>
              <div className="col-span-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  emailVerified 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {emailVerified ? "✓ Verified" : "✗ Not Verified"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Account Status</Label>
              <div className="col-span-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === 1 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {status === 1 ? "🟢 Active" : "🔴 Inactive"}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Created Date</Label>
              <Input
                value={new Date(creatDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                readOnly={true}
                className="col-span-3 text-gray-600 bg-gray-50"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Last Updated</Label>
              <Input
                value={new Date(updateDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                readOnly={true}
                className="col-span-3 text-gray-600 bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Screenshots</Label>
              <div className="col-span-3">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {screenShots.length} {screenShots.length === 1 ? 'Image' : 'Images'} Uploaded
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer fixed at bottom-right */}
        <SheetFooter className="flex justify-end items-end mt-auto pt-4">
          <SheetClose asChild>
            {status === 1 ? (
              <Button
                variant={"destructive"}
                onClick={(e) => {
                  InactiveOwner(e);
                }}
              >
                {loading ? <CircularProgress size={16} /> : "Inactive"}
              </Button>
            ) : (
              <Button
                className="bg-green-800 hover:bg-green-700"
                onClick={(e) => {
                  ActiveOwner(e);
                }}
              >
                {loading ? <CircularProgress size={16} /> : "Active"}
              </Button>
            )}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OwnerAction;