import React from "react";
import Menubar from "../Menubar/Menubar";
import Logs from "./Logs";

const LogsContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"System Activity & Audit Logs"} />
      <div className="mt-4">
        <Logs />
      </div>
    </div>
  );
};

export default LogsContainer;