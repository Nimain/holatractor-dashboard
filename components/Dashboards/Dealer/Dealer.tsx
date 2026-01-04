"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, MoreHorizontal, Filter, Plus, X } from "lucide-react";
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

// Types
interface Customer {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  lineage?: string;
  status?: string;
  createdAt?: string;
}

interface DashboardStats {
  totalCustomers: number;
  dataAsOf?: string;
}

interface TotalLease {
  totalLease: number;
  dataAsOf?: string;
}

interface LeadBySale {
  day: string;
  count: number;
  label?: string;
}

interface NewUserForm {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  gender: string;
  lineage: string;
  status: string;
}

// API Configuration
const API_BASE_URL = "https://holatractor-backend-render.onrender.com";

// Function to get token from localStorage or cookies
const getAuthToken = () => {
  let token = localStorage.getItem('access_token') || 
              localStorage.getItem('token') || 
              localStorage.getItem('authToken');
  
  if (!token) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return decodeURIComponent(value);
      }
    }
  }
  
  return token;
};

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

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [totalLease, setTotalLease] = useState<TotalLease | null>(null);
  const [leadsBySales, setLeadsBySales] = useState<LeadBySale[]>([]);
  const [weekRange, setWeekRange] = useState<string>("This week");
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [newUser, setNewUser] = useState<NewUserForm>({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "",
    lineage: "",
    status: "Active"
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log("Fetching dashboard data...");
      
      const [statsRes, leaseRes, leadsRes, customersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dealer/customers/dashboard-stats`, { headers }),
        fetch(`${API_BASE_URL}/dealer/customers/total-lease`, { headers }),
        fetch(`${API_BASE_URL}/dealer/customers/leads-by-sales`, { headers }),
        fetch(`${API_BASE_URL}/dealer/customers/all`, { headers })
      ]);

      console.log("Response statuses:", {
        stats: statsRes.status,
        lease: leaseRes.status,
        leads: leadsRes.status,
        customers: customersRes.status
      });

      if (statsRes.status === 401 || leaseRes.status === 401 || 
          leadsRes.status === 401 || customersRes.status === 401) {
        setError("Authentication failed. Please log in again.");
        setLoading(false);
        return;
      }

      const stats = await statsRes.json();
      const lease = await leaseRes.json();
      const leads = await leadsRes.json();
      const customersData = await customersRes.json();

      console.log("API Responses:", { stats, lease, leads, customersData });

      const customersList = customersData?.customers || customersData?.data || customersData?.customersData?.customers || [];
      console.log("Parsed customersList length:", customersList.length);

      let totalCustomers = 0;
      let customersDataAsOf = "Data per " + new Date().toLocaleDateString();
      
      if (customersList.length > 0) {
        totalCustomers = customersList.length;
        customersDataAsOf = "Data per " + new Date().toLocaleDateString();
      } else if (stats?.stats?.totalCustomers !== undefined && stats.stats.totalCustomers > 0) {
        totalCustomers = stats.stats.totalCustomers;
        customersDataAsOf = stats.stats.dataAsOf || customersDataAsOf;
      } else if (stats?.totalCustomers !== undefined && stats.totalCustomers > 0) {
        totalCustomers = stats.totalCustomers;
        customersDataAsOf = stats.dataAsOf || customersDataAsOf;
      } else if (customersData?.pagination?.total) {
        totalCustomers = customersData.pagination.total;
      }
      
      console.log("Final totalCustomers:", totalCustomers);
      
      let totalLeaseCount = 0;
      let leaseDataAsOf = new Date().toLocaleDateString();
      
      if (lease?.lease?.totalLease !== undefined && lease.lease.totalLease !== 0) {
        totalLeaseCount = lease.lease.totalLease;
        leaseDataAsOf = lease.lease.dataAsOf || leaseDataAsOf;
      } else if (lease?.totalLease !== undefined && lease.totalLease !== 0) {
        totalLeaseCount = lease.totalLease;
        leaseDataAsOf = lease.dataAsOf || leaseDataAsOf;
      } else if (lease?.leaseData?.totalLease !== undefined && lease.leaseData.totalLease !== 0) {
        totalLeaseCount = lease.leaseData.totalLease;
        leaseDataAsOf = lease.leaseData.dataAsOf || leaseDataAsOf;
      } else if (customersList.length > 0) {
        totalLeaseCount = customersList.filter((customer: any) => 
          customer.status === "Active" || customer.lease || customer.hasLease
        ).length;
      }
      
      console.log("Final totalLease:", totalLeaseCount);
      
      let leadsSalesData: LeadBySale[] = [];
      let weekRanges = null;
      
      if (leads?.leads?.leadsBySales) {
        leadsSalesData = leads.leads.leadsBySales;
        weekRanges = leads.leads.weekRanges;
      } else if (leads?.leadsBySales) {
        leadsSalesData = leads.leadsBySales;
        weekRanges = leads.weekRanges;
      } else if (leads?.leadsData?.leadsBySales) {
        leadsSalesData = leads.leadsData.leadsBySales;
        weekRanges = leads.leadsData.weekRanges;
      }
      
      console.log("Final leadsBySales count:", leadsSalesData.length);

      setDashboardStats({
        totalCustomers: totalCustomers,
        dataAsOf: customersDataAsOf
      });
      
      setTotalLease({
        totalLease: totalLeaseCount,
        dataAsOf: leaseDataAsOf
      });
      
      setLeadsBySales(Array.isArray(leadsSalesData) ? leadsSalesData : []);
      setCustomers(Array.isArray(customersList) ? customersList : []);
      
      if (weekRanges?.start && weekRanges?.end) {
        const startDate = new Date(weekRanges.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = new Date(weekRanges.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        setWeekRange(`${startDate} - ${endDate}`);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newUser.first_name.trim()) {
      setError("First name is required");
      return false;
    }
    if (!newUser.last_name.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!newUser.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!newUser.mobile.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!/^\d{10}$/.test(newUser.mobile.replace(/\D/g, ''))) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    return true;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/dealer/customers/all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add user');
      }

      console.log("User added successfully:", data);
      
      setSuccessMessage("User added successfully!");
      
      // Reset form
      setNewUser({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "",
        lineage: "",
        status: "Active"
      });

      // Refresh dashboard data
      await fetchDashboardData();

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage(null);
      }, 1500);

    } catch (err: any) {
      console.error("Error adding user:", err);
      setError(err.message || "Failed to add user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccessMessage(null);
    setNewUser({
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      gender: "",
      lineage: "",
      status: "Active"
    });
  };

  const salesChartData = Array.isArray(leadsBySales) ? leadsBySales.map(item => ({
    name: item.day,
    value: item.count
  })) : [];

  const maxLeadDay = Array.isArray(leadsBySales) && leadsBySales.length > 0
    ? leadsBySales.reduce((max, item) => 
        item.count > (max?.count || 0) ? item : max, 
        leadsBySales[0]
      )
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !isModalOpen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  {dashboardStats?.totalCustomers?.toLocaleString() || 0}
                </div>
                <p className="text-xs md:text-sm text-white mt-2">
                  {dashboardStats?.dataAsOf || "Data loading..."}
                </p>
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
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  {totalLease?.totalLease?.toLocaleString() || 0}
                </div>
                <p className="text-xs md:text-sm text-white mt-2">
                  {totalLease?.dataAsOf || "Data loading..."}
                </p>
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
                  {weekRange}
                </Button>
                <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesChartData.length > 0 ? (
                <div className="h-[220px] md:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData} barGap={8} margin={{ bottom: 20 }}>
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
                          const isMaxDay = maxLeadDay && props.payload.name === maxLeadDay.day;
                          return (
                            <g>
                              <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FF782F" />
                                  <stop offset="100%" stopColor="#FF782F" />
                                </linearGradient>
                              </defs>
                              <rect {...props} fill={isMaxDay ? "url(#barGradient)" : "#ffffff40"} fillOpacity={1} />
                              {isMaxDay && (
                                <text
                                  x={props.x + props.width / 2}
                                  y={props.y - 10}
                                  fill="#FF782F"
                                  textAnchor="middle"
                                  fontSize={12}
                                  fontWeight={600}
                                >
                                  {props.payload.value}
                                </text>
                              )}
                            </g>
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] md:h-[260px] flex items-center justify-center">
                  <p className="text-white/60">No sales data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
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
                  {customers.map((customer, index) => (
                    <tr
                      key={customer._id || index}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                        index === customers.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            {customer.first_name?.[0] || customer.last_name?.[0] || "?"}
                          </div>
                          <span className="text-white font-medium text-lg">
                            {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="w-40 h-3 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FF4444] to-[#FF6B6B] rounded-full transition-all duration-300"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-6 text-white/90">{customer.email || "N/A"}</td>
                      <td className="px-4 py-6 text-white/90">{customer.mobile || "N/A"}</td>
                      <td className="px-4 py-6 text-white/90">{customer.gender || "N/A"}</td>
                      <td className="px-4 py-6">
                        <span className="text-white/90 font-medium">{customer.lineage || "N/A"}</span>
                      </td>
                      <td className="px-4 py-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          customer.status === "Active" ? "bg-green-500/20 text-green-200" : "bg-gray-500/20 text-gray-200"
                        }`}>
                          {customer.status || "Active"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <Button
                          aria-label={`More options for ${customer.first_name}`}
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

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3 px-3 md:px-4">
              {customers.map((customer, index) => (
                <div
                  key={customer._id || index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                        {customer.first_name?.[0] || customer.last_name?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm md:text-base truncate">
                          {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Unknown"}
                        </h3>
                        <p className="text-white/70 text-xs md:text-sm truncate">{customer.email || "N/A"}</p>
                      </div>
                    </div>
                    <Button
                      aria-label={`More options for ${customer.first_name}`}
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
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <p className="text-white/60 text-xs">Mobile</p>
                          <p className="text-white text-sm font-medium">{customer.mobile || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Gender</p>
                          <p className="text-white text-sm font-medium">{customer.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Age</p>
                          <p className="text-white text-sm font-medium">{customer.lineage || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Status</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.status === "Active" ? "bg-green-500/20 text-green-200" : "bg-gray-500/20 text-gray-200"
                          }`}>
                            {customer.status || "Active"}
                          </span>
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white p-6 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Add New User</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={newUser.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={newUser.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={newUser.mobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="1234567890"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={newUser.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age/Lineage
                  </label>
                  <input
                    type="text"
                    name="lineage"
                    value={newUser.lineage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter age"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={newUser.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1 py-2.5 rounded-lg border-gray-300 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] hover:from-[#8B0000] hover:to-[#2B0000] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    "Add User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}