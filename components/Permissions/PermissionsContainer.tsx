import React from "react";
import Menubar from "../Menubar/Menubar";
import Permissions from "./Permissions";

const PermissionsContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"Role Permissions Matrix"} />
      <div className="mt-4">
        <Permissions />
      </div>
    </div>
  );
};

export default PermissionsContainer;