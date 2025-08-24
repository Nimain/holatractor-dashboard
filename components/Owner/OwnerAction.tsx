// part-2
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

// utils/formatDate.ts
export function formatDateOnly(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ✅ extend props
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

interface DocumentDetails {
  document_number?: string;
  attachment?: string;
  expire_date?: string | null;
}

interface LocationDetails {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  lat?: string;
  lan?: string;
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
  screenshots: string[];
  user?: UserDetails;
  document?: DocumentDetails;
  location?: LocationDetails;
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
  document,
  location,
}: OwnerActionProps) => {
  const [loading, setLoading] = useState(false);
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // ✅ FIXED: Changed to PATCH method for soft delete
  function DeleteOwner(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    
    // Using PATCH method to change status to "deleted" instead of actually deleting
    renderInstance
      .patch(
        `/owner/delete_owner/${id}`, // Keep the same endpoint
        {}, // Empty body - the server will handle changing status to "deleted"
        { 
          headers: { 
            Authorization: `Bearer ${access_token}` // Same auth as other functions
          } 
        }
      )
      .then(() => {
        successMessage("Owner deleted successfully");
        window.location.reload(); // Refresh to show updated data
      })
      .catch(() => errorMessage("Failed to delete. Try again"))
      .finally(() => setLoading(false));
  }

  function InactiveOwner(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(
        `/owner/inactivate_owner/${id}`,
        {},
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => errorMessage("Try again"))
      .finally(() => setLoading(false));
  }

  function ActiveOwner(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    renderInstance
      .patch(
        `/owner/activate_owner/${id}`,
        {},
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      .then(() => {
        successMessage("Success");
        window.location.reload();
      })
      .catch(() => errorMessage("Try again"))
      .finally(() => setLoading(false));
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
          <SheetDescription className="text-red-600">
            {status === 1
              ? `${name} is an active operator`
              : `${name} is inactive. Click "Active" to activate.`}
          </SheetDescription>
        </SheetHeader>

        {/* Main Content Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {screenshots?.length > 0 ? (
            screenshots.map((img, i) => (
              <Image
                key={i}
                src={img && img.trim() !== "" ? img : "/pic.jpg"}
                alt="Payment Screenshot"
                width={400}
                height={400}
                className="w-[90%] mx-auto rounded-lg border object-cover"
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).src = "/pic.jpg")
                }
              />
            ))
          ) : (
            <p className="text-gray-500">No payment screenshots uploaded</p>
          )}

          {/* ✅ Owner Details */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              Owner Details
            </h3>
            <div className="space-y-3 mt-3">
              <div>
                <Label>Name</Label>
                <Input value={name} readOnly />
              </div>
              {user?.gender && (
                <div>
                  <Label>Gender</Label>
                  <Input value={user.gender} readOnly />
                </div>
              )}

              {user?.dob && (
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={formatDateOnly(user.dob)} readOnly />
                </div>
              )}
              <div>
                <Label className="flex items-center gap-2">
                  Email{" "}
                  {user?.emailVerified ? (
                    <CheckCircle className="text-green-500 w-4 h-4" />
                  ) : (
                    <XCircle className="text-red-500 w-4 h-4" />
                  )}
                </Label>
                <Input value={user?.email || email} readOnly />
              </div>
              {user?.mobile && (
                <div>
                  <Label className="flex items-center gap-2">
                    Mobile{" "}
                    {user?.phoneVerified ? (
                      <CheckCircle className="text-green-500 w-4 h-4" />
                    ) : (
                      <XCircle className="text-red-500 w-4 h-4" />
                    )}
                  </Label>
                  <Input
                    value={`${user.country_code || ""} ${user.mobile}`}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>

          {/* ✅ Payment Details */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              Payment Details
            </h3>

            {screenshots?.length > 0 ? (
              <div className="space-y-3 mt-3">
                {screenshots.map((src, i) => (
                  <div key={i} className=" rounded-lg space-y-2">
                    <div>
                      <Label>Screenshot ID</Label>
                      <Input value={`${i + 1}`} readOnly />
                    </div>
                    <div>
                      <Label>Screenshot URL</Label>
                      <Input value={src} readOnly />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-3">
                No payment screenshots uploaded
              </p>
            )}
          </div>

          {/* ✅ Document */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">Document</h3>
            <div className="space-y-3 mt-3">
              <div>
                <Label>Document Number</Label>
                <Input value={document?.document_number || "N/A"} readOnly />
              </div>
              {document?.expire_date && (
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    value={formatDateOnly(document.expire_date)}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>

          {/* ✅ Location */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">Location</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>City</Label>
                <Input value={location?.city || "N/A"} readOnly />
              </div>
              <div>
                <Label>State</Label>
                <Input value={location?.state || "N/A"} readOnly />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={location?.country || "N/A"} readOnly />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input value={location?.zip_code || "N/A"} readOnly />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input value={location?.lat || "N/A"} readOnly />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={location?.lan || "N/A"} readOnly />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex justify-between items-center mt-auto pt-4">
          {/* ✅ FIXED Delete button */}
          <Button
            variant="destructive"
            onClick={(e) => DeleteOwner(e)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={16} /> : "Delete"}
          </Button>

          <div className="flex gap-3">
            {status === 1 ? (
              <Button variant="outline" onClick={(e) => InactiveOwner(e)}>
                {loading ? <CircularProgress size={16} /> : "Inactive"}
              </Button>
            ) : (
              <Button
                className="bg-green-800 hover:bg-green-700"
                onClick={(e) => ActiveOwner(e)}
              >
                {loading ? <CircularProgress size={16} /> : "Active"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OwnerAction;