import Menubar from "@/components/Menubar/Menubar"; // Adjust this import path if needed
import React from "react";
import CurrencyManagement from "./Currencymanagement";

const CurrencyContainer = () => {
  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] relative overflow-auto">
      <Menubar pagename={"Currency Management"} />
      <CurrencyManagement />
    </div>
  );
};

export default CurrencyContainer;