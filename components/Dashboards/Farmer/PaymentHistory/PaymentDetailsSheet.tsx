"use client";

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
import { TableCell, TableRow } from "@/components/ui/table";
import { Payment } from "@/utils/Types/types";
import { PaymentStatus } from '@/utils/Types/types';
import { Download, Eye, Printer, Wallet } from "lucide-react";
import Image from "next/image";
import { BankAccountForm, PayPalForm, UPIForm } from "../BookingHistory";
import { useState } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { paymentHistoryTranslations } from "./PaymentHistoryTranslations";
import TranslatedText from "@/components/Menubar/TranslatedText";

const PaymentDetailsSheet = ({
  payment,
  paymentRefresh,
}: {
  payment: Payment;
  paymentRefresh: () => void;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Generate a preview URL for the selected image
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    // Here you would typically send the data to your backend
    if (!selectedFile) {
      errorMessage("Upload the payment screenshot or image");
      return;
    }
    setLoading(true);
    const buffer = Buffer.from(await selectedFile.arrayBuffer());
    const imageLink = await uploadFileToS3(buffer, selectedFile.name);

    if (!imageLink) {
      errorMessage("Error uploading payment proof");
      return;
    }

    renderInstance
      .patch(
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
      )
      .then((res) => {
        successMessage("Payment details submitted");
        paymentRefresh();
        setOpen(false);
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Log in user not found"
        ) {
          errorMessage("Log in user not found");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Farmer not found"
        ) {
          errorMessage("Farmer not found");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Payment not found"
        ) {
          errorMessage("Payment not found");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "You are not allowed for this task"
        ) {
          errorMessage("You are not allowed for this task");
        } else {
          errorMessage("Error in submitting payment proofs");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TableRow className="border-b hover:bg-gray-50">
          {/* <TableCell className='p-4'>
                        <Input
                            type="checkbox"
                            className="rounded w-4 h-4 accent-primaryColor"
                            onClick={e => { e.stopPropagation() }} />
                    </TableCell> */}
          <TableCell className="p-4 text-sm text-white">{payment.id}</TableCell>
          <TableCell className="p-4 text-sm">{payment.booking_id}</TableCell>
          <TableCell className="p-4 text-sm font-medium">
            ${payment.amount.toFixed(2)}
          </TableCell>
          <TableCell className="p-4 text-sm">
            <Badge
              className={`capitalize ${
                payment.status === PaymentStatus.PAID
                  ? "bg-green-500 text-white"
                  : payment.status === PaymentStatus.FarmerPENDING
                  ? "bg-orange-600 text-white"
                  : payment.status === PaymentStatus.OwnerREJECTED
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {payment.status === PaymentStatus.FarmerPENDING ? (
                <TranslatedText
                  greetings={paymentHistoryTranslations.pending}
                />
              ) : payment.status === PaymentStatus.FarmerCONFIRMED ? (
                <TranslatedText
                  greetings={paymentHistoryTranslations.ownerReview}
                />
              ) : payment.status === PaymentStatus.OwnerREJECTED ? (
                <TranslatedText
                  greetings={paymentHistoryTranslations.rejected}
                />
              ) : (
                <TranslatedText greetings={paymentHistoryTranslations.paid} />
              )}
            </Badge>
          </TableCell>
          <TableCell className="p-4 text-sm">
            {payment.transactionMethod}
          </TableCell>
          <TableCell className="p-4 text-sm text-white">{`${
            payment.reciever.first_name
          } ${payment.reciever.middle_name ?? ""} ${
            payment.reciever.last_name
          }`}</TableCell>
          <TableCell className="p-4 text-sm text-white">
            {`${payment.status}` === "COMPLETED" ? (
              new Date(payment.createdAt).toLocaleDateString()
            ) : (
              <TranslatedText
                greetings={paymentHistoryTranslations.paymentNotSettledYet}
              />
            )}
          </TableCell>
          {`${payment.status}` === "FarmerPENDING" && (
            <TableCell className="p-4">
              <Button className="bg-primaryColor">
                <TranslatedText greetings={paymentHistoryTranslations.action} />
              </Button>
            </TableCell>
          )}
        </TableRow>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="items-center">
            <SheetTitle>ID: {payment.id}</SheetTitle>
            <div className="flex items-center gap-2 mt-8">
              <Button variant="outline" className="bg-black text-white">
                <Download className="h-4 w-4 mr-2" />
                <TranslatedText greetings={paymentHistoryTranslations.export} />
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                <TranslatedText greetings={paymentHistoryTranslations.print} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Order Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                <TranslatedText
                  greetings={paymentHistoryTranslations.orderItems}
                />
              </h3>
              <span className="text-sm text-muted-foreground">
                {payment.booking.tractors.length +
                  payment.booking.attachments.length}
              </span>
            </div>

            <div className="space-y-4">
              {payment.booking.tractors.map((tractor) => {
                return (
                  <div
                    className="flex items-start gap-4"
                    key={tractor.tractor.id}
                  >
                    <Image
                      src={tractor.tractor.baseTractor.images[0]}
                      alt={tractor.tractor.baseTractor.name}
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {tractor.tractor.baseTractor.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-sm text-muted-foreground">
                          {tractor.tractor.baseTractor.model}
                        </div>
                        <div className="font-medium">
                          ${tractor.tractor.hourly_price}/hr
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {payment.booking.attachments.map((attachment) => {
                return (
                  <div
                    className="flex items-start gap-4"
                    key={attachment.attachment.id}
                  >
                    <Image
                      src={attachment.attachment.baseAttachment.images[0]}
                      alt={attachment.attachment.baseAttachment.name}
                      width={80}
                      height={80}
                      className="rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {attachment.attachment.baseAttachment.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <div className="font-medium">
                          ${attachment.attachment.hourly_price}/hr
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 font-medium">
              <div>
                <TranslatedText greetings={paymentHistoryTranslations.total} />
              </div>
              <div>${payment.booking.total_cost}</div>
            </div>
          </div>

          <Separator />

          {/* Contact Section */}
          <div className="space-y-4 w-[60%]">
            <h3 className="text-lg font-medium">
              <TranslatedText
                greetings={paymentHistoryTranslations.contactInformation}
              />
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <TranslatedText greetings={paymentHistoryTranslations.name} />
                </Label>
                <Input
                  id="name"
                  value={`${payment.booking.store?.owner.user.first_name} ${
                    payment.booking.store?.owner.user.middle_name ?? ""
                  } ${payment.booking.store?.owner.user.last_name}`}
                  readOnly={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <TranslatedText
                    greetings={paymentHistoryTranslations.email}
                  />
                </Label>
                <Input
                  id="email"
                  value={payment.booking.store?.owner.user.email}
                  readOnly={true}
                />
              </div>
              {`${payment.status} === "OwnerREJECTED` &&
                payment.rejecting_reasons.length >= 1 && (
                  <div className="space-y-2">
                    <Label>
                      <TranslatedText
                        greetings={paymentHistoryTranslations.rejectionReason}
                      />
                    </Label>
                    <Textarea
                      value={
                        payment.rejecting_reasons[
                          payment.rejecting_reasons.length - 1
                        ]
                      }
                      readOnly={true}
                    />
                  </div>
                )}
            </div>
          </div>

          <Separator />

          {/* Payment Method Section */}

          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                <TranslatedText
                  greetings={paymentHistoryTranslations.paymentMethods}
                />
              </h2>
              <div className="space-y-4">
                {/* Payment method */}

                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Wallet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.transactionMethod}{" "}
                        <TranslatedText
                          greetings={paymentHistoryTranslations.payment}
                        />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          <TranslatedText
                            greetings={paymentHistoryTranslations.view}
                          />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-fit">
                        {payment.BankAccount && (
                          <BankAccountForm
                            username={payment.BankAccount.accountHolderName}
                            bankname={payment.BankAccount.bankName}
                            accnum={payment.BankAccount.accountNumber}
                            branchCode={payment.BankAccount.branchCode ?? ""}
                            country={payment.BankAccount.country}
                            currency={payment.BankAccount.currency}
                            iban={payment.BankAccount.iban ?? ""}
                            routingnum={payment.BankAccount.routingNumber ?? ""}
                            swiftcode={payment.BankAccount.swiftCode ?? ""}
                          />
                        )}
                        {payment.PayPal && (
                          <PayPalForm email={payment.PayPal.email} />
                        )}
                        {payment.UPI && (
                          <UPIForm
                            upiId={payment.UPI.upi_id ?? ""}
                            upi={payment.UPI.qr_code}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      <TranslatedText
                        greetings={paymentHistoryTranslations.download}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Separator />

          {/* Payment Proof Section */}
          {(`${payment.status}` === "FarmerPENDING" ||
            `${payment.status}` === "OwnerREJECTED") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                <TranslatedText
                  greetings={paymentHistoryTranslations.paymentProof}
                />
              </h3>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <label
                  htmlFor="payment-proof"
                  className="relative flex flex-col items-center justify-center gap-1 p-8 text-center cursor-pointer"
                >
                  {!previewUrl ? (
                    <>
                      <div className="size-10 flex items-center justify-center rounded-full bg-primary/10">
                        <svg
                          className="size-6 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <TranslatedText
                          greetings={paymentHistoryTranslations.dragAndDrop}
                        />
                      </p>
                      <input
                        id="payment-proof"
                        type="file"
                        accept="image/*,.pdf"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Uploaded File Preview"
                        className="max-h-40 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </label>
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  <TranslatedText
                    greetings={paymentHistoryTranslations.uploadedFile}
                  />
                  : <span className="font-medium">{selectedFile.name}</span>
                </p>
              )}
            </div>
          )}
          {(`${payment.status}` === "FarmerPENDING" ||
            `${payment.status}` === "OwnerREJECTED") && (
            <Button
              className="w-full"
              disabled={loading || !selectedFile}
              onClick={() => {
                handleSubmit();
              }}
            >
              {loading ? (
                <TranslatedText
                  greetings={paymentHistoryTranslations.submitting}
                />
              ) : (
                <TranslatedText
                  greetings={paymentHistoryTranslations.submitPaymentDetails}
                />
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentDetailsSheet;
