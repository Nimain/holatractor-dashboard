// FarmerShimmer.tsx
import React from 'react';

const FarmerShimmer: React.FC = () => {
  return (
    <div className="w-full flex gap-4 my-4 animate-pulse">

      <div className="w-full space-y-6">
        <div className="flex justify-between">
          {/* Main Content Area */}
          <div className="flex-grow">
            {/* Stats Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 1200px:grid-cols-4 gap-6 mb-8">
              {Array(4).fill(0).map((_, index) => (
                <div key={index} className="rounded-2xl space-y-4 bg-gray-300 p-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-400 rounded w-1/3"></div>
                    <div className="h-6 w-6 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="h-8 bg-gray-400 rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* Map and Farms Section */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 1200px:grid-cols-4 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 1200px:flex 1200px:flex-col gap-6 col-span-2 1200px:col-span-1">
                {Array(2).fill(0).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-gray-300 p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-400 rounded w-1/3"></div>
                      <div className="h-6 w-6 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="h-8 bg-gray-400 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="col-span-2 1200px:col-span-3">
                <div className="h-72 bg-gray-300 rounded-lg"></div>
              </div>
            </div>

            {/* Recent Bookings Section */}
            <div className="w-full 900px:w-fit flex 1200px:hidden flex-col gap-4">
              <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></div>
              <div className="space-y-4">
                {Array(2).fill(0).map((_, index) => (
                  <div key={index} className="w-full 900px:max-w-sm 900px:min-w-sm flex items-center justify-between py-2 px-4 rounded-2xl bg-gray-300">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-400 rounded-full mr-2"></div>
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-gray-400 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-400 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-gray-400 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs Table Section */}
            <div className="w-full bg-white p-2 rounded-2xl drop-shadow h-96 overflow-auto">
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4">
                  {Array(4).fill(0).map((_, index) => (
                    <div key={index} className="h-4 bg-gray-300 rounded w-full"></div>
                  ))}
                </div>
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 mt-2">
                    {Array(4).fill(0).map((_, colIndex) => (
                      <div key={colIndex} className="h-4 bg-gray-300 rounded w-full"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-[25%] hidden 900px:flex flex-col gap-6 ml-4">
            {/* Sidebar Header */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></div>
              {Array(2).fill(0).map((_, index) => (
                <div key={index} className="w-full max-w-sm min-w-sm flex items-center justify-between py-2 px-4 rounded-2xl bg-gray-300">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-400 rounded-full mr-2"></div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-gray-400 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-400 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-400 rounded"></div>
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="h-40 bg-gray-300 rounded-lg"></div>
          </div>
        </div>

      </div>

      {/* Sidebar Section */}

    </div>

  );
};

export default FarmerShimmer;
