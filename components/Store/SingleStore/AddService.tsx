"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AddIcon from "@mui/icons-material/Add";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop } from "@mui/material";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: string;
  images?: string[];
}

interface ServiceInStore {
  id: string;
  store_id: string;
  service_id: string;
  hourly_price: string;
  price?: string;
  baseService?: Service;
}

// Simple cookie parser utility
const getCookie = (name: string): string => {
  if (typeof document === "undefined") return "";

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? decodeURIComponent(cookieValue) : "";
  }
  return "";
};

export default function AddService({
  storeId,
  alreadyServices: initialServices,
}: {
  storeId: string;
  alreadyServices: any[];
}) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [hourlyPrice, setHourlyPrice] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [storeServices, setStoreServices] =
    useState<ServiceInStore[]>(initialServices);

  const router = useRouter();

  // Get access token from cookies
  const access_token = getCookie("access_token");

  // Reset modal state when opening/closing
  const resetModalState = () => {
    setSelectedService(null);
    setHourlyPrice("");
    setCustomName("");
    setCustomDescription("");
  };

  useEffect(() => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    setFetchingServices(true);
    renderInstance
      .get("/services", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then((res) => {
        if (res.status === 200) {
          setServices(res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        if (err.response?.status === 401) {
          handleSessionExpiry();
        } else {
          errorMessage("Failed to fetch services");
        }
      })
      .finally(() => {
        setFetchingServices(false);
      });
  }, [access_token]);

  const handleSessionExpiry = () => {
    // Clear the expired token
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    errorMessage("Session expired. Please login again.");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  // Function to fetch store services to update the list
  const fetchStoreServices = async () => {
    if (!access_token) return;

    try {
      const response = await renderInstance.get(`/store/${storeId}/services`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (response.status === 200) {
        setStoreServices(response.data);
      }
    } catch (error) {
      console.error("Error fetching store services:", error);
    }
  };

  async function saveService() {
    if (!selectedService || !hourlyPrice) {
      errorMessage("Select a service and enter price");
      return;
    }

    if (!access_token) {
      errorMessage("Please login first");
      window.location.href = "/login";
      return;
    }

    setCreating(true);

    // Send full service details in payload
    const payload = {
      service_id: [selectedService.id],
      store_id: storeId,
      hourly_price: hourlyPrice,
      custom_name: customName || undefined,
      custom_description: customDescription || undefined,
      service_data: {
        id: selectedService.id,
        name: selectedService.name,
        description: selectedService.description,
        image:
          selectedService.images?.[0] ||
          selectedService.image ||
          "https://wallpapercave.com/wp/wp13088808.jpg",
        price: selectedService.price,
      },
    };
    console.log(payload);

    try {
      const res = await renderInstance.post("/store/addServices", payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200 || res.status === 201) {
        successMessage("Service added successfully");
        setOpen(false);
        resetModalState();

        // Refresh the store services list
        await fetchStoreServices();

        // Also refresh the page to ensure everything is updated
        router.refresh();
      } else {
        errorMessage(`Unexpected status: ${res.status}`);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleSessionExpiry();
      } else if (err.response) {
        console.error("API error:", err.response.data);
        errorMessage(err.response.data.message || "Error adding service");
      } else {
        console.error("Unexpected error:", err);
        errorMessage("Unexpected error while adding service");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetModalState();
        }}
      >
        <DialogTrigger asChild>
          <button
            className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px]"
            onClick={() => setOpen(true)}
          >
            <AddIcon />
            <span>Add service</span>
          </button>
        </DialogTrigger>

        <DialogContent className="bg-white max-h-[90vh] w-[90vw] max-w-[900px] overflow-auto">
          <DialogHeader>
            <p className="text-2xl font-bold text-center">
              {selectedService ? "Enter service details" : "Select a service"}
            </p>
          </DialogHeader>

          <div
            className={`bg-white rounded-xl p-[30px] ${
              !selectedService && "grid grid-cols-4"
            } gap-5`}
          >
            {!selectedService ? (
              fetchingServices ? (
                <div className="flex items-center justify-center col-span-4 py-10">
                  <p>Loading services...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="flex items-center justify-center col-span-4 py-10">
                  <p>No services available to show</p>
                </div>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="border-2 rounded-xl flex flex-col gap-3 p-2 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedService(service)}
                  >
                    <Image
                      src={
                        service.images?.[0] ||
                        service.image ||
                        "https://wallpapercave.com/wp/wp13088808.jpg"
                      }
                      alt="service_image"
                      className="w-full h-32 object-cover rounded-xl"
                      width={200}
                      height={200}
                      unoptimized
                    />
                    <strong className="text-sm truncate">{service.name}</strong>
                    <p className="text-xs text-gray-600 line-clamp-2 h-10 overflow-hidden">
                      {service.description}
                    </p>
                  </div>
                ))
              )
            ) : (
              <div className="w-full flex flex-col gap-5">
                <div className="flex gap-4 items-start border rounded-lg p-4">
                  <Image
                    src={
                      selectedService.images?.[0] ||
                      selectedService.image ||
                      "https://wallpapercave.com/wp/wp13088808.jpg"
                    }
                    alt="selected_service"
                    className="w-28 h-28 object-cover rounded-lg"
                    width={112}
                    height={112}
                    unoptimized
                  />
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold">
                      {selectedService.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedService.description}
                    </p>
                  </div>
                </div>

                <Input
                  type="number"
                  placeholder="Enter hourly price"
                  value={hourlyPrice}
                  onChange={(e) => setHourlyPrice(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Custom service name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Custom service description (optional)"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="px-5 py-2 bg-gray-500 text-white rounded-md"
                    onClick={() => setSelectedService(null)}
                  >
                    Back
                  </button>
                  <button
                    className="px-5 py-2 bg-black text-white rounded-md"
                    onClick={saveService}
                    disabled={creating || !access_token}
                  >
                    {creating ? "Adding..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Backdrop open={creating}>
            {creating && <p className="text-white">Adding service...</p>}
          </Backdrop>
        </DialogContent>
      </Dialog>
    </>
  );
}
