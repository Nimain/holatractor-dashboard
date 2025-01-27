"use client"

import { ArrowUpRight, MoreHorizontal, Filter, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const timeData = [
  { time: '1', value: 65 },
  { time: '2', value: 85 },
  { time: '3', value: 45 },
  { time: '4', value: 75 },
  { time: '5', value: 55 },
  { time: '6', value: 70 },
  { time: '7', value: 60 },
  { time: '8', value: 45 },
]

const salesData = [
  { name: "Martin", value: 45 },
  { name: "Ausey", value: 75 },
  { name: "Moa", value: 105 },
  { name: "Miya", value: 35 },
  { name: "Friska", value: 124 },
  { name: "Julian", value: 85 },
  { name: "Aedith", value: 95 },
  { name: "Phuan", value: 75 },
  { name: "Chuki", value: 65 },
]

const membersList = [
  {
    id: 1,
    name: "Mariana Girgantui",
    email: "mariannagrgt12@gmail.com",
    title: "765345678",
    lastActive: "Male",
    teams: 69,
    progress: 30
  },
  {
    id: 2,
    name: "Chirst Evandro",
    email: "evandrochst@gmail.com",
    title: "987645678",
    lastActive: "male",
    teams:67,
    progress: 60
  },
  {
    id: 3,
    name: "Martial Vianz",
    email: "martialvl1@gmail.com",
    title: "098756789",
    lastActive: "Male",
    teams: 45,
    progress: 20
  },
  {
    id: 4,
    name: "Zhirkov Martinov",
    email: "zhirkovm00@gmail.com",
    title: "8056789340",
    lastActive: "Male",
    teams: 29,
    progress: 80
  }
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <main className="flex-2 space-y-3 p-6">
      <div className="flex gap-4">
      {/* First column with two cards */}
      <div className="w-1/4 space-y-4">
        {/* First Total Members Card */}
        <Card className="bg-gradient-to-br from-[#4361ee] to-[#3f37c9] text-white rounded-3xl border-none shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Total customers</CardTitle>
            <div className="rounded-full bg-white/20 p-2">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">2,521</div>
            <p className="text-sm text-white/70 mt-3">
              Data per 29 June 2024
            </p>
          </CardContent>
        </Card>

        {/* Second Total Members Card */}
        <Card className="bg-white rounded-3xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-normal">Total Lease</CardTitle>
            <div className="rounded-full bg-gray-100 p-2">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">1,802</div>
            <p className="text-sm text-gray-500 mt-3">
              Data per 29 June 2024
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second column with time chart */}
      <div className="w-[30%]">
        <Card className="rounded-3xl border shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Average Time Worked</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter mb-6">6:39:32</div>
            <div className="relative">
              <div className="absolute inset-0 bg-pink-50/30 rounded-2xl" />
              <div className="h-[120px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ff0080" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-rose-500 text-sm font-medium">+1.2%</span>
              <span className="text-sm text-gray-500">Than yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third column with bar chart */}
      <div className="w-[55%]">
        <Card className="rounded-3xl border shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Leads by Sales</CardTitle>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="rounded-full">
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
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12 }}
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
                      const isFriska = props.payload.name === 'Friska';
                      return (
                        <g>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                          </defs>
                          <rect
                            {...props}
                            fill={isFriska ? 'url(#barGradient)' : '#e8eeff'}
                            fillOpacity={isFriska ? 1 : 0.5}
                          />
                          {isFriska && (
                            <text
                              x={props.x + props.width / 2}
                              y={props.y - 10}
                              fill="#4361ee"
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






        {/* Full width table */}
        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-semibold">Customers</CardTitle>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="rounded-full gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Task Progress</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Mobile</th>
                    <th className="px-4 py-3 text-left"> Gender</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left"></th>

                  </tr>
                </thead>
                <tbody>
                  {membersList.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="px-4 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                        {member.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${member.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">{member.email}</td>
                      <td className="px-4 py-4">{member.title}</td>
                      <td className="px-4 py-4 text-gray-500">{member.lastActive}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                         
                            <span
                           
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                              {member.teams}
                            </span>
                          
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500">Active</td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}