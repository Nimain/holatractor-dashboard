import React from 'react';
import { Search, ChevronRight } from 'lucide-react';

const CampaignsDashboard = () => {
  const campaigns = [
    {
      id: 1,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    },
    {
      id: 2,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    },
    {
      id: 3,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    },
    {
      id: 4,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    },
    {
      id: 5,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    },
    {
      id: 6,
      name: "Holatractor's Campaign",
      type: "E commerce",
      createdAt: "17/06/2025",
      status: "Active",
      targetAudience: "Tractor Owners"
    }
  ];

  return (
    <div className="w-full max-w-9xl mx-auto p-3 sm:p-6 bg-gray-100 min-h-screen overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-600 mb-6 text-center sm:text-left">
          Campaigns
        </h1>

        {/* Launch Campaign Banner */}
        <div className="bg-gradient-to-r from-red-800 to-red-700 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white text-center sm:text-left">
            <h2 className="text-2xl font-bold mb-3">Launch Your Ad Campaign Today</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 sm:space-x-6">
              <span className="flex items-center text-sm sm:text-base">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                Quick Setup
              </span>
              <span className="flex items-center text-sm sm:text-base">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                Smart Targeting
              </span>
              <span className="flex items-center text-sm sm:text-base">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                AI Optimization
              </span>
            </div>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center font-semibold transition-colors">
            Create Ad Now
            <ChevronRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-full max-w-md mx-auto sm:mx-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Campaign Name"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Table / Card Layout */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Table Header (hidden on mobile) */}
        <div className="hidden sm:block bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="text-red-600 font-semibold">S.NO</div>
            <div className="text-red-600 font-semibold">CAMPAIGN</div>
            <div className="text-red-600 font-semibold">TYPE</div>
            <div className="text-red-600 font-semibold">CREATED AT</div>
            <div className="text-red-600 font-semibold">STATUS</div>
            <div className="text-red-600 font-semibold">TARGET AUDIENCE</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className={`px-4 sm:px-6 py-4 ${
                index % 2 === 0 ? 'bg-red-900' : 'bg-red-800'
              } text-white`}
            >
              {/* Mobile View - Stacked Cards */}
              <div className="block sm:hidden space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Campaign:</span>
                  <span>{campaign.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Type:</span>
                  <span>{campaign.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Created At:</span>
                  <span>{campaign.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                    {campaign.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Target Audience:</span>
                  <span>{campaign.targetAudience}</span>
                </div>
              </div>

              {/* Desktop View - Table Rows */}
              <div className="hidden sm:grid grid-cols-6 gap-4 items-center">
                <div className="font-medium">{campaign.id}</div>
                <div className="font-medium truncate">{campaign.name}</div>
                <div>{campaign.type}</div>
                <div>{campaign.createdAt}</div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                    {campaign.status}
                  </span>
                </div>
                <div>{campaign.targetAudience}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignsDashboard;
