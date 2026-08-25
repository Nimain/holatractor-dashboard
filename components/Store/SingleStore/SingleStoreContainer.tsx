import Menubar from "@/components/Menubar/Menubar";
import React from "react";
import SingleStore from "./SingleStore";

const SingleStoreContainer = () => {
  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 relative overflow-auto">
      <Menubar pagename={"Store Details"} />
      <div className="mt-4">
        <SingleStore />
      </div>
    </div>
  );
};

export default SingleStoreContainer;