"use client";

import { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface TransactionReference {
  txn?: string;
  ref?: string;
  base_id?: string;
  createdAt?: string;
}

interface OwnerSubscribed {
  id?: string;
  user_id?: string;
  subscription_id?: string;
  end_date?: string;
}

interface PaymentUser {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  emailVerified?: boolean;
  mobile?: string;
  phoneVerified?: boolean;
  country_code?: string;
  image?: string;
}

interface PaymentDetails {
  id: string;
  user?: PaymentUser;
  amount: number;
  status: "Success" | "Pending" | "Failed" | "NotGenerated";
  createdAt: string;
  updatedAt?: string;
  paymentScreenshots?: string[];
  gpsdeiveces_id?: string;
  location_id?: string;
  ownerSubscribed_id?: string;
  transaction_reference?: TransactionReference;
  ownerSubscribed?: OwnerSubscribed;
}

interface PaymentActionProps {
  index: number;
  mailHover: number;
  payment: PaymentDetails;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PaymentAction = ({ index, mailHover, payment }: PaymentActionProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const user = payment.user || {};
  const isHovered = mailHover === index; // <-- Hover detection for row styling

  const statusColor = () => {
    switch (payment.status) {
      case "Success": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Failed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const fullName = `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim();

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div
          className={`text-[18px] flex items-center justify-between gap-[10px] p-[20px] rounded cursor-pointer transition-all duration-300
            ${isHovered ? 'bg-white shadow-md' : 'bg-[#ededed]'}`}
        >
          {/* slno */}
          <p className="w-[100px]">{index + 1}</p>
          
          {/* id */}
          <p className="w-[250px] truncate" title={payment.id}>
            {payment.id}
          </p>

          {/* amount */}
          <p className="w-[180px] font-medium">${payment.amount.toFixed(2)}</p>

          {/* status */}
          <div className="w-[180px]">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor()}`}>
              {payment.status}
            </span>
          </div>
          
          {/* created */}
          <p className="w-[220px]">{formatDate(payment.createdAt)}</p>
        </div>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full overflow-hidden w-[400px] sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Payment Details</SheetTitle>
          <SheetDescription>
            Details for transaction ID: {payment.id}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex flex-col items-center">
            <Image
              src={user.image || "/default-profile.png"}
              alt={`${fullName || 'User'}'s profile`}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-full object-cover border-2 shadow-md"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold border-b pb-2 mb-3">User Info</h3>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={fullName || 'N/A'} readOnly />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  Email
                  {user.emailVerified ? <CheckCircle className="text-green-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}
                </Label>
                <Input value={user.email || 'N/A'} readOnly />
              </div>
              {user.mobile && (
                <div>
                  <Label className="flex items-center gap-2">
                    Mobile
                    {user.phoneVerified ? <CheckCircle className="text-green-500 w-4 h-4" /> : <XCircle className="text-red-500 w-4 h-4" />}
                  </Label>
                  <Input value={`${user.country_code || ""} ${user.mobile}`} readOnly />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold border-b pb-2 mb-3">Transaction Details</h3>
            <div className="space-y-3">
              <div>
                <Label>Amount</Label>
                <Input value={`$${payment.amount}`} readOnly />
              </div>
              <div>
                <Label>Transaction Reference (TXN)</Label>
                <Input value={payment.transaction_reference?.txn ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>GPS Device ID</Label>
                <Input value={payment.gpsdeiveces_id ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>Location ID</Label>
                <Input value={payment.location_id ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>Owner Subscription ID</Label>
                <Input value={payment.ownerSubscribed_id ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>User ID</Label>
                <Input value={payment.ownerSubscribed?.user_id ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>Subscription ID</Label>
                <Input value={payment.ownerSubscribed?.subscription_id ?? 'N/A'} readOnly />
              </div>
              <div>
                <Label>Subscription End Date</Label>
                <Input value={formatDate(payment.ownerSubscribed?.end_date)} readOnly />
              </div>
              <div>
                <Label>Last Updated</Label>
                <Input value={formatDate(payment.updatedAt)} readOnly />
              </div>
            </div>
          </div>

          {payment.paymentScreenshots && payment.paymentScreenshots.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold border-b pb-2 mb-3">Payment Screenshots</h3>
              <div className="mt-3 flex flex-col gap-3">
                {payment.paymentScreenshots.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt={`Payment Screenshot ${i + 1}`}
                    width={300}
                    height={200}
                    className="rounded-lg object-cover border"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex justify-end mt-auto pt-4 border-t">
          <Button onClick={() => setSheetOpen(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentAction;
