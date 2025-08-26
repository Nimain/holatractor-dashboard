"use client";

import { useEffect, useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Owner.svg";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

// Define the Farm interface based on the actual API response
interface Farm {
  id: string;
  owner_id: string;
  base_id: string;
  type: string;
  name: string;
  description: string;
  boundary: {
    area: number;
    coordinates: Array<{
      lat: string | number;
      lng: string | number;
    }> | Array<Array<number>>;
  };
  createdAt: string;
  updatedAt: string;
  Owner: {
    id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    password?: string | null;
    authType: string;
    googleId?: string | null;
    mobile?: string | null;
    country_code?: string | null;
    image?: string | null;
    dob?: string | null;
    gender: string;
    base_id: string;
    location_id?: string | null;
    createdAt: string;
    updatedAt: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    request_to_delete: boolean;
  };
}

const FarmSection = () => {
  const [activeHover, setActiveHover] = useState("");
  const [farmHover, setFarmHover] = useState(-1);
  const [loading, setLoading] = useState(false);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [open, setOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmDescription, setNewFarmDescription] = useState("");

  // Sort farms by updatedAt in descending order (most recent first)
  const sortFarmsByUpdateDate = (farmsList: Farm[]) => {
    return farmsList.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });
  };

  function fetchAllFarms() {
    setLoading(true);
    renderInstance
      .get("/farm")
      .then((res) => {
        // Sort the data before setting it to state
        const sortedFarms = sortFarmsByUpdateDate(res.data);
        setFarms(sortedFarms);
      })
      .catch((err) => {
        errorMessage("Error fetching farm list");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // Function to refresh the list after updates
  const refreshFarmsList = () => {
    fetchAllFarms();
  };

  useEffect(() => {
    fetchAllFarms();
  }, []);

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, options);
  };

  const formatArea = (area: number): string => {
    if (area >= 1000000) {
      return `${(area / 1000000).toFixed(2)}M m²`;
    } else if (area >= 1000) {
      return `${(area / 1000).toFixed(2)}K m²`;
    } else {
      return `${area.toFixed(2)} m²`;
    }
  };

  const getOwnerFullName = (owner: Farm['Owner']): string => {
    return `${owner.first_name} ${
      owner.middle_name ? owner.middle_name + " " : ""
    }${owner.last_name}`.trim();
  };

  return (
    <div className="mt-[40px] text-[18px]">
      <div className="mb-[20px] w-full flex items-center justify-between">
        <p className="text-[22px] font-[600]">Total farms: {farms.length}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="New_farm_button"
              onClick={() => {
                setOpen(true);
              }}
            >
              New farm
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-lg font-medium">Farm Name</Label>
            <Input
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              className="w-full mb-4"
              placeholder="Enter farm name"
            />

            <Label className="mb-2 text-lg font-medium">Description</Label>
            <Textarea
              value={newFarmDescription}
              onChange={(e) => setNewFarmDescription(e.target.value)}
              className="w-full"
              placeholder="Enter farm description"
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false);
                    setNewFarmName("");
                    setNewFarmDescription("");
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button
                name="Create_farm_button"
                onClick={() => {
                  if (!newFarmName.trim()) {
                    errorMessage("Please enter farm name");
                    return;
                  }
                  // Here you would typically call an API to create a new farm
                  errorMessage("Farm creation functionality needs to be implemented");
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[100px] flex items-center justify-between group">
          Id
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Name
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Owner
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Type
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Area
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Created at");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          {activeHover === "Created at" ? "Crea..." : "Created at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Updated at");
          }}
          onMouseLeave={() => {
            setActiveHover("");
          }}
        >
          {activeHover === "Updated at" ? "Upda..." : "Updated at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[20px]">
        {loading ? (
          <p>Fetching farms</p>
        ) : farms.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No farms found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          farms.map((farm, index) => {
            const ownerName = getOwnerFullName(farm.Owner);
            return (
              <div
                key={farm.id}
                onMouseEnter={() => {
                  setFarmHover(index);
                }}
                onMouseLeave={() => {
                  setFarmHover(-1);
                }}
                className={`text-[18px] flex items-center justify-between gap-[10px] p-[20px] rounded cursor-pointer transition-all duration-500 ${
                  farmHover === index
                    ? "bg-white shadow-lg"
                    : "bg-[#f5f5f5] hover:bg-[#f0f0f0]"
                }`}
              >
                <div className="w-[100px] text-[16px] font-[500]">
                  {index + 1}
                </div>

                <div className="w-[140px] text-[16px] font-[500] truncate">
                  {farm.name}
                </div>

                <div className="w-[140px] text-[16px] truncate">
                  {ownerName}
                </div>

                <div className="w-[120px] text-[16px] capitalize">
                  {farm.type}
                </div>

                <div className="w-[120px] text-[16px]">
                  {formatArea(farm.boundary.area)}
                </div>

                <div className="w-[180px] text-[16px]">
                  {formatDate(farm.createdAt)}
                </div>

                <div className="w-[180px] text-[16px]">
                  {formatDate(farm.updatedAt)}
                </div>

                {farmHover === index && (
                  <div className="flex items-center gap-[6px]">
                    <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                      <ArrowUpwardIcon />
                    </div>
                    <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                      <MoreVertIcon />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FarmSection;