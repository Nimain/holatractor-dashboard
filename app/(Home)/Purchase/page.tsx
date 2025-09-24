import dynamic from "next/dynamic";
import React from "react";

const Purchase = dynamic(() => import("@/components/Credit/Purchase/PurchaseContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
});

const PurchasePage = () => {
  return < Purchase/>;
};

export default PurchasePage;
