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
import { Edit, Eye, MoreVertical, Trash2 } from "lucide-react";
import { Popover } from "@mui/material";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";

interface Farm {
  id: string;
  owner_id: string;
  base_id: string;
  type: string;
  name: string;
  description: string;
  boundary: {
    area: number;
    coordinates:
      | Array<{
          lat: string | number;
          lng: string | number;
        }>
      | Array<Array<number>>;
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

  // New state for actions
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFarmName, setEditFarmName] = useState("");
  const [editFarmDescription, setEditFarmDescription] = useState("");

  const sortFarmsByUpdateDate = (farmsList: Farm[]) => {
    return farmsList.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  };

  function fetchAllFarms() {
    setLoading(true);
    renderInstance
      .get("/farm")
      .then((res) => {
        const sortedFarms = sortFarmsByUpdateDate(res.data);
        setFarms(sortedFarms);
      })
      .catch(() => {
        errorMessage("Error fetching farm list");
      })
      .finally(() => {
        setLoading(false);
      });
  }

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

  const getOwnerFullName = (owner: Farm["Owner"]): string => {
    return `${owner.first_name} ${
      owner.middle_name ? owner.middle_name + " " : ""
    }${owner.last_name}`.trim();
  };

  // Action handlers
  const handleViewFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setViewDialogOpen(true);
  };

  const handleEditFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setEditFarmName(farm.name);
    setEditFarmDescription(farm.description);
    setEditDialogOpen(true);
  };

  const handleUpdateFarm = async () => {
    if (!selectedFarm || !editFarmName.trim()) {
      errorMessage("Please enter farm name");
      return;
    }

    setLoading(true);
    try {
      // Try different possible API endpoint formats
      console.log("Updating farm with ID:", selectedFarm.id);
      console.log("Update payload:", {
        name: editFarmName.trim(),
        description: editFarmDescription.trim(),
      });

      // Try PATCH instead of PUT (some APIs prefer PATCH for partial updates)
      const response = await renderInstance.patch(`/farm/${selectedFarm.id}`, {
        name: editFarmName.trim(),
        description: editFarmDescription.trim(),
      });

      console.log("Update response:", response.data);

      // Update the farm in the local state
      setFarms(prevFarms => 
        prevFarms.map(farm => 
          farm.id === selectedFarm.id 
            ? { ...farm, name: editFarmName, description: editFarmDescription, updatedAt: new Date().toISOString() }
            : farm
        )
      );

      setEditDialogOpen(false);
      setEditFarmName("");
      setEditFarmDescription("");
      setSelectedFarm(null);
      
      // You can add a success message here if you have it
      // successMessage("Farm updated successfully");
      
    } catch (error: any) {
      console.error("Error updating farm:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // More specific error messages
      if (error.response?.status === 404) {
        errorMessage("Farm not found");
      } else if (error.response?.status === 400) {
        errorMessage("Invalid farm data provided");
      } else if (error.response?.status === 403) {
        errorMessage("You don't have permission to edit this farm");
      } else if (error.response?.data?.message) {
        errorMessage(error.response.data.message);
      } else {
        errorMessage("Failed to update farm");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFarm) return;

    setLoading(true);
    try {
      await renderInstance.delete(`/farm/${selectedFarm.id}`);
      
      // Remove farm from local state
      setFarms(prevFarms => prevFarms.filter(farm => farm.id !== selectedFarm.id));
      
      setDeleteDialogOpen(false);
      setSelectedFarm(null);
      
      // You can add a success message here if you have it
      // successMessage("Farm deleted successfully");
      
    } catch (error) {
      console.error("Error deleting farm:", error);
      errorMessage("Failed to delete farm");
    } finally {
      setLoading(false);
    }
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

          <DialogContent className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto">
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
                  errorMessage(
                    "Farm creation functionality needs to be implemented"
                  );
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Header */}
      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[100px] flex items-center justify-between group">
          Id
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Name
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Farmer
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Area
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHover("Created at")}
          onMouseLeave={() => setActiveHover("")}
        >
          {activeHover === "Created at" ? "Crea..." : "Created at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => setActiveHover("Updated at")}
          onMouseLeave={() => setActiveHover("")}
        >
          {activeHover === "Updated at" ? "Upda..." : "Updated at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[80px] text-center">Actions</div>
      </div>

      {/* Farm rows */}
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
              unoptimized
            />
          </div>
        ) : (
          farms.map((farm, index) => {
            const ownerName = getOwnerFullName(farm.Owner);
            return (
              <div
                key={farm.id}
                onMouseEnter={() => setFarmHover(index)}
                onMouseLeave={() => setFarmHover(-1)}
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

                <div className="w-[120px] text-[16px]">
                  {formatArea(farm.boundary.area)}
                </div>

                <div className="w-[220px] text-[16px] whitespace-nowrap">
                  {formatDate(farm.createdAt)}
                </div>

                <div className="w-[220px] text-[16px] whitespace-nowrap">
                  {formatDate(farm.updatedAt)}
                </div>

                {/* Actions column with buttons */}
                <div className="w-[80px] flex flex-col items-center gap-2">
                  <button
                    onClick={() => handleViewFarm(farm)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 w-full justify-center"
                  >
                    <Eye size={14} /> View
                  </button>

                  <button
                    onClick={() => handleEditFarm(farm)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 w-full justify-center"
                  >
                    <Edit size={14} /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteFarm(farm)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 w-full justify-center"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VIEW FARM DIALOG */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-white h-fit min-w-[500px] max-w-[500px] overflow-auto">
          {selectedFarm && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Farm Details</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name:</Label>
                  <p className="text-gray-700">{selectedFarm.name}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Area:</Label>
                  <p className="text-gray-700">{formatArea(selectedFarm.boundary.area)}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Type:</Label>
                  <p className="text-gray-700">{selectedFarm.type}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Owner:</Label>
                  <p className="text-gray-700">{getOwnerFullName(selectedFarm.Owner)}</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Description:</Label>
                <p className="text-gray-700 mt-1">{selectedFarm.description || "No description available"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Created:</Label>
                  <p className="text-gray-700">{formatDate(selectedFarm.createdAt)}</p>
                </div>
                
                <div>
                  <Label className="font-medium">Updated:</Label>
                  <p className="text-gray-700">{formatDate(selectedFarm.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT FARM DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto">
          <h2 className="text-xl font-semibold mb-4">Edit Farm</h2>
          
          <Label className="mb-2 text-lg font-medium">Farm Name</Label>
          <Input
            value={editFarmName}
            onChange={(e) => setEditFarmName(e.target.value)}
            className="w-full mb-4"
            placeholder="Enter farm name"
          />

          <Label className="mb-2 text-lg font-medium">Description</Label>
          <Textarea
            value={editFarmDescription}
            onChange={(e) => setEditFarmDescription(e.target.value)}
            className="w-full"
            placeholder="Enter farm description"
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditFarmName("");
                  setEditFarmDescription("");
                  setSelectedFarm(null);
                }}
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              onClick={handleUpdateFarm}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white h-fit min-w-[400px] max-w-[400px]">
          <h2 className="text-xl font-semibold mb-4">Delete Farm</h2>
          
          {selectedFarm && (
            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to delete the farm "{selectedFarm.name}"?
              </p>
              <p className="text-red-600 text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedFarm(null);
                }}
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmSection;