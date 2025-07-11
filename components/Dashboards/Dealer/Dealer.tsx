"use client"

import { useState } from "react"
import { ArrowUpRight, MoreHorizontal, Filter, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import AddUserModal from "./Modals/AddUserModal"

const timeData = [
  { time: "1", value: 65 },
  { time: "2", value: 85 },
  { time: "3", value: 45 },
  { time: "4", value: 75 },
  { time: "5", value: 55 },
  { time: "6", value: 70 },
  { time: "7", value: 60 },
  { time: "8", value: 45 },
]

const salesData = [
  { name: "Monday", value: 45 },
  { name: "Tuesday", value: 75 },
  { name: "Wednesday", value: 105 },
  { name: "Thursday", value: 35 },
  { name: "Friday", value: 124 },
  { name: "Saturday", value: 85 },
  { name: "Sunday", value: 95 },
]

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
]

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <main className="flex-2 space-y-3 p-6">
        <div className="flex gap-4">
          {/* First column with two cards */}
          <div className="w-1/4 space-y-4">
            {/* First Total Members Card */}
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white rounded-3xl border-none shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">Total customers</CardTitle>
                <div className="rounded-full bg-white p-2">
                  <ArrowUpRight className="h-4 w-4 text-[#A80000]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold tracking-tighter">2,521</div>
                <p className="text-sm text-white mt-3">Data per 29 June 2024</p>
              </CardContent>
            </Card>
            {/* Second Total Members Card */}
            <Card className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-3xl border shadow-sm text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">Total Lease</CardTitle>
                <div className="rounded-full bg-gray-100 p-2">
                  <ArrowUpRight className="h-4 w-4 text-[#A80000]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold tracking-tighter">1,802</div>
                <p className="text-sm mt-3">Data per 29 June 2024</p>
              </CardContent>
            </Card>
          </div>
          {/* Second column with time chart */}
          <div className="w-[30%]">
            <Card className="rounded-3xl border shadow-sm h-full bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Average Time Worked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold tracking-tighter mb-6">6:39:32</div>
                <div className="relative">
                  <div className="absolute inset-0 bg-[#FFC8C8] rounded-2xl" />
                  <div className="h-[120px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
                        <Line type="monotone" dataKey="value" stroke="#F91F1F" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-white text-sm font-medium">+1.2%</span>
                  <span className="text-sm">Than yesterday</span>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Third column with bar chart */}
          <div className="w-[55%]">
            <Card className="rounded-3xl border shadow-sm h-full bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Leads by Sales</CardTitle>
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="rounded-full text-[#F91F1F] hover:bg-[white] bg-transparent">
                    This week
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#fff", fontSize: 12 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#fff", fontSize: 12 }}
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
                                  <span className="text-sm font-medium">{payload[0].value}</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        shape={(props: any) => {
                          const isFriday = props.payload.name === "Friday"
                          return (
                            <g>
                              <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FF782F" />
                                  <stop offset="100%" stopColor="#FF782F" />
                                </linearGradient>
                              </defs>
                              <rect
                                {...props}
                                fill={isFriday ? "url(#barGradient)" : "#e8eeff"}
                                fillOpacity={isFriday ? 1 : 0.5}
                              />
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
                          )
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Redesigned Table */}
        <Card className="rounded-3xl border-none shadow-lg bg-gradient-to-br from-[#8B0000] to-[#4A0000] text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-8 py-6">
            <CardTitle className="text-3xl font-bold">Customers</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                className="rounded-full gap-2 bg-white text-red-600 hover:bg-gray-100"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
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
                    <th className="px-8 py-4"></th>
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
          </CardContent>
        </Card>
      </main>

      {/* Add User Modal */}
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
