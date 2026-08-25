import React from "react";
import Menubar from "../Menubar/Menubar";
import CitySection from "./City";

const CityContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"Municipalities & Cities"} />
      <div className="mt-4">
        <CitySection />
      </div>
    </div>
  );
};

export default CityContainer;