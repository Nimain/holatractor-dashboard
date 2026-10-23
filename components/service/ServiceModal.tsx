"use client";

import { useState, useEffect } from "react";
import { Plus, User, RefreshCw } from "lucide-react";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { useCookie } from "next-cookie";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  slug: string;
  price: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  base_id: string;
  category_id: string;
  category: Category;
}

interface ServiceSectionProps {
  theme?: "light" | "dark";
}

export default function ServiceSection({ theme = "light" }: ServiceSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category_id: "",
    image: "",
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const rowLayout =
    "grid grid-cols-[60px_120px_2fr_2fr_120px_2fr_160px] items-center gap-x-4 p-5";

  // Theme classes
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const cardBg = theme === "dark" ? "bg-gray-700" : "bg-[#fafafa]";
  const headerBg = theme === "dark" ? "bg-gray-600" : "bg-[#ededed]";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-gray-600 text-white" : "bg-white text-gray-900";

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  // Debounced slug check
  const [slugCheckTimeout, setSlugCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Function to check if slug is available via API
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !access_token) return true;

    try {
      const response = await renderInstance.get(
        `/services/check-slug/${slug}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      return response.data.available !== false && response.data.exists !== true;
    } catch (error) {
      console.error("Error checking slug:", error);
      return true;
    }
  };

  // Function to generate unique slug with debounced API check
  const generateUniqueSlug = async (baseName: string) => {
    let baseSlug = generateSlug(baseName);
    let finalSlug = baseSlug;
    let counter = 1;

    let isAvailable = await checkSlugAvailability(finalSlug);

    while (!isAvailable && counter <= 10) {
      finalSlug = `${baseSlug}-${counter}`;
      isAvailable = await checkSlugAvailability(finalSlug);
      counter++;
    }

    return finalSlug;
  };

  // Handle name change with immediate slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const basicSlug = newName.trim() ? generateSlug(newName) : "";
    setForm({ ...form, name: newName, slug: basicSlug });

    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout);
    }

    if (newName.trim()) {
      const newTimeout = setTimeout(async () => {
        setCheckingSlug(true);
        try {
          const uniqueSlug = await generateUniqueSlug(newName);
          setForm((prev) => ({ ...prev, slug: uniqueSlug }));
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
      errorMessage("Please enter a service name first");
      return;
    }

    setCheckingSlug(true);
    try {
      const uniqueSlug = await generateUniqueSlug(form.name);
      setForm((prev) => ({ ...prev, slug: uniqueSlug }));
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

  const fetchServices = () => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      setLoading(false);
      return;
    }

    setLoading(true);
    renderInstance
      .get("/services", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setServices(res.data);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        errorMessage("Error fetching services");
      })
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    renderInstance
      .get("/servicecategory", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        errorMessage("Error fetching categories");
      });
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [access_token]);

  const handleAddService = async () => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    if (!form.name || !form.slug || !form.description || !form.price || !form.category_id) {
      errorMessage("Please fill all required fields");
      return;
    }

    setAddingService(true);
    try {
      // Get the category image as fallback
      const selectedCategory = categories.find(cat => cat.id === form.category_id);
      const fallbackImage = selectedCategory?.image || "";

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: form.price.replace('$', '').trim(), // Remove dollar sign if present
        category_id: form.category_id,
        image: form.image.trim() || fallbackImage, // Use form image or fallback to category image
      };

      console.log("Sending payload to backend:", payload);

      const res = await renderInstance.post("/services", payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

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
      successMessage("Service added successfully!");

      fetchServices();
    } catch (err: any) {
      console.error("Error adding service:", err);
      errorMessage(err.response?.data?.message || "Failed to add service");
    } finally {
      setAddingService(false);
    }
  };

  // Function to check if image URL is valid
  const isImageAvailable = (url: string | null | undefined) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Function to get the appropriate image to display
  const getDisplayImage = (service: Service) => {
    if (isImageAvailable(service.image)) {
      return service.image;
    }
    if (isImageAvailable(service.category?.image)) {
      return service.category.image;
    }
    return null;
  };

  // Format price for display
  const formatPrice = (price: string) => {
    return `$${price}`;
  };

  return (
    <div className={`w-full py-5 ${bgColor} ${textColor}`}>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || addingService}
      >
        <CircularProgress />
      </Backdrop>

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

      <div
        className={`${rowLayout} text-lg font-semibold ${headerBg} rounded mt-8 ${textColor}`}
      >
        <p>Sl No</p>
        <p>Image</p>
        <p>Service ID</p>
        <p>Name</p>
        <p>Price</p>
        <p>Category</p>
        <p>Created</p>
      </div>

      <div className="flex flex-col gap-2 mt-5">
        {services.length === 0 ? (
          <div className="w-full min-h-[60vh] flex items-center justify-center">
            <p className="text-gray-400">No services found</p>
          </div>
        ) : (
          services.map((service, index) => {
            const displayImage = getDisplayImage(service);

            return (
              <div
                key={service.id}
                className={`${rowLayout} text-base ${cardBg} rounded cursor-pointer transition-colors duration-300 hover:${theme === "dark" ? "bg-gray-600" : "bg-white"} ${textColor} ${borderColor} border`}
              >
                <p>{index + 1}</p>

                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {displayImage ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={displayImage}
                        alt={service.name}
                        fill
                        className="rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector(".fallback-icon")) {
                            const fallback = document.createElement("div");
                            fallback.className = "fallback-icon w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center";
                            fallback.innerHTML = '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>

                <p className="truncate text-xs">{service.id}</p>
                <p className="truncate">{service.name}</p>
                <p>{formatPrice(service.price)}</p>
                <p className="truncate">{service.category?.name || "N/A"}</p>
                <p className="text-sm">
                  {new Date(service.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[540px] relative max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Catalog Management</p>
              <h2 className="text-xl font-bold">Add New Service</h2>
              <p className="text-xs text-slate-300 mt-1">Configure service pricing, category assignment, and slug.</p>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-170px)]" style={{ scrollbarWidth: "none" }}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Land Preparation & Plowing"
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  URL Slug *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="auto-generated-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="flex-1 px-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    disabled={!form.name.trim() || checkingSlug}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    title="Regenerate slug"
                  >
                    <RefreshCw
                      size={15}
                      className={checkingSlug ? "animate-spin text-emerald-600" : ""}
                    />
                  </button>
                </div>
                {form.slug && (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    Route: <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">/{form.slug}</span>
                  </p>
                )}
                {checkingSlug && (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Checking uniqueness...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Detailed description of the service deliverables..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Price (USD) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 45"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm({ ...form, category_id: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/service-banner.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default category image will apply if left empty.
                </p>
                {form.image && isImageAvailable(form.image) && (
                  <div className="mt-2 w-28 h-20 relative border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <Image
                      src={form.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                disabled={addingService}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddService}
                disabled={addingService || checkingSlug}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {addingService ? "Creating Service..." : "Create Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}