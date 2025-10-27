"use client";
import React, { useState, useEffect } from "react";
import { X, Wrench, User, Phone, CheckCircle, Loader2 } from "lucide-react";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface AssignMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignSuccess: () => void;
  repairId: string;
}

interface Mechanic {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  specialization?: string;
  status?: string;
}

export default function AssignMechanicModal({ 
  isOpen, 
  onClose, 
  onAssignSuccess, 
  repairId 
}: AssignMechanicModalProps) {
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingMechanics, setFetchingMechanics] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && access_token) {
      fetchMechanics();
    }
  }, [isOpen, access_token]);

  const fetchMechanics = () => {
    setFetchingMechanics(true);
    renderInstance
      .get("/dealer/mechanic", { 
        headers: { Authorization: `Bearer ${access_token}` } 
      })
      .then((res) => {
        console.log("Mechanics Response:", res.data);
        const mechanicsData = res.data?.mechanics || (Array.isArray(res.data) ? res.data : []);
        setMechanics(mechanicsData);
      })
      .catch((error) => {
        console.error("Fetch Mechanics Error:", error.response?.data || error.message);
        errorMessage(error.response?.data?.message || "Failed to fetch mechanics");
        setMechanics([]);
      })
      .finally(() => setFetchingMechanics(false));
  };

  const handleAssign = async () => {
    if (!selectedMechanicId) {
      errorMessage("Please select a mechanic");
      return;
    }

    if (!repairId) {
      errorMessage("Repair ID is missing");
      return;
    }

    const payload = {
      mechanic_id: selectedMechanicId
    };

    console.log("Assigning mechanic:", payload, "to repair:", repairId);

    setLoading(true);
    try {
      const response = await renderInstance.patch(
        `/dealer/repair-service/${repairId}/assign-mechanic`,
        payload,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      console.log("Assign Success Response:", response.data);
      successMessage("Mechanic assigned successfully!");
      onAssignSuccess();
      setSelectedMechanicId("");
    } catch (err: any) {
      console.error("Assign Error:", err.response?.data || err.message);
      errorMessage(err?.response?.data?.message || "Failed to assign mechanic");
    } finally {
      setLoading(false);
    }
  };

  const filteredMechanics = mechanics.filter((mechanic) =>
    `${mechanic.first_name} ${mechanic.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mechanic.mobile.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Wrench className="text-white" size={28} />
            <h2 className="text-2xl font-bold text-white">Assign Mechanic</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-red-800 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Repair ID Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Repair ID</p>
            <p className="text-lg font-mono font-semibold text-gray-800">{repairId}</p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search mechanics by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {/* Mechanics List */}
          {fetchingMechanics ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
          ) : filteredMechanics.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMechanics.map((mechanic) => (
                <div
                  key={mechanic.id}
                  onClick={() => setSelectedMechanicId(mechanic.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMechanicId === mechanic.id
                      ? "border-red-600 bg-red-50"
                      : "border-gray-200 hover:border-red-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedMechanicId === mechanic.id ? "bg-red-600" : "bg-gray-200"
                      }`}>
                        <User className={selectedMechanicId === mechanic.id ? "text-white" : "text-gray-600"} size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {mechanic.first_name} {mechanic.last_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Phone size={14} />
                          <span>{mechanic.mobile}</span>
                        </div>
                        {mechanic.specialization && (
                          <p className="text-xs text-gray-500 mt-1">
                            Specialization: {mechanic.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedMechanicId === mechanic.id && (
                      <CheckCircle className="text-red-600" size={28} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "No mechanics found matching your search" : "No mechanics available"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-8 py-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedMechanicId}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Assigning...
              </>
            ) : (
              <>
                <Wrench size={20} />
                Assign Mechanic
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}