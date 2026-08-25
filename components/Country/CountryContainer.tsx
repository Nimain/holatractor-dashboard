import React from "react";
import Menubar from "../Menubar/Menubar";
import CountrySection from "./Country";

const CountryContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"Territories & Countries"} />
      <div className="mt-4">
        <CountrySection />
      </div>
    </div>
  );
};

export default CountryContainer;