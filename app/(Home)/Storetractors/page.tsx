import dynamic from "next/dynamic";
import React from "react";

const StoretractorsContainer = dynamic(() => import("@/components/Storetractors/StoretractorsContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
});

const ServicePage = () => {
  return < StoretractorsContainer/>;
};

export default StoretractorsContainer;
