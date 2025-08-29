"use client";

import { useState, useEffect } from "react";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import axios from "axios";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  status: number;
  createdAt: string;
}

const Categories = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    image: "",
  });

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://holatractor-backend-render.onrender.com/servicecategory"
      );
      setAllCategories(res.data);
    } catch (err) {
      errorMessage("Error fetching category list");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    if (!form.name || !form.slug) {
      alert("Please fill all required fields.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Missing token. Please login first.");
      return;
    }

    try {
      const res = await axios.post(
        "https://holatractor-backend-render.onrender.com/servicecategory",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllCategories((prev) => [...prev, res.data]);

      setForm({ name: "", slug: "", image: "" });
      setOpenModal(false);
    } catch (err: any) {
      console.error("Error adding category", err);
      alert(err.response?.data?.message || "Failed to add category");
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        {loading && <CircularProgress />}
      </Backdrop>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px] px-2">
        <p className="text-[20px] font-bold">
          Total Categories: {allCategories.length}
        </p>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* ---------- Header ---------- */}
      <div className="text-[18px] font-[600] grid grid-cols-[60px_120px_1fr_1fr_1fr_120px_160px] items-center gap-x-4 bg-[#ededed] p-[20px] rounded">
        <p>Sl No</p>
        <p>Image</p>
        <p>Category ID</p>
        <p>Category Name</p>
        <p>Category Slug</p>
        <p>Status</p>
        <p>Created</p>
      </div>

      {/* ---------- Rows ---------- */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {allCategories.length === 0 ? (
          <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No categories found"
              className="w-[300px] lg:w-[500px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          allCategories.map((cat, index) => (
            <div
              key={index}
              className="text-[16px] grid grid-cols-[60px_120px_1fr_1fr_1fr_120px_160px] items-center gap-x-4 px-[20px] py-[15px] rounded bg-[#fafafa] hover:bg-white transition-all duration-300"
            >
              {/* Sl No */}
              <p>{index + 1}</p>

              {/* Image */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={50}
                  height={50}
                  className="w-[50px] h-[50px] object-cover rounded-full"
                />
              ) : (
                <div className="w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-sm">
                  N/A
                </div>
              )}

              {/* Category ID */}
              <p className="truncate">{cat.id}</p>

              {/* Category Name */}
              <p>{cat.name}</p>

              {/* Category Slug */}
              <p className="text-gray-600 font-mono text-sm">{cat.slug}</p>

              {/* Status */}
              <p>
                {cat.status === 1 ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </p>

              {/* Created Date (raw, no timezone shift) */}
              <p>{cat.createdAt?.split("T")[0]}</p>
            </div>
          ))
        )}
      </div>

      {/* ---------- Add Category Modal ---------- */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] relative">
            <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category Slug</label>
                <input
                  type="text"
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full border rounded p-2"
                />
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
                    className="mt-2 w-20 h-20 object-cover rounded"
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
                onClick={handleAddCategory}
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
};

export default Categories;