import React from "react";
import Menubar from "../Menubar/Menubar";
import Roles from "./Roles";

const RolesContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"Role Management"} />
      <div className="mt-4">
        <Roles />
      </div>
    </div>
  );
};

export default RolesContainer;