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
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

// ✅ extend props to include user object & screenshots
interface UserDetails {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  dob?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  mobile?: string | null;
  phoneVerified?: boolean | null;
  country_code?: string | null;
}


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
  screenshots: string[]; // ✅ correct spelling
  user?: UserDetails; // ✅ added user object
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
  screenshots,
  user,
}: OwnerActionProps) => {
  const [loading, setLoading] = useState(false);
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  function InactiveOwner(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(`/owner/inactivate_owner/${id}`, {}, { headers: { Authorization: `Bearer ${access_token}` } })
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => {
        errorMessage("Try again");
      })
      .finally(() => setLoading(false));
  }

  function ActiveOwner(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(`/owner/activate_owner/${id}`, {}, { headers: { Authorization: `Bearer ${access_token}` } })
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => {
        errorMessage("Try again");
      })
      .finally(() => setLoading(false));
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <p className="w-[100px]">{index + 1}</p>
          <p className="w-[140px]">{mailHover === index ? name : `${name.slice(0, 5)}...`}</p>
          <p className={`transition ${index === mailHover ? "w-fit" : "w-[140px]"}`}>
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
          <p className="w-[180px]">{mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}</p>
          <p className="w-[180px]">{mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}</p>
        </div>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Update status of {name}</SheetTitle>
          <SheetDescription>
            {status === 1
              ? `${name} is an active operator`
              : `${name} is an inactive operator. Click on the active button to activate the operator.`}
          </SheetDescription>
        </SheetHeader>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {user?.first_name && (
            <div>
              <Label className="font-medium">First Name</Label>
              <Input value={user.first_name} readOnly />
            </div>
          )}
          {user?.middle_name && (
            <div>
              <Label className="font-medium">Middle Name</Label>
              <Input value={user.middle_name} readOnly />
            </div>
          )}
          {user?.last_name && (
            <div>
              <Label className="font-medium">Last Name</Label>
              <Input value={user.last_name} readOnly />
            </div>
          )}
          {user?.gender && (
            <div>
              <Label className="font-medium">Gender</Label>
              <Input value={user.gender} readOnly />
            </div>
          )}
          {user?.dob && (
            <div>
              <Label className="font-medium">Date of Birth</Label>
              <Input value={user.dob} readOnly />
            </div>
          )}

          {/* Email */}
          <div>
            <Label className="font-medium flex items-center gap-2">
              Email ID{" "}
              {user?.emailVerified ? (
                <CheckCircle className="text-green-500 w-4 h-4" />
              ) : (
                <XCircle className="text-red-500 w-4 h-4" />
              )}
            </Label>
            <Input value={user?.email || email} readOnly />
          </div>

          {/* Mobile */}
          {user?.mobile && (
            <div>
              <Label className="font-medium flex items-center gap-2">
                Mobile{" "}
                {user?.phoneVerified ? (
                  <CheckCircle className="text-green-500 w-4 h-4" />
                ) : (
                  <XCircle className="text-red-500 w-4 h-4" />
                )}
              </Label>
              <Input value={`${user.country_code || ""} ${user.mobile}`} readOnly />
            </div>
          )}

          {/* Screenshots */}
          {screenshots?.map((imageLink, i) => (
            <Image
              key={i}
              src={imageLink && imageLink.trim() !== "" ? imageLink : "/pic.jpg"}
              alt="Payment proof"
              width={400}
              height={400}
              className="w-[90%] mx-auto object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/pic.jpg";
              }}
            />
          ))}

          {/* Verified info */}
          <div>
            <Label className="font-medium">Mail Verified</Label>
            <Input value={user?.emailVerified ? "Yes" : "No"} readOnly />
          </div>
          <div>
            <Label className="font-medium">Mobile Verified</Label>
            <Input value={user?.phoneVerified ? "Yes" : "No"} readOnly />
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex justify-end items-end mt-auto pt-4">
          <SheetClose asChild>
            {status === 1 ? (
              <Button variant="destructive" onClick={(e) => InactiveOwner(e)}>
                {loading ? <CircularProgress size={16} /> : "Inactive"}
              </Button>
            ) : (
              <Button className="bg-green-800 hover:bg-green-700" onClick={(e) => ActiveOwner(e)}>
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
