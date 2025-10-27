"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, RefreshCw, Wrench, AlertCircle } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import AddScheduleRepairModal from "./AddScheduleRepair";
import AssignMechanicModal from "./AssignMechanicModal";

interface Repair {
  id: string;
  createdAt: string;
  priority_level: "HIGH" | "MEDIUM" | "LOW" | "URGENT";
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
  };
  tractor: {
    model_name: string;
  };
  problem_description: string;
  status: string;
  mechanic?: {
    first_name: string;
    last_name: string;
  };
}

const TableSkeleton = () => (
  <tbody>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-red-900/30 animate-pulse">
        {[...Array(9)].map((_, j) => (
          <td key={j} className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-full"></div></td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default function ScheduleTractorRepair() {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [repairList, setRepairList] = useState<Repair[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchRepairs = useCallback(async () => {
    if (!access_token) {
      errorMessage("Access token not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = "/dealer/repair-service";
      console.log(`Attempting to fetch repairs from: ${endpoint}`);

      const res = await renderInstance.get(endpoint, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      console.log(`SUCCESS with ${endpoint}:`, res.data);

      let repairData = [];
      // Handle different possible API response structures
      if (res.data?.repairs && Array.isArray(res.data.repairs)) {
        repairData = res.data.repairs;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        repairData = res.data.data;
      } else if (Array.isArray(res.data)) {
        repairData = res.data;
      }

      setRepairList(repairData);
      
    } catch (err: any) {
      console.error("Failed to fetch repairs:", err.response?.status, err.response?.data);

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to fetch repairs. Please try again.";

      setError(errorMsg);
      setRepairList([]); // Clear list on error

      if (err.response?.status === 404) {
        errorMessage("Repair service endpoint not found. Please contact support.");
      } else if (err.response?.status === 401) {
        errorMessage("Authentication failed. Please login again.");
      } else {
        errorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [access_token]);

  useEffect(() => {
    if (access_token) {
      fetchRepairs();
    }
  }, [access_token, fetchRepairs]);


  // NOTE: I have removed the useEffect hook that fetches the dealerId
  // as it is no longer needed for the fetchRepairs function. If other
  // components or functions rely on it, you may need to re-introduce it.

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    fetchRepairs();
  };

  const handleAssignMechanic = (repair: Repair) => {
    setSelectedRepair(repair);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false);
    setSelectedRepair(null);
    successMessage("Mechanic assigned successfully!");
    fetchRepairs();
  };

  const filteredRepairs = repairList.filter(
    (repair) =>
      repair.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${repair.user?.first_name || ""} ${repair.user?.last_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH": return "bg-orange-500 text-white";
      case "URGENT": return "bg-red-600 text-white";
      case "MEDIUM": return "bg-yellow-500 text-white";
      case "LOW": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "assigned": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Schedule Tractor Repair</h1>
          <div className="rounded-lg p-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Schedule Your Tractor Repairs Without Any Hassle</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                <Calendar size={20} /> Schedule Repair
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold">Error Loading Repairs</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                 <button 
                  onClick={fetchRepairs} 
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Repair History</h2>
            <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search by Repair ID or Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                </div>
                 <button 
                  onClick={fetchRepairs} 
                  disabled={loading} 
                  className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" 
                  title="Refresh list"
                >
                   <RefreshCw size={20} className={loading ? "animate-spin text-red-600" : "text-gray-600"} />
                </button>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr className="text-red-600">
                  {["Repair ID", "Created On", "Priority", "Customer", "Contact", "Tractor", "Issue", "Status", "Action"].map(h => <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>)}
                </tr>
              </thead>
              {loading ? <TableSkeleton /> : (
                <tbody style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}>
                  {filteredRepairs.length > 0 ? (
                    filteredRepairs.map((repair) => (
                      <tr key={repair.id} className="border-b border-red-900/30 hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold text-xs font-mono">{repair.id}</td>
                        <td className="px-6 py-4 text-red-100 text-sm">{new Date(repair.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadgeColor(repair.priority_level)}`}>{repair.priority_level}</span></td>
                        <td className="px-6 py-4 text-white font-semibold text-sm">{`${repair.user?.first_name || ""} ${repair.user?.last_name || ""}`}</td>
                        <td className="px-6 py-4 text-red-100 text-sm">{repair.user?.mobile || "N/A"}</td>
                        <td className="px-6 py-4 text-white text-sm">{repair.tractor?.model_name || "N/A"}</td>
                        <td className="px-6 py-4 text-red-100 text-sm max-w-xs truncate">{repair.problem_description}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(repair.status)}`}>
                            {repair.status}
                          </span>
                          {repair.mechanic && (
                            <div className="text-xs text-red-100 mt-1">
                              {repair.mechanic.first_name} {repair.mechanic.last_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleAssignMechanic(repair)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                          >
                            <Wrench size={16} />
                            {repair.mechanic ? "Reassign" : "Assign"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-gray-500 bg-white">
                        <Calendar size={48} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-lg font-semibold">No repair schedules found.</p>
                        {error ? (
                          <p className="text-sm text-red-500 mt-2">An error occurred while fetching data.</p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-2">Click "Schedule Repair" to create a new request.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
      <AddScheduleRepairModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddSuccess={handleAddSuccess} />
      <AssignMechanicModal 
        isOpen={isAssignModalOpen} 
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRepair(null);
        }} 
        onAssignSuccess={handleAssignSuccess}
        repairId={selectedRepair?.id || ""}
      />
    </div>
  );
}