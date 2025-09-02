"use client";

import { useState } from "react";
import { Plus, User } from "lucide-react";
import { Backdrop, CircularProgress } from "@mui/material";
import Image from "next/image";

// ----------------- Types -----------------
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
// ----------------- Hardcoded Fallback -----------------
const fallbackServices: Service[] = [
  {
    id: "local-1",
    name: "Deep Plowing with Moldboard Plow",
    slug: "deep-plowing-moldboard",
    description: "Primary land preparation using moldboard plow",
    price: "₹1200/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Deep+Plowing+with+Moldboard+Plow.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-1",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-2",
    name: "Shallow Plowing with Disc Plow",
    slug: "shallow-plowing-disc",
    description: "Secondary tillage using disc plow",
    price: "₹1000/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Shallow+Plowing+with+Disc+Plow.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-2",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-3",
    name: "Harrowing with Disc Harrow",
    slug: "harrowing-disc-harrow",
    description: "Soil refinement and weed control with disc harrow",
    price: "₹950/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Harrowing+with+Disc+Harrow.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-3",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-4",
    name: "Rotavator Tillage",
    slug: "rotavator-tillage",
    description: "Seedbed preparation using rotavator",
    price: "₹1500/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Rotavator+Tillage.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-4",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-5",
    name: "Subsoiling (Breaking deep hardpan)",
    slug: "subsoiling-deep-hardpan",
    description: "Deep tillage to break hardpan for root growth",
    price: "₹2000/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Subsoiling+(Breaking+deep+hardpan).webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-5",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-6",
    name: "Laser Land Leveling",
    slug: "laser-land-leveling",
    description: "Precision land leveling for efficient irrigation",
    price: "₹2500/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Levelling+land+with+Laser+Leveler.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-6",
    category_id: "cat-1",
    category: {
      id: "cat-1",
      name: "Land Preparation",
      slug: "land-preparation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Land+Preparation.webp",
    },
  },
  {
    id: "local-7",
    name: "Bund Making for Irrigation",
    slug: "bund-making-irrigation",
    description: "Constructing bunds for efficient irrigation",
    price: "₹1100/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Bund+making+for+irrigation.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-7",
    category_id: "cat-6",
    category: {
      id: "cat-6",
      name: "Irrigation",
      slug: "irrigation",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Irrigation.webp",
    },
  },
  {
    id: "local-8",
    name: "Ridge and Furrow Making",
    slug: "ridge-furrow-making",
    description: "Row arrangement for crops with ridge & furrow",
    price: "₹1200/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Ridge+and+furrow+making.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-8",
    category_id: "cat-10",
    category: {
      id: "cat-10",
      name: "Interculture",
      slug: "interculture",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Interculture.webp",
    },
  },
  {
    id: "local-9",
    name: "Bed Preparation for Vegetables",
    slug: "bed-preparation-vegetables",
    description: "Preparing raised beds for vegetable crops",
    price: "₹1300/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Bed+preparation+for+vegetables.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-9",
    category_id: "cat-2",
    category: {
      id: "cat-2",
      name: "Seed Bed Preparation",
      slug: "seed-bed",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Seed+Bed.webp",
    },
  },
  {
    id: "local-10",
    name: "Soil Crushing with Clod Crushers",
    slug: "soil-crushing-clod-crushers",
    description: "Crushing soil clods for fine tilth",
    price: "₹950/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Soil+crushing+with+clod+crushers.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-10",
    category_id: "cat-2",
    category: {
      id: "cat-2",
      name: "Seed Bed Preparation",
      slug: "seed-bed",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Seed+Bed.webp",
    },
  },
  {
    id: "local-11",
    name: "Sowing Seeds with Seed Drill",
    slug: "sowing-seeds-seed-drill",
    description: "Uniform sowing of seeds using seed drill",
    price: "₹1100/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Sowing+seeds+with+seed+drill.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-11",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-12",
    name: "Rice Transplanter Service",
    slug: "rice-transplanter-service",
    description: "Transplanting rice seedlings mechanically",
    price: "₹2600/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Transplanting+rice+seedlings+with+rice+transplanter.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-12",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-13",
    name: "Sugarcane Set Planting",
    slug: "sugarcane-set-planting",
    description: "Mechanized planting of sugarcane sets",
    price: "₹3000/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Sugarcane+set+planting.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-13",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-14",
    name: "Potato Planter Service",
    slug: "potato-planter-service",
    description: "Potato seed planting with planter",
    price: "₹2800/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Potato+planter+service.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-14",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-15",
    name: "Onion Seedling Transplanter",
    slug: "onion-seedling-transplanter",
    description: "Mechanical transplanting of onion seedlings",
    price: "₹2500/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Onion+seedling+transplanter.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-15",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-16",
    name: "Multi-Crop Planter Usage",
    slug: "multi-crop-planter",
    description: "Planting various crop seeds with precision planter",
    price: "₹2700/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Multi-crop+planter+usage.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-16",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-17",
    name: "Groundnut Sowing Machine",
    slug: "groundnut-sowing-machine",
    description: "Planting groundnut seeds mechanically",
    price: "₹2100/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Groundnut+sowing+machine.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-17",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-18",
    name: "Maize and Corn Planter",
    slug: "maize-corn-planter",
    description: "Row planting for maize and corn",
    price: "₹2300/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Maize+and+corn+planter.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-18",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-19",
    name: "Cotton Seeding Machine",
    slug: "cotton-seeding-machine",
    description: "Precision sowing of cotton seeds",
    price: "₹2600/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/Cotton+seeding+machine.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-19",
    category_id: "cat-3",
    category: {
      id: "cat-3",
      name: "Sowing",
      slug: "sowing",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Sowing.webp",
    },
  },
  {
    id: "local-20",
    name: "Inter-row Cultivator Service",
    slug: "inter-row-cultivator",
    description: "Cultivation between crop rows for weed control",
    price: "₹1000/hr",
    image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/tractor+usage/tractor+inter-row+cultivator+in+crop+field.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    base_id: "base-20",
    category_id: "cat-10",
    category: {
      id: "cat-10",
      name: "Interculture",
      slug: "interculture",
      image: "https://holaimagesdata.s3.us-west-2.amazonaws.com/web/category/Interculture.webp",
    },
  },
];


// ----------------- Component -----------------
export default function ServiceSection() {
  const [services] = useState<Service[]>(fallbackServices);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // Row layout
  const rowLayout =
    "grid grid-cols-[60px_120px_2fr_2fr_120px_2fr_160px] items-center gap-x-4 p-5";

  // ----------------- Image Fallback -----------------
  const isImageAvailable = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getDisplayImage = (service: Service) => {
    if (isImageAvailable(service.image)) return service.image;
    if (isImageAvailable(service.category?.image))
      return service.category.image;
    return null;
  };

  // ----------------- UI -----------------
  return (
    <div className="w-full py-5">
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: 9999 }}>
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-5 px-5">
        <p className="text-xl font-semibold">
          Total Services: {services.length}
        </p>
        <button
          onClick={() => setOpenModal(true)}
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white w-fit flex items-center gap-2.5 ml-auto"
        >
          <Plus size={20} /> Add Service
        </button>
      </div>

      {/* Table Head */}
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
          services.map((service, idx) => {
            const displayImage = getDisplayImage(service);
            return (
              <div
                key={service.id}
                className={`${rowLayout} text-base bg-[#fafafa] rounded cursor-pointer transition-colors hover:bg-white`}
              >
                <p>{idx + 1}</p>
                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {displayImage ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={displayImage}
                        alt={service.name}
                        fill
                        className="rounded-full object-cover"
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

      {/* Add Service Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[450px] relative max-h-[90vh] overflow-y-auto">
            {/* keep your form logic here */}
            <p className="text-lg font-semibold">Add Service (Static Mode)</p>
          </div>
        </div>
      )}
    </div>
  );
}
