"use client";
import { useState, useEffect } from "react";
import { Search, Plus, User, RefreshCw } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import AddMechanicModal from "./AddMechanics";

interface ApiMechanic {
  id: string;
  specialization: string[];
  experience_years: number;
  Status: number;
  user: {
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    image?: string;
  };
}

const TableSkeleton = () => (
  <tbody>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-200 animate-pulse">
        <td className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-24 sm:w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
            </div>
          </div>
        </td>
        <td className="hidden lg:table-cell px-6 py-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </td>
        <td className="hidden md:table-cell px-4 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 sm:w-48"></div></td>
        <td className="hidden sm:table-cell px-4 sm:px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12 sm:w-16"></div></td>
        <td className="px-4 sm:px-6 py-4"><div className="h-8 bg-gray-200 rounded-full w-20 sm:w-24"></div></td>
      </tr>
    ))}
  </tbody>
);

export default function Mechanics() {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [mechanicList, setMechanicList] = useState<ApiMechanic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMechanics = () => {
    if (!access_token) {
      errorMessage("Access token not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    renderInstance
      .get("/dealer/mechanic", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then((res) => {
        const mechanicsData = res.data?.mechanics || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setMechanicList(Array.isArray(mechanicsData) ? mechanicsData : []);
      })
      .catch((err) => {
        errorMessage("Failed to fetch mechanics");
        setMechanicList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMechanics();
  }, [access_token]);

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    fetchMechanics();
  };

  const filteredMechanics = mechanicList.filter(
    (mechanic) =>
      mechanic.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${mechanic.user?.first_name || ''} ${mechanic.user?.last_name || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      mechanic.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusString = (status: number) => (status === 1 ? "Active" : "Inactive");

  const getStatusBadgeColor = (status: number) => {
    return status === 1
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-gray-200 text-gray-800 border border-gray-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">Mechanic Management</h1>
          <div
            className="rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
            style={{ background: `linear-gradient(135deg, #A10A0C 0%, #3B0404 100%)` }}
          >
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Manage Your Mechanics Efficiently</h2>
              <p className="text-red-100 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">Add, track, and manage your mechanic workforce</p>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} className="sm:w-5 sm:h-5" /> Add New Mechanic
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white opacity-5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
          </div>
        </div>

        {/* Search and Refresh Section */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">All Mechanics</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">{mechanicList.length} mechanic{mechanicList.length !== 1 ? "s" : ""} total</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-64 md:w-80">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by ID, name, or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm text-sm sm:text-base"
              />
            </div>
            <button
              onClick={fetchMechanics}
              disabled={loading}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0"
              title="Refresh list"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Table Container - Desktop and Tablet */}
        <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="pl-8 md:pl-16 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Mechanic</th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Contact</th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Specialization</th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Experience</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              {loading ? <TableSkeleton /> : (
                <tbody className="bg-gradient-to-r from-[#A10A0C] to-[#3B0404]">
                  {filteredMechanics.length > 0 ? (
                    filteredMechanics.map((mech) => (
                      <tr key={mech.id} className="hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                              {mech.user?.image ? (
                                <img src={mech.user.image} alt={`${mech.user.first_name} ${mech.user.last_name}`} className="w-full h-full object-cover rounded-full border-2 border-gray-200" />
                              ) : (
                                <span className="flex items-center justify-center w-full h-full bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full font-semibold text-sm sm:text-lg">
                                  {(mech.user?.first_name?.[0] || 'M').toUpperCase()}
                                  {(mech.user?.last_name?.[0] || '').toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-bold text-white truncate">{mech.user?.first_name || 'N/A'} {mech.user?.last_name || ''}</div>
                              <div className="text-xs text-white font-mono">ID: {mech.id || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-white">{mech.user?.mobile || 'N/A'}</div>
                          <div className="text-xs text-white truncate max-w-[200px]">{mech.user?.email || 'N/A'}</div>
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mech.specialization?.length > 0 ? (
                              mech.specialization.slice(0, 2).map((spec, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/10 text-white">{spec}</span>
                              ))
                            ) : (
                              <span className="text-xs sm:text-sm text-gray-100">No specialization</span>
                            )}
                            {mech.specialization?.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">+{mech.specialization.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-semibold text-white">{mech.experience_years || 0} years</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(mech.Status)}`}>{getStatusString(mech.Status)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 sm:py-16">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={24} className="sm:w-8 sm:h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium text-sm sm:text-base">No mechanics found</p>
                          {searchTerm && <p className="text-xs sm:text-sm text-gray-400">Try adjusting your search criteria</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>

        {/* Card View - Mobile Only */}
        <div className="sm:hidden space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : filteredMechanics.length > 0 ? (
            filteredMechanics.map((mech) => (
              <div
                key={mech.id}
                className="bg-gradient-to-r from-[#A10A0C] to-[#3B0404] rounded-xl shadow-lg p-4 text-white"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {mech.user?.image ? (
                      <img src={mech.user.image} alt={`${mech.user.first_name} ${mech.user.last_name}`} className="w-12 h-12 object-cover rounded-full border-2 border-white/20" />
                    ) : (
                      <span className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full font-semibold text-lg border-2 border-white/20">
                        {(mech.user?.first_name?.[0] || 'M').toUpperCase()}
                        {(mech.user?.last_name?.[0] || '').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{mech.user?.first_name || 'N/A'} {mech.user?.last_name || ''}</div>
                    <div className="text-xs font-mono opacity-90">ID: {mech.id || 'Unknown'}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusBadgeColor(mech.Status)}`}>
                    {getStatusString(mech.Status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="opacity-75 text-xs">Mobile:</span>
                    <span className="font-medium">{mech.user?.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-75 text-xs">Email:</span>
                    <span className="font-medium text-xs truncate">{mech.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-75 text-xs">Experience:</span>
                    <span className="font-semibold">{mech.experience_years || 0} years</span>
                  </div>
                  {mech.specialization?.length > 0 && (
                    <div className="pt-2">
                      <span className="opacity-75 text-xs block mb-1">Specialization:</span>
                      <div className="flex flex-wrap gap-1">
                        {mech.specialization.slice(0, 3).map((spec, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/10">
                            {spec}
                          </span>
                        ))}
                        {mech.specialization.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/20">
                            +{mech.specialization.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No mechanics found</p>
                {searchTerm && <p className="text-sm text-gray-400">Try adjusting your search criteria</p>}
              </div>
            </div>
          )}
        </div>

        <AddMechanicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddSuccess={handleAddSuccess} />
      </div>
    </div>
  );
}