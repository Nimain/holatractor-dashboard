// FarmerShimmer.tsx
import React from 'react';

const FarmerShimmer: React.FC = () => {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Placeholder for the header */}
      <div className="h-8 bg-gray-300 rounded w-1/2"></div>

      {/* Placeholder for image or profile */}
      <div className="w-full h-48 bg-gray-300 rounded"></div>

      {/* Placeholder for details */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>

      {/* Placeholder for button */}
      <div className="h-10 bg-gray-300 rounded w-1/4"></div>
    </div>
  );
};

export default FarmerShimmer;
