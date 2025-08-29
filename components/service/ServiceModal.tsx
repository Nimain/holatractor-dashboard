"use client";

import { useState, useEffect } from "react";
import { Plus, User } from "lucide-react";
import axios from "axios";

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  image: string;
  description: string;
  price: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
}

export default function ServiceSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category_id: "",
    image: "",
  });

  const rowLayout =
    "grid grid-cols-[60px_120px_2fr_2fr_120px_2fr_160px] items-center gap-x-4 p-5";

  // Fetch services
  useEffect(() => {
    axios
      .get("https://holatractor-backend-render.onrender.com/services")
      .then((res) => {
        setServices(res.data);
      })
      .catch((err) => console.error("Error fetching services:", err))
      .finally(() => setLoading(false));

    axios
      .get("https://holatractor-backend-render.onrender.com/servicecategory")
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // Handle POST new service
  const handleAddService = async () => {
    if (
      !form.name ||
      !form.slug ||
      !form.description ||
      !form.price ||
      !form.category_id
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("access_token"); // make sure you set token after login
      const res = await axios.post(
        "https://holatractor-backend-render.onrender.com/services",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh list after add
      setServices((prev) => [...prev, res.data]);
      setForm({
        name: "",
        slug: "",
        description: "",
        price: "",
        category_id: "",
        image: "",
      });
      setOpenModal(false);
    } catch (err) {
      console.error("Error adding service:", err);
      alert("Failed to add service. Check console for details.");
    }
  };

  return (
    <div className="w-full py-5">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-5 px-5">
        <p className="text-xl font-semibold">
          Total Services: {services.length}
        </p>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white w-fit flex items-center justify-center gap-2.5 ml-auto"
        >
          <Plus size={20} />
          <span>Add Service</span>
        </button>
      </div>

      {/* Header */}
      <div
        className={`${rowLayout} text-lg font-semibold bg-[#ededed] rounded mt-8`}
      >
        <p>Sl No</p>
        <p>Image</p>
        <p>Service ID</p>
        <p>Name</p>
        <p>Price</p>
        <p>Category</p>
        <p>Created</p>
      </div>

      {/* Service Rows */}
      <div className="flex flex-col gap-2 mt-5">
        {services.length === 0 ? (
          <div className="w-full min-h-[60vh] flex items-center justify-center">
            <p className="text-gray-400">No services found</p>
          </div>
        ) : (
          services.map((service, index) => (
            <div
              key={service.id}
              className={`${rowLayout} text-base bg-[#fafafa] rounded cursor-pointer transition-colors duration-300 hover:bg-white`}
            >
              {/* Sl No */}
              <p>{index + 1}</p>

              {/* Image */}
              {service.image ? (
                <img
                  src={service.image}
                  className="w-[50px] h-[50px] rounded-full object-cover"
                  alt={service.name}
                />
              ) : (
                <div className="w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
              )}

              {/* Service ID */}
              <p className="truncate">{service.id}</p>

              {/* Service Name */}
              <p>{service.name}</p>

              {/* Price */}
              <p>{service.price}</p>

              {/* Category */}
              <p>{service.category?.name || "N/A"}</p>

              {/* Created */}
              <p>
                {new Date(service.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Service Modal */}
    {openModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-[450px] relative">
      <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
      
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Name</label>
          <input
            type="text"
            placeholder="Service Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            placeholder="Slug (e.g deep-plowing)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="text"
            placeholder="Price (e.g 30$)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={(e) =>
              setForm({ ...form, category_id: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="text"
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
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
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setOpenModal(false)}
          className="px-4 py-2 rounded border hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleAddService}
          className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
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
