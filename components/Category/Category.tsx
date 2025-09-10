"use client";

import { useState, useEffect } from "react";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import { Plus, RefreshCw } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance"; // Your axios instance
import { useCookie } from "next-cookie"; // For cookie management
import Link from "next/link";

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
  const [addingCategory, setAddingCategory] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    image: "",
  });

  // Get token from cookies (same as previous components)
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Function to check if slug is available via API
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !access_token) return true;

    try {
      const response = await renderInstance.get(`/servicecategory/check-slug/${slug}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      // Assuming API returns { available: boolean } or { exists: boolean }
      // Adjust based on your actual API response
      return response.data.available !== false && response.data.exists !== true;
    } catch (error) {
      console.error("Error checking slug:", error);
      // If API doesn't exist or fails, just return true to not block the user
      return true;
    }
  };

  // Function to generate unique slug with debounced API check
  const generateUniqueSlug = async (baseName: string) => {
    let baseSlug = generateSlug(baseName);
    let finalSlug = baseSlug;
    let counter = 1;

    // Check if base slug is available
    let isAvailable = await checkSlugAvailability(finalSlug);
    
    // If not available, try with numbers
    while (!isAvailable && counter <= 10) {
      finalSlug = `${baseSlug}-${counter}`;
      isAvailable = await checkSlugAvailability(finalSlug);
      counter++;
    }

    return finalSlug;
  };

  // Handle name change with immediate slug generation (no API check)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    
    // Immediately update name and generate basic slug (no API check)
    const basicSlug = newName.trim() ? generateSlug(newName) : "";
    setForm({ ...form, name: newName, slug: basicSlug });

    // Clear previous timeout
    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout);
    }

    // Only check API availability after user stops typing for 1 second
    if (newName.trim()) {
      const newTimeout = setTimeout(async () => {
        setCheckingSlug(true);
        try {
          const uniqueSlug = await generateUniqueSlug(newName);
          setForm(prev => ({ ...prev, slug: uniqueSlug }));
        } catch (error) {
          console.error("Error generating unique slug:", error);
        } finally {
          setCheckingSlug(false);
        }
      }, 1000);
      
      setSlugCheckTimeout(newTimeout);
    }
  };

  // Manual slug regeneration
  const handleRegenerateSlug = async () => {
    if (!form.name.trim()) {
      errorMessage("Please enter a category name first");
      return;
    }

    setCheckingSlug(true);
    try {
      const uniqueSlug = await generateUniqueSlug(form.name);
      setForm(prev => ({ ...prev, slug: uniqueSlug }));
    } catch (error) {
      console.error("Error regenerating slug:", error);
      errorMessage("Failed to regenerate slug");
    } finally {
      setCheckingSlug(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
    };
  }, [slugCheckTimeout]);

  // Fetch categories with proper authentication
  async function fetchCategories() {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    setLoading(true);
    try {
      const res = await renderInstance.get(
        "/servicecategory",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      setAllCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      errorMessage("Error fetching category list");
    } finally {
      setLoading(false);
    }
  }

  // Add category with proper authentication
  async function handleAddCategory() {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    if (!form.name) {
      errorMessage("Please enter a category name.");
      return;
    }

    if (!form.slug) {
      errorMessage("Please wait for slug generation to complete.");
      return;
    }

    setAddingCategory(true);
    try {
      const res = await renderInstance.post(
        "/servicecategory",
        {
          name: form.name,
          slug: form.slug,
          image: form.image || null,
        },
        { 
          headers: { 
            Authorization: `Bearer ${access_token}` 
          } 
        }
      );

      setAllCategories((prev) => [...prev, res.data]);
      setForm({ name: "", slug: "", image: "" });
      setOpenModal(false);
      successMessage("Category added successfully!");
    } catch (err: any) {
      console.error("Error adding category:", err);
      errorMessage(err.response?.data?.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, [access_token]); // Re-fetch when token changes

  return (
    <div className="py-[40px] w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingCategory}
      >
        <CircularProgress />
      </Backdrop>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between gap-[20px] mb-[40px] px-2">
        <p className="text-[20px] font-bold">
          Total Categories: {allCategories.length}
        </p>
     <Link
  href="/Category/new"
  className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2"
>
  <Plus size={20} />
  <span>Add Category</span>
</Link>

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

              {/* Created Date */}
              <p>{cat.createdAt?.split("T")[0]}</p>
            </div>
          ))
        )}
      </div>

      {/* ---------- Add Category Modal ---------- */}
      {/* {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] relative">
            <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="Category Name (e.g., Agriculture)"
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  URL Slug * 
                  <span className="text-xs text-gray-500 ml-1">(Auto-generated from name)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Auto-generated slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="flex-1 border rounded p-2 bg-gray-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    disabled={!form.name.trim() || checkingSlug}
                    className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Regenerate slug from name"
                  >
                    <RefreshCw size={16} className={checkingSlug ? "animate-spin" : ""} />
                  </button>
                </div>
                {form.slug && (
                  <p className="text-xs text-gray-500 mt-1">
                    URL will be: <span className="font-mono bg-gray-100 px-1 rounded">/{form.slug}</span>
                  </p>
                )}
                {checkingSlug && (
                  <p className="text-xs text-blue-500 mt-1">Checking availability...</p>
                )}
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
                    className="mt-2 w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setOpenModal(false);
                  setForm({ name: "", slug: "", image: "" });
                }}
                className="px-4 py-2 rounded border hover:bg-gray-50"
                disabled={addingCategory}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={addingCategory || checkingSlug}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {addingCategory ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Categories;