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

export default function ServiceSection() {
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

  // Function to generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Debounced slug check
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to check if slug is available via API
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !access_token) return true;

    try {
      const response = await renderInstance.get(`/services/check-slug/${slug}`, {
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
      errorMessage("Please enter a service name first");
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
        console.log("Services data:", res.data);
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

    if (
      !form.name ||
      !form.slug ||
      !form.description ||
      !form.price ||
      !form.category_id
    ) {
      errorMessage("Please fill all required fields");
      return;
    }

    setAddingService(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: form.price,
        category_id: form.category_id,
        image: form.image || null,
      };

      console.log("Sending payload:", payload);

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

  // Function to check if image URL is valid and accessible
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
    // First try service image
    if (isImageAvailable(service.image)) {
      return service.image;
    }
    
    // Then try category image
    if (isImageAvailable(service.category?.image)) {
      return service.category.image;
    }
    
    // No image available
    return null;
  };

  return (
    <div className="w-full py-5">
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
                className={`${rowLayout} text-base bg-[#fafafa] rounded cursor-pointer transition-colors duration-300 hover:bg-white`}
              >
                <p>{index + 1}</p>

                {/* Updated Image Display - Uses category image as fallback */}
                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {displayImage ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={displayImage}
                        alt={service.name}
                        fill
                        className="rounded-full object-cover"
                        onError={(e) => {
                          console.error("Image failed to load:", displayImage);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center';
                            fallback.innerHTML = '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                        onLoad={() => {
                          console.log("Image loaded successfully:", displayImage);
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
                <p>{service.price}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="Service Name (e.g., Land Preparation)"
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full border rounded p-2"
                  required
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
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <input
                  type="text"
                  placeholder="Price (e.g 30$)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full border rounded p-2"
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

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full border rounded p-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  If no image is provided, category image will be used as fallback
                </p>
                {form.image && isImageAvailable(form.image) && (
                  <div className="mt-2 w-32 h-32 relative border rounded">
                    <Image
                      src={form.image}
                      alt="Preview"
                      fill
                      className="object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
                disabled={addingService}
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={addingService || checkingSlug}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {addingService ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}