import dynamic from "next/dynamic";
import React from "react";

const Payment = dynamic(() => import("@/components/PaymentHistory/PymentContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
});

const ServicePage = () => {
  return < Payment/>;
};

export default Payment;
