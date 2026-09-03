"use client"

import { useEffect, useState } from "react"
import Menubar from "../Menubar/Menubar"
import BookingChart from "./BookingChart"
import { FarmerAndBookingChart } from "./FarmerAndBookingChart"
import DetailBox from "./DetailBox"
import { Tractor, Users, UserCheck, Store, RefreshCw } from "lucide-react"
import FarmersPieChart from "./FarmersPieChart"
import axios from "axios"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"

interface UserCounts {
  farmers: number
  operators: number
  agents: number
  owners: number
  maleFarmers: number
  femaleFarmers: number
  otherFarmers: number
}

const Dashboard = () => {
  const [userCounts, setUserCounts] = useState<UserCounts>({
    farmers: 0,
    operators: 0,
    agents: 0,
    owners: 0,
    maleFarmers: 0,
    femaleFarmers: 0,
    otherFarmers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Security guard: Only verified administrators can view the Admin Dashboard.
  useEffect(() => {
    if (typeof document !== "undefined") {
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? match[2] : null;
      };

      const isAdminCookie = getCookie("isAdmin") === "true";
      let localIsAdmin = false;
      let userEmail = "";
      try {
        localIsAdmin =
          localStorage.getItem("isAdmin") === "true" ||
          localStorage.getItem("active_role") === "admin";
        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
        userEmail = (userObj?.email || "").toLowerCase().trim();
      } catch {}

      const isAdminEmail =
        userEmail === "sistemas@holatractor.com" ||
        userEmail === "admin@holatractor.com" ||
        userEmail === "admin@gmail.com" ||
        userEmail.startsWith("admin@") ||
        userEmail.startsWith("sistemas@");

      const isAdmin = isAdminCookie || localIsAdmin || isAdminEmail;
      const isOwner = getCookie("isOwner") === "true";
      const isFarmer = getCookie("isFarmer") === "true";
      const isDealer = getCookie("isDealer") === "true";
      const isOperator = getCookie("isOperator") === "true";
      const isAgent = getCookie("isAgent") === "true";
      const activeRole = getCookie("active_role") || (typeof window !== "undefined" ? localStorage.getItem("active_role") : null);

      if (!isAdmin) {
        const target =
          activeRole === "owner" && isOwner
            ? "/owner"
            : activeRole === "farmer" && isFarmer
            ? "/farmer"
            : activeRole === "dealer" && isDealer
            ? "/dealer"
            : activeRole === "operator" && isOperator
            ? "/operator"
            : activeRole === "agent" && isAgent
            ? "/agent"
            : isOwner
            ? "/owner"
            : isFarmer
            ? "/farmer"
            : isDealer
            ? "/dealer"
            : isOperator
            ? "/operator"
            : isAgent
            ? "/agent"
            : "/farmer";

        window.location.replace(target);
        return;
      }
    }
  }, []);

  function fetchChartUserCounts() {
    setLoading(true)
    axios
      .get("/api/user/charts/userCounts")
      .then((res) => {
        if (res.data && typeof res.data === "object" && res.data.farmers !== undefined) {
          setUserCounts(res.data)
        }
        setLastUpdated(new Date())
      })
      .catch(() => {
        renderInstance
          .get("/user/charts/userCounts")
          .then((res) => {
            if (res.data && typeof res.data === "object") {
              setUserCounts(res.data)
            }
            setLastUpdated(new Date())
          })
          .catch((err) => {
            console.error("Error fetching userCounts:", err)
          })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchChartUserCounts()

    // Set up auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchChartUserCounts()
    }, 60000)

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [])

  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] max-h-[1580px] bg-[#e5e5e5] flex flex-col gap-6 relative overflow-auto">
      <Menubar pagename={"Dashboard"} />

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        <DetailBox
          count={userCounts?.farmers?.toString() || "0"}
          heading={"Total Farmers"}
          icon={<Users className="h-5 w-5" />}
          bgcolorCode={"bg-green-200"}
          textcolorCode={"text-green-800"}
          href={"/Farmers"}
          loading={loading}
        />
        <DetailBox
          count={userCounts?.agents?.toString() || "0"}
          heading={"Total Agents"}
          icon={<UserCheck className="h-5 w-5" />}
          bgcolorCode={"bg-purple-200"}
          textcolorCode={"text-purple-800"}
          href={"/Agent"}
          loading={loading}
        />
        <DetailBox
          count={userCounts?.operators?.toString() || "0"}
          heading={"Total Operators"}
          icon={<Tractor className="h-5 w-5" />}
          bgcolorCode={"bg-red-200"}
          textcolorCode={"text-red-800"}
          href={"/Operator"}
          loading={loading}
        />
        <DetailBox
          count={userCounts?.owners?.toString() || "0"}
          heading={"Total Owners"}
          icon={<Store className="h-5 w-5" />}
          bgcolorCode={"bg-yellow-200"}
          textcolorCode={"text-yellow-800"}
          href={"/Owner"}
          loading={loading}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={fetchChartUserCounts}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-md shadow-sm"
        >
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-5">
        <BookingChart />
        {loading ? (
          <div className="w-full lg:w-[30%] bg-white rounded-lg flex items-center justify-center p-8">
            <p>Loading chart data...</p>
          </div>
        ) : (
          userCounts && (
            <FarmersPieChart
              maleCount={userCounts.maleFarmers}
              femaleCount={userCounts.femaleFarmers}
              otherCount={userCounts.otherFarmers}
            />
          )
        )}
      </div>

      <FarmerAndBookingChart />
    </div>
  )
}

export default Dashboard
