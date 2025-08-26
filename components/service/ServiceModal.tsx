"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUp, MoreVertical, User } from "lucide-react";

type ServiceStatus = "Available" | "Unavailable";

interface Service {
  id: number;
  image: string;
  name: string;
  category: string;
  date: string;
  status: ServiceStatus;
}

export default function ServiceSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHover, setActiveHover] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    date: "",
    status: "Available" as ServiceStatus,
    image: "",
  });

  // mimic API call
  useEffect(() => {
    setTimeout(() => {
      setServices([
        {
          id: 1,
          image: "https://via.placeholder.com/100",
          name: "Tractor Rental",
          category: "Farming",
          date: "2025-08-25",
          status: "Available",
        },
        {
          id: 2,
          image: "https://via.placeholder.com/100",
          name: "Ploughing Service",
          category: "Agriculture",
          date: "2025-08-20",
          status: "Unavailable",
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const handleAddService = () => {
    if (!form.name || !form.category || !form.date) {
      alert("Please fill all required fields.");
      return;
    }

    const newService: Service = {
      id: services.length + 1,
      ...form,
    };

    setServices([...services, newService]);
    setForm({
      name: "",
      category: "",
      date: "",
      status: "Available",
      image: "",
    });
    setOpenModal(false);
  };

  return (
    <div className="w-full py-[20px]">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-[20px]">
        <p className="text-[20px]">
          <span className="font-[600]">Total Services: {services.length}</span>
        </p>

        <button
          onClick={() => setOpenModal(true)}
          className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
        >
          <Plus size={20} />
          <span>Add Service</span>
        </button>
      </div>

      {/* Header Row */}
      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded mt-[30px]">
        <p className="w-[50px]">ID</p>
        <p className="w-[150px]">Name</p>
        <p className="w-[150px]">Category</p>
        <p className="w-[150px]">Date</p>
        <p className="w-[150px]">Status</p>
      </div>

      {/* Service List */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {services.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
            <div className="w-[400px] lg:w-[700px] h-auto flex items-center justify-center text-gray-400">
              <p>No services found</p>
            </div>
          </div>
        ) : (
          services.map((serviceDetails, index) => {
            return (
              <a
                href={`/Service/${serviceDetails.id}`}
                className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer transition-all duration-500 hover:bg-white"
                key={index}
              >
                <p className="w-[50px]">{serviceDetails.id}</p>

                {serviceDetails.image ? (
                  <img
                    src={serviceDetails.image}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                    alt={serviceDetails.name}
                  />
                ) : (
                  <div className="w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                )}

                <p className="w-[150px]">{serviceDetails.name}</p>
                <p className="w-[150px]">{serviceDetails.category}</p>
                <p className="w-[150px]">{serviceDetails.date}</p>

                <div className="w-[150px]">
                  <span
                    className={`px-[8px] py-[4px] rounded text-[14px] font-[500] ${
                      serviceDetails.status === "Available"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {serviceDetails.status}
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Add Service Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] relative">
            <h2 className="text-xl font-semibold mb-4">Add New Service</h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Service Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded p-2"
              />

              <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded p-2"
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded p-2"
              />

              {/* Status Dropdown */}
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ServiceStatus })
                }
                className="w-full border rounded p-2"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) =>
                    setForm({ ...form, image: e.target.value })
                  }
                  className="w-full border rounded p-2"
                />

                {form.image && (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="mt-2 w-32 h-32 object-cover rounded border"
                  />
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Or Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setForm({ ...form, image: url });
                    }
                  }}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                className="px-4 py-2 rounded bg-black text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
