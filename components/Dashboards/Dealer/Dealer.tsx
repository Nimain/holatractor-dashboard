"use client";

import { useState } from "react";
import { ArrowUpRight, MoreHorizontal, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AddUserModal from "./Modals/AddUserModal";

// --- Mock Data --------------------------------------------------------------
const timeData = [
  { time: "1", value: 65 },
  { time: "2", value: 85 },
  { time: "3", value: 45 },
  { time: "4", value: 75 },
  { time: "5", value: 55 },
  { time: "6", value: 70 },
  { time: "7", value: 60 },
  { time: "8", value: 45 },
];

const salesData = [
  { name: "Sunday", value: 95 },
  { name: "Monday", value: 45 },
  { name: "Tuesday", value: 75 },
  { name: "Wednesday", value: 105 },
  { name: "Thursday", value: 35 },
  { name: "Friday", value: 124 },
  { name: "Saturday", value: 85 },
];

const membersList = [
  {
    id: 1,
    name: "Monday Schedule",
    email: "monday.schedule@company.com",
    title: "765435262",
    lastActive: "Active",
    teams: 66,
    progress: 75,
    initial: "M",
  },
  {
    id: 2,
    name: "Tuesday Planning",
    email: "tuesday.plan@company.com",
    title: "987645678",
    lastActive: "Active",
    teams: 67,
    progress: 60,
    initial: "T",
  },
  {
    id: 3,
    name: "Wednesday Review",
    email: "wednesday.review@company.com",
    title: "098756789",
    lastActive: "Active",
    teams: 45,
    progress: 45,
    initial: "W",
  },
  {
    id: 4,
    name: "Thursday Meeting",
    email: "thursday.meet@company.com",
    title: "805678934",
    lastActive: "Active",
    teams: 29,
    progress: 30,
    initial: "T",
  },
  {
    id: 5,
    name: "Friday Delivery",
    email: "friday.delivery@company.com",
    title: "123456789",
    lastActive: "Active",
    teams: 52,
    progress: 85,
    initial: "F",
  },
];

// --- Component --------------------------------------------------------------
export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <main className="flex-2 space-y-4 p-4 md:p-6 lg:p-8">
        {/* Top Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Left stack (Total Customers + Total Lease) */}
          <div className="grid grid-cols-1 gap-4">
            {/* Total Customers */}
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white rounded-2xl md:rounded-3xl border-none shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm md:text-base font-normal">Total Customers</CardTitle>
                <div className="rounded-full bg-white p-1.5 md:p-2">
                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-[#A80000]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">2,521</div>
                <p className="text-xs md:text-sm text-white mt-2">Data per 29 June 2024</p>
              </CardContent>
            </Card>

            {/* Total Lease */}
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white rounded-2xl md:rounded-3xl border-none shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm md:text-base font-normal">Total Lease</CardTitle>
                <div className="rounded-full bg-white p-1.5 md:p-2">
                  <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-[#A80000]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">1,802</div>
                <p className="text-xs md:text-sm text-white mt-2">Data per 29 June 2024</p>
              </CardContent>
            </Card>
          </div>

          {/* Average Time Worked */}
          <Card className="md:col-span-1 xl:col-span-1 rounded-2xl md:rounded-3xl border shadow-sm bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base md:text-lg lg:text-xl font-medium">Average Time Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-4">6:39:32</div>
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFC8C8] rounded-xl md:rounded-2xl" />
                <div className="h-[120px] md:h-[140px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
                      <Line type="monotone" dataKey="value" stroke="#F91F1F" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-white text-xs md:text-sm font-medium">+1.2%</span>
                <span className="text-xs md:text-sm">Than yesterday</span>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Sales */}
          <Card className="md:col-span-2 xl:col-span-2 rounded-2xl md:rounded-3xl border shadow-sm bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-2">
              <CardTitle className="text-base md:text-lg lg:text-xl font-semibold">Leads by Sales</CardTitle>
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  aria-label="This week filter"
                  variant="outline"
                  className="rounded-full text-xs md:text-sm text-[#F91F1F] hover:bg-white bg-transparent px-3 h-8 border-white/30"
                >
                  This week
                </Button>
                <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] md:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} barGap={8} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff20" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff", fontSize: 10, fontWeight: 500 }}
                      interval={0}
                      angle={0}
                      textAnchor="middle"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff80", fontSize: 10 }}
                      domain={[0, 140]}
                      ticks={[0, 20, 40, 60, 80, 100, 120, 140]}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-white p-2 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{payload[0].value}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      shape={(props: any) => {
                        const isFriday = props.payload.name === "Friday";
                        return (
                          <g>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF782F" />
                                <stop offset="100%" stopColor="#FF782F" />
                              </linearGradient>
                            </defs>
                            <rect {...props} fill={isFriday ? "url(#barGradient)" : "#ffffff40"} fillOpacity={1} />
                            {isFriday && (
                              <text
                                x={props.x + props.width / 2}
                                y={props.y - 10}
                                fill="#FF782F"
                                textAnchor="middle"
                                fontSize={12}
                                fontWeight={600}
                              >
                                124
                              </text>
                            )}
                          </g>
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table / Cards */}
        <Card className="rounded-2xl md:rounded-3xl border-none shadow-lg bg-gradient-to-br from-[#8B0000] to-[#4A0000] text-white overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <CardTitle className="text-2xl md:text-3xl font-bold">Customers</CardTitle>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
              <Button
                aria-label="Open filters"
                variant="outline"
                className="flex-1 md:flex-none rounded-full gap-2 border-white/30 text-white hover:bg-white/10 bg-transparent text-xs md:text-sm h-9"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                aria-label="Add user"
                className="flex-1 md:flex-none rounded-full gap-2 bg-white text-red-600 hover:bg-gray-100 text-xs md:text-sm h-9"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {/* Desktop Table (lg and up) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-8 py-4 text-left text-white font-semibold">Name</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Task Progress</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Email</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Mobile</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Gender</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Age</th>
                    <th className="px-4 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-8 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {membersList.map((member, index) => (
                    <tr
                      key={member.id}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                        index === membersList.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            {member.initial}
                          </div>
                          <span className="text-white font-medium text-lg">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="w-40 h-3 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FF4444] to-[#FF6B6B] rounded-full transition-all duration-300"
                            style={{ width: `${member.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-6 text-white/90">{member.email}</td>
                      <td className="px-4 py-6 text-white/90">{member.title}</td>
                      <td className="px-4 py-6 text-white/90">Male</td>
                      <td className="px-4 py-6">
                        <span className="text-white/90 font-medium">{member.teams}</span>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-white font-medium">{member.lastActive}</span>
                      </td>
                      <td className="px-8 py-6">
                        <Button
                          aria-label={`More options for ${member.name}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards (shown below lg) */}
            <div className="lg:hidden space-y-3 px-3 md:px-4">
              {membersList.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {member.initial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm md:text-base truncate">{member.name}</h3>
                        <p className="text-white/70 text-xs md:text-sm truncate">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      aria-label={`More options for ${member.name}`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Task Progress</p>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF4444] to-[#FF6B6B] rounded-full transition-all duration-300"
                          style={{ width: `${member.progress}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-white/60 text-xs">Mobile</p>
                          <p className="text-white text-sm font-medium">{member.title}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Gender</p>
                          <p className="text-white text-sm font-medium">Male</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Age</p>
                          <p className="text-white text-sm font-medium">{member.teams}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Status</p>
                          <p className="text-white text-sm font-medium">{member.lastActive}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add User Modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
