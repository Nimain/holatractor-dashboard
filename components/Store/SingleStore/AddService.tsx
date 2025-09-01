"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddIcon from "@mui/icons-material/Add";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Backdrop } from "@mui/material";

interface Service {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: string;
  images?: string[];
}

export default function AddService({ storeId, alreadyServices }: { storeId: string; alreadyServices: any[] }) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [price, setPrice] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const access_token = typeof document !== "undefined" ? document.cookie.split("access_token=")[1] : "";

  useEffect(() => {
    renderInstance
      .get("/services")
      .then((res) => {
        setServices(res.data);
      })
      .catch(() => {
        errorMessage("Failed to fetch services");
      });
  }, []);

  async function saveService() {
    if (!selectedService || !price) {
      errorMessage("Select a service and enter price");
      return;
    }

    setCreating(true);

    const payload: any = {
      service_id: selectedService.id,
      price: String(price),
      store_id: storeId,
    };

    if (customName) payload.custom_name = customName;
    if (customDescription) payload.custom_description = customDescription;

  try {
  setCreating(true);

  const payload = {
    serviceId: selectedService.id,   // use camelCase
    price: Number(price),            // send as number
    storeId: storeId,                // send storeId
    customName,
    customDescription,
  };

  console.log("Sending payload:", payload);

  const res = await renderInstance.post("/store/services", payload, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  console.log("Response:", res);

  if (res.status === 200 || res.status === 201) {
    successMessage("Service added successfully");
    setOpen(false);
    // refresh();
  } else {
    errorMessage(`Unexpected status: ${res.status}`);
  }
} catch (err: any) {
  if (err.response) {
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
    <div className="w-full space-y-2">
      <div className="w-full flex items-center justify-between gap-5 flex-wrap">
        <p className="text-xl font-medium">Total services: {alreadyServices.length}</p>

        <Dialog open={open} onOpenChange={setOpen}>
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

            <div className={`bg-white rounded-xl p-[30px] ${!selectedService && "grid grid-cols-4"} gap-5`}>
              {!selectedService ? (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="border-2 rounded-xl flex flex-col gap-3 p-2 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedService(service)}
                  >
                    <Image
                      src={service.images?.[0] || service.image || "https://wallpapercave.com/wp/wp13088808.jpg"}
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
              ) : (
                <div className="w-full flex flex-col gap-5">
                  <Input
                    type="text"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
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
                  <button
                    className="px-5 py-2 bg-black text-white rounded-md mx-auto"
                    onClick={saveService}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <Backdrop open={creating}>
              {creating && <p className="text-white">Adding service...</p>}
            </Backdrop>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing services */}
      <div className="w-full grid grid-cols-3 gap-[20px]">
        {alreadyServices.length === 0 ? (
          <p>No services added yet</p>
        ) : (
          alreadyServices.map((srv, i) => (
            <div key={i} className="border-2 rounded-xl w-full flex flex-col gap-5 p-2">
              <Image
                src={srv.baseService?.images?.[0] || srv.baseService?.image || "https://wallpapercave.com/wp/wp13088808.jpg"}
                alt="service_image"
                className="w-full h-32 object-cover rounded-xl"
                width={200}
                height={200}
                unoptimized
              />
              <div className="overflow-hidden">
                <strong className="block truncate">{srv.baseService?.name}</strong>
                <p className="text-sm text-gray-600 line-clamp-2 h-10 overflow-hidden">
                  {srv.baseService?.description}
                </p>
                <p className="text-sm font-medium mt-2">Price: {srv.price}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}