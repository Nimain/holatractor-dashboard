"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Score Distribution Data
const scoreData = [
  { date: "05 Dec", score: 1 },
  { date: "06 Dec", score: 3 },
  { date: "07 Dec", score: 2 },
  { date: "08 Dec", score: 4 },
  { date: "09 Dec", score: 5 },
  { date: "10 Dec", score: 4 },
  { date: "11 Dec", score: 3 },
];

// Pie Chart Data - matching exact colors from image
const pieData = [
  { name: "Mariana Girgantui", value: 34, color: "#6366F1" }, // Purple/Blue
  { name: "Jane Austin", value: 34, color: "#EAB308" }, // Yellow
  { name: "Christ Evandro", value: 34, color: "#F97316" }, // Orange
  { name: "Mariana Girgantui", value: 34, color: "#10B981" }, // Green
];

// Customer Table Data
const customerData = [
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
  {
    name: "Mariana Girgantui",
    performance: "34% of Total",
    totalLeads: 56,
    totalPurchase: 24,
    totalLease: 17,
    totalRepair: 15,
  },
];

export default function LeadsDashboard() {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] p-3">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Leads */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full bg-white/90 hover:bg-white p-0 -mt-1"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-700" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-[2.75rem] font-bold leading-none mb-2">12,000</div>
              <p className="text-xs text-green-400 font-medium">+15% vs last month</p>
            </CardContent>
          </Card>

          {/* High Potential Leads */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">High Potential Leads</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full bg-white/90 hover:bg-white p-0 -mt-1"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-700" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-[2.75rem] font-bold leading-none mb-2">12,000</div>
              <p className="text-xs text-red-400 font-medium">-15% vs last month</p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full bg-white/90 hover:bg-white p-0 -mt-1"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-700" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-[2.75rem] font-bold leading-none mb-2">8.5%</div>
              <p className="text-xs text-green-400 font-medium">+15% vs last month</p>
            </CardContent>
          </Card>

          {/* Machinery Active */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium">Machinery Active</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full bg-white/90 hover:bg-white p-0 -mt-1"
              >
                <HelpCircle className="h-3.5 w-3.5 text-gray-700" />
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-[2.75rem] font-bold leading-none mb-2">32</div>
              <p className="text-xs text-green-400 font-medium">+15% vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Score Distribution */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-6">
              <CardTitle className="text-xl font-bold">Score Distribution</CardTitle>
              <Button
                variant="outline"
                className="rounded-full text-xs px-4 h-8 border-white/40 text-white hover:bg-white/10 bg-transparent font-medium"
              >
                This Week
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <div className="h-[280px] relative">
                {/* Date tooltip */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-3 py-1.5 rounded-md text-[11px] shadow-lg z-10 border border-gray-200">
                  <div className="font-medium">Wed: 09 Dec 2025</div>
                  <div className="font-bold">Total Score <span className="float-right ml-3">12</span></div>
                </div>
                
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} margin={{ top: 50, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff15" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff", fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff90", fontSize: 11 }}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <Bar
                      dataKey="score"
                      radius={[6, 6, 0, 0]}
                      barSize={35}
                      shape={(props: any) => {
                        const isHighlighted = props.payload.date === "09 Dec";
                        return (
                          <rect
                            {...props}
                            fill={isHighlighted ? "#FB923C" : "#ffffff50"}
                            fillOpacity={1}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads Overview */}
          <Card className="bg-gradient-to-br from-[#9B1C1C] via-[#7F1D1D] to-[#450A0A] text-white border-none rounded-xl shadow-md">
            <CardHeader className="pb-3 pt-5 px-6">
              <CardTitle className="text-xl font-bold">Leads Overview</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="h-[280px] w-[280px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3.5 flex-1">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-white font-medium text-[13px] leading-tight">{entry.name}</div>
                        <div className="text-white/80 text-[11px] leading-tight">{entry.value}% of Total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card className="bg-white border-2 border-blue-400 rounded-xl shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Customer Name
                    </th>
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Performance
                    </th>
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Total Leads
                    </th>
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Total Purchase Lead
                    </th>
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Total Lease Leads
                    </th>
                    <th className="px-5 py-3.5 text-left text-[#DC2626] font-semibold text-sm border-b border-gray-200">
                      Total Repair Leads
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customerData.map((customer, index) => (
                    <tr
                      key={index}
                      className="bg-gradient-to-r from-[#991B1B] to-[#7F1D1D] text-white"
                    >
                      <td className="px-5 py-4 font-medium text-sm border-b border-white/10">{customer.name}</td>
                      <td className="px-5 py-4 text-sm border-b border-white/10">{customer.performance}</td>
                      <td className="px-5 py-4 text-sm text-center border-b border-white/10">{customer.totalLeads}</td>
                      <td className="px-5 py-4 text-sm text-center border-b border-white/10">{customer.totalPurchase}</td>
                      <td className="px-5 py-4 text-sm text-center border-b border-white/10">{customer.totalLease}</td>
                      <td className="px-5 py-4 text-sm text-center border-b border-white/10">{customer.totalRepair}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}