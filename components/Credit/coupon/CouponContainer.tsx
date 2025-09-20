import Menubar from "@/components/Menubar/Menubar"; // Adjust this import path if needed
import React from "react";
import CreditPackage from "./Coupon";
import Coupon from "./Coupon";

const CreditPackageContainer = () => {
  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto">
      <Menubar pagename={"Coupon"} />
      <Coupon />
    </div>
  );
};

export default CreditPackageContainer;