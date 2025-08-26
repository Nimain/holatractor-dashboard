import dynamic from "next/dynamic";
import React from "react";

const Service = dynamic(() => import("@/components/service/ServiceContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
});

const ServicePage = () => {
  return < Service/>;
};

export default ServicePage;
