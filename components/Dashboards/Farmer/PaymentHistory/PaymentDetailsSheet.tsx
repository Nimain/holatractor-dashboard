"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Download,
  Eye,
  Printer,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  UploadCloud,
  X,
  Building2,
  Mail,
  User,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";

interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

export default function PaymentDetailsSheet({
  payment,
  paymentRefresh,
  currency = { code: "USD", symbol: "$", rate: 1.0 },
}: {
  payment: any;
  paymentRefresh: () => void;
  currency?: CurrencyInfo;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const formatPrice = (usdAmount: number) => {
    const converted = Number(usdAmount || 0) * (currency.rate || 1.0);
    return `${currency.symbol} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency.code}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      errorMessage("Please select a payment receipt/screenshot to upload");
      return;
    }
    setLoading(true);
    try {
      const buffer = Buffer.from(await selectedFile.arrayBuffer());
      const imageLink = await uploadFileToS3(buffer, selectedFile.name);

      if (!imageLink) {
        errorMessage("Error uploading payment proof");
        setLoading(false);
        return;
      }

      await renderInstance.patch(
        `/farmer/payment_confirm/${payment.id}`,
        {
          ref_no: "",
          screenshots: [imageLink],
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      successMessage("Payment proof uploaded successfully");
      paymentRefresh();
      setOpen(false);
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || "Error submitting payment proof");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const booking = payment.booking || {};
  const tractors = booking.tractors || [];
  const attachments = booking.attachments || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-1.5"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>View Invoice</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 space-y-6 text-slate-900 dark:text-white">
        {/* ── HEADER ────────────────────────────────────────────── */}
        <SheetHeader className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-lg">
              Official Tax Invoice / Receipt
            </Badge>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">Ref: {payment.id}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrint}
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Settlement Summary: {formatPrice(payment.amount)}
          </SheetTitle>
          <p className="text-xs text-slate-500">
            Issued for Booking Ref #{payment.booking_id} • {new Date(payment.createdAt).toLocaleString()}
          </p>
        </SheetHeader>

        {/* ── EQUIPMENT & WORK BREAKDOWN ────────────────────────── */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-between">
            <span>Dispatched Machinery Fleet</span>
            <span className="text-xs text-slate-400 font-normal">
              {tractors.length + attachments.length > 0
                ? `${tractors.length + attachments.length} Units Assigned`
                : "Standard Fleet Operation"}
            </span>
          </h3>

          <div className="space-y-2.5">
            {tractors.map((t: any, idx: number) => {
              const tractorObj = t.tractor || t;
              const base = tractorObj.baseTractor || {};
              const img = base.images?.[0] || tractorObj.image || "https://images.unsplash.com/photo-1592928302636-c83cf1e1c887?w=600&q=80";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-slate-200 dark:bg-slate-700 shrink-0">
                      <Image src={img} alt={base.name || "Tractor"} fill unoptimized className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{base.name || "Commercial Tractor"}</h4>
                      <p className="text-[11px] text-slate-400">{base.model || "Heavy Field Unit"}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                    {formatPrice(tractorObj.hourly_price || 25)}/hr
                  </span>
                </div>
              );
            })}

            {attachments.map((att: any, idx: number) => {
              const attObj = att.attachment || att;
              const base = attObj.baseAttachment || {};
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {base.name || attObj.name || "Agricultural Implement"}
                  </span>
                  <span className="font-bold text-slate-500">{formatPrice(attObj.hourly_price || 15)}/hr</span>
                </div>
              );
            })}

            {tractors.length === 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {payment.service_name || "Commercial Plowing & Precision Seeding"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {payment.area || 5} Hectares • Certified Operator & Real-Time Telemetry Included
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">Total Invoiced Amount</span>
            <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
              {formatPrice(payment.amount)}
            </span>
          </div>
        </div>

        {/* ── SETTLEMENT CHANNEL DETAILS ────────────────────────── */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Payment Channel & Depot Account</h3>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Method</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{payment.paymentType || "Direct Card / QR"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Receiver Hub</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{payment.receiver_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Transaction Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{payment.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Regional Currency Rate</span>
              <span className="font-mono text-slate-500">1 USD = {currency.rate} {currency.code}</span>
            </div>
          </div>
        </div>

        {/* ── UPLOAD PROOF OF PAYMENT (IF PENDING) ──────────────── */}
        {(payment.status === "FarmerPENDING" || payment.status === "OwnerREJECTED") && (
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Upload Transfer Voucher / Receipt</h3>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
              {!previewUrl ? (
                <label className="cursor-pointer space-y-2 block">
                  <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to select bank receipt or QR transaction screenshot
                  </p>
                  <p className="text-[10px] text-slate-400">PNG, JPG or PDF up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Voucher" className="max-h-36 rounded-xl object-contain mx-auto" />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <Button
              disabled={loading || !selectedFile}
              onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 shadow-sm"
            >
              {loading ? "Submitting Voucher..." : "Submit Proof of Payment"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

