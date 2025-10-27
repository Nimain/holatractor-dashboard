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
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

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

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
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
      const response = await renderInstance.patch(`/farm/${selectedFarm.id}`, {
        name: editFarmName.trim(),
        description: editFarmDescription.trim(),
      });

      setFarms((prevFarms) =>
        prevFarms.map((farm) =>
          farm.id === selectedFarm.id
            ? {
                ...farm,
                name: editFarmName,
                description: editFarmDescription,
                updatedAt: new Date().toISOString(),
              }
            : farm
        )
      );

      setEditDialogOpen(false);
      setEditFarmName("");
      setEditFarmDescription("");
      setSelectedFarm(null);
    } catch (error: any) {
      console.error("Error updating farm:", error);
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

      setFarms((prevFarms) =>
        prevFarms.filter((farm) => farm.id !== selectedFarm.id)
      );

      setDeleteDialogOpen(false);
      setSelectedFarm(null);
    } catch (error) {
      console.error("Error deleting farm:", error);
      errorMessage("Failed to delete farm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 md:mt-10 text-base md:text-lg">
      {/* Header Section */}
      <div className="mb-5 md:mb-8 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-lg md:text-xl lg:text-2xl font-semibold">
          {getTranslation(locale, {
            en: "Total farms:",
            es: "Granjas totales:",
            ay: "Taqpacha uywa uta:",
            qu: "Lliw chakrakuna:",
            gn: "Opa ñemitỹ renda:",
          })}{" "}
          {farms.length}
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="New_farm_button"
              onClick={() => {
                setOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              {getTranslation(locale, {
                en: "New farm",
                es: "Nueva granja",
                ay: "Machaqa uywa uta",
                qu: "Musuq chakra",
                gn: "Ñemitỹ pyahu",
              })}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-white h-fit w-[90vw] max-w-[400px] overflow-auto">
            <Label className="mb-2 text-base md:text-lg font-medium">
              {getTranslation(locale, {
                en: "Farm Name",
                es: "Nombre de la granja",
                ay: "Uywa utjiri sutipa",
                qu: "Chakra sutin",
                gn: "Ñemitỹ renda réra",
              })}
            </Label>
            <Input
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              className="w-full mb-4"
              placeholder="Enter farm name"
            />

            <Label className="mb-2 text-base md:text-lg font-medium">
              {getTranslation(locale, {
                en: "Description",
                es: "Descripción",
                ay: "Uñt'ayawi",
                qu: "Willay",
                gn: "Ñemombe'u",
              })}
            </Label>
            <Textarea
              value={newFarmDescription}
              onChange={(e) => setNewFarmDescription(e.target.value)}
              className="w-full"
              placeholder="Enter farm description"
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false);
                    setNewFarmName("");
                    setNewFarmDescription("");
                  }}
                  className="w-full sm:w-auto"
                >
                  {getTranslation(locale, {
                    en: "Cancel",
                    es: "Cancelar",
                    ay: "Tukuyaña",
                    qu: "Chinkachiy",
                    gn: "Ñemboty",
                  })}
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
                className="w-full sm:w-auto"
              >
                {getTranslation(locale, {
                  en: "Create",
                  es: "Crear",
                  ay: "Kunsa luriña",
                  qu: "Kamay",
                  gn: "Japo",
                })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View - Hidden on mobile/tablet */}
      <div className="hidden lg:block">
        {/* Table Header */}
        <div className="text-base lg:text-lg xl:text-xl font-semibold flex items-center justify-between gap-2 xl:gap-4 bg-[#ededed] p-4 xl:p-5 rounded cursor-pointer overflow-x-auto">
          <div className="min-w-[80px] flex items-center justify-between group">
            {getTranslation(locale, {
              en: "ID",
              es: "ID",
              ay: "ID",
              qu: "ID",
              gn: "ID",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Name",
              es: "Nombre",
              ay: "Suti",
              qu: "Suti",
              gn: "Téra",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Farmer",
              es: "Agricultor",
              ay: "Uywa apnaqiri",
              qu: "Chakra kamayuq",
              gn: "Ñemitỹhára",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[100px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Area",
              es: "Área",
              ay: "Ch'usa",
              qu: "Suyu",
              gn: "Tenda",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Created at",
              es: "Creado en",
              ay: "Lurata uka",
              qu: "Kamaykuna",
              gn: "Ojapo haguépe",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Updated at",
              es: "Actualizado en",
              ay: "Machaqaptata uka",
              qu: "Musuqchariykuna",
              gn: "Oñembohekopyahu haguépe",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[100px] text-center">
            {getTranslation(locale, {
              en: "Actions",
              es: "Acciones",
              ay: "Lurawinaka",
              qu: "Ruraykuna",
              gn: "Japoha rehegua",
            })}
          </div>
        </div>

        {/* Desktop Farm rows */}
        <div className="flex flex-col gap-2 mt-5">
          {loading ? (
            <p className="text-center py-8">
              {getTranslation(locale, {
                en: "Fetching farms",
                es: "Cargando granjas",
                ay: "Uywa utanaka apthapiwi",
                qu: "Chakrakunata apaykuchkan",
                gn: "Oñembyaty ñemitỹ renda",
              })}
            </p>
          ) : farms.length === 0 ? (
            <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
              <Image
                src={NullImage}
                alt="No farms found"
                className="w-[300px] lg:w-[500px] xl:w-[700px] h-auto object-cover"
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
                  className={`text-sm lg:text-base flex items-center justify-between gap-2 xl:gap-4 p-4 xl:p-5 rounded cursor-pointer transition-all duration-500 ${
                    farmHover === index
                      ? "bg-white shadow-lg"
                      : "bg-[#f5f5f5] hover:bg-[#f0f0f0]"
                  }`}
                >
                  <div className="min-w-[80px] font-medium">{index + 1}</div>
                  <div className="min-w-[120px] font-medium truncate">
                    {farm.name}
                  </div>
                  <div className="min-w-[120px] truncate">{ownerName}</div>
                  <div className="min-w-[100px]">
                    {formatArea(farm.boundary.area)}
                  </div>
                  <div className="min-w-[140px] whitespace-nowrap">
                    {formatDate(farm.createdAt)}
                  </div>
                  <div className="min-w-[140px] whitespace-nowrap">
                    {formatDate(farm.updatedAt)}
                  </div>
                  <div className="min-w-[100px] flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleViewFarm(farm)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 w-full justify-center"
                    >
                      <Eye size={14} />
                      {getTranslation(locale, {
                        en: "View",
                        es: "Ver",
                        ay: "Uñjaña",
                        qu: "Qhaway",
                        gn: "Hecha",
                      })}
                    </button>
                    <button
                      onClick={() => handleEditFarm(farm)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 w-full justify-center"
                    >
                      <Edit size={14} />
                      {getTranslation(locale, {
                        en: "Edit",
                        es: "Editar",
                        ay: "Askichataña",
                        qu: "Huñuy",
                        gn: "Mbosako'i",
                      })}
                    </button>
                    <button
                      onClick={() => handleDeleteFarm(farm)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600 w-full justify-center"
                    >
                      <Trash2 size={14} />
                      {getTranslation(locale, {
                        en: "Delete",
                        es: "Eliminar",
                        ay: "Chhaqtayaña",
                        qu: "Pichay",
                        gn: "Mbojei",
                      })}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden">
        {loading ? (
          <p className="text-center py-8">
            {getTranslation(locale, {
              en: "Fetching farms",
              es: "Cargando granjas",
              ay: "Uywa utanaka apthapiwi",
              qu: "Chakrakunata apaykuchkan",
              gn: "Oñembyaty ñemitỹ renda",
            })}
          </p>
        ) : farms.length === 0 ? (
          <div className="w-full h-full min-h-[50vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No farms found"
              className="w-[200px] sm:w-[300px] h-auto object-cover"
              width={300}
              height={300}
              unoptimized
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {farms.map((farm, index) => {
              const ownerName = getOwnerFullName(farm.Owner);
              return (
                <div
                  key={farm.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {farm.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        #{index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        {getTranslation(locale, {
                          en: "Farmer:",
                          es: "Agricultor:",
                          ay: "Uywa apnaqiri:",
                          qu: "Chakra kamayuq:",
                          gn: "Ñemitỹhára:",
                        })}
                      </span>
                      <span className="text-gray-900 truncate ml-2">
                        {ownerName}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        {getTranslation(locale, {
                          en: "Area:",
                          es: "Área:",
                          ay: "Ch'usa:",
                          qu: "Suyu:",
                          gn: "Tenda:",
                        })}
                      </span>
                      <span className="text-gray-900">
                        {formatArea(farm.boundary.area)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        {getTranslation(locale, {
                          en: "Updated:",
                          es: "Actualizado:",
                          ay: "Jichhaptata:",
                          qu: "Kunayaririy:",
                          gn: "Oñembohekopyahu:",
                        })}
                      </span>
                      <span className="text-gray-900 text-xs">
                        {formatDate(farm.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewFarm(farm)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
                    >
                      <Eye size={16} />
                      {getTranslation(locale, {
                        en: "View",
                        es: "Ver",
                        ay: "Uñjaña",
                        qu: "Qhaway",
                        gn: "Hecha",
                      })}
                    </button>
                    <button
                      onClick={() => handleEditFarm(farm)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded bg-green-500 text-white text-sm hover:bg-green-600"
                    >
                      <Edit size={16} />
                      {getTranslation(locale, {
                        en: "Edit",
                        es: "Editar",
                        ay: "Askichataña",
                        qu: "Huñuy",
                        gn: "Mbosako'i",
                      })}
                    </button>
                    <button
                      onClick={() => handleDeleteFarm(farm)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW FARM DIALOG */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-white h-fit w-[90vw] max-w-[500px] max-h-[90vh] overflow-auto">
          {selectedFarm && (
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {getTranslation(locale, {
                  en: "Farm details",
                  es: "Detalles de la granja",
                  ay: "Uywa utjiri yatiwinaka",
                  qu: "Chakra ñawpaqkunata",
                  gn: "Ñemitỹ renda mba'eteéva",
                })}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Name",
                      es: "Nombre",
                      ay: "Suti",
                      qu: "Suti",
                      gn: "Téra",
                    })}
                    :
                  </Label>
                  <p className="text-gray-700">{selectedFarm.name}</p>
                </div>

                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Area",
                      es: "Área",
                      ay: "Ch'usaquta",
                      qu: "Kichwa",
                      gn: "Yvy pehẽ",
                    })}
                    :
                  </Label>
                  <p className="text-gray-700">
                    {formatArea(selectedFarm.boundary.area)}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Type",
                      es: "Tipo",
                      ay: "Kasta",
                      qu: "Imayna",
                      gn: "Teko",
                    })}
                  </Label>
                  <p className="text-gray-700">{selectedFarm.type}</p>
                </div>

                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Owner",
                      es: "Propietario",
                      ay: "Jaqi jilata",
                      qu: "Kamachiq",
                      gn: "Jára",
                    })}
                    :
                  </Label>
                  <p className="text-gray-700">
                    {getOwnerFullName(selectedFarm.Owner)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="font-medium">
                  {getTranslation(locale, {
                    en: "Description",
                    es: "Descripción",
                    ay: "Uñt'ayawi",
                    qu: "Willay",
                    gn: "Ñemombe'u",
                  })}
                  :
                </Label>
                <p className="text-gray-700 mt-1">
                  {selectedFarm.description || "No description available"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Created",
                      es: "Creado",
                      ay: "Lurata",
                      qu: "Rurakuy",
                      gn: "Ojejapo",
                    })}
                    :
                  </Label>
                  <p className="text-gray-700 text-sm">
                    {formatDate(selectedFarm.createdAt)}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">
                    {getTranslation(locale, {
                      en: "Updated",
                      es: "Actualizado",
                      ay: "Jichhaptata",
                      qu: "Kunayaririy",
                      gn: "Oñembohekopyahu",
                    })}
                    :
                  </Label>
                  <p className="text-gray-700 text-sm">
                    {formatDate(selectedFarm.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={() => setViewDialogOpen(false)} className="w-full sm:w-auto">
                {getTranslation(locale, {
                  en: "Close",
                  es: "Cerrar",
                  ay: "Jark'aña",
                  qu: "Wisq'ay",
                  gn: "Ñemboty",
                })}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT FARM DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white h-fit w-[90vw] max-w-[400px] max-h-[90vh] overflow-auto">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {getTranslation(locale, {
              en: "Edit farms",
              es: "Editar granjas",
              ay: "Uywa utanaka askichaña",
              qu: "Chakrakunata tikray",
              gn: "Ñemboheko ñemitỹ renda",
            })}
          </h2>

          <Label className="mb-2 text-base md:text-lg font-medium">
            {getTranslation(locale, {
              en: "Farm Name",
              es: "Nombre de la granja",
              ay: "Uywa utjäwi sutipa",
              qu: "Chakra sutin",
              gn: "Ñemitỹ renda réra",
            })}
          </Label>
          <Input
            value={editFarmName}
            onChange={(e) => setEditFarmName(e.target.value)}
            className="w-full mb-4"
            placeholder="Enter farm name"
          />

          <Label className="mb-2 text-base md:text-lg font-medium">
            {getTranslation(locale, {
              en: "Description",
              es: "Descripción",
              ay: "Uñt'ayawi",
              qu: "Willay",
              gn: "Ñemombe'u",
            })}
          </Label>
          <Textarea
            value={editFarmDescription}
            onChange={(e) => setEditFarmDescription(e.target.value)}
            className="w-full"
            placeholder="Enter farm description"
          />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditFarmName("");
                  setEditFarmDescription("");
                  setSelectedFarm(null);
                }}
                className="w-full sm:w-auto"
              >
                {getTranslation(locale, {
                  en: "Cancel",
                  es: "Cancelar",
                  ay: "Tukuyaña",
                  qu: "Chinkachiy",
                  gn: "Ñemboty",
                })}
              </Button>
            </DialogClose>

            <Button onClick={handleUpdateFarm} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white h-fit w-[90vw] max-w-[400px]">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {getTranslation(locale, {
              en: "Delete farm",
              es: "Eliminar granja",
              ay: "Uywa uta chhaqtayaña",
              qu: "Chakra pichay",
              gn: "Mbojei ñemitỹ renda",
            })}
          </h2>

          {selectedFarm && (
            <div className="mb-4">
              <p className="text-gray-700">
                {getTranslation(locale, {
                  en: "Are you sure you want to delete the farm?",
                  es: "¿Está seguro de que desea eliminar la granja?",
                  ay: "¿Chhaqtayañ munta uywa utjiri?",
                  qu: "¿Rikhuykichu chay chakrata pichanaykita munanki?",
                  gn: "¿Añetehápepa rembojeisé pe ñemitỹ renda?",
                })}{" "}
                "{selectedFarm.name}"?
              </p>
              <p className="text-red-600 text-sm mt-2">
                {getTranslation(locale, {
                  en: "This action cannot be undone.",
                  es: "Esta acción no se puede deshacer.",
                  ay: "Aka lurawin janiwa kutxataskiti.",
                  qu: "Kay rurayqa manam kutichisqa kanchu.",
                  gn: "Ko japo ndaikatúi oñemboguejy jey.",
                })}
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedFarm(null);
                }}
                className="w-full sm:w-auto"
              >
                {getTranslation(locale, {
                  en: "Cancel",
                  es: "Cancelar",
                  ay: "Tukuyaña",
                  qu: "Chinkachiy",
                  gn: "Ñemboty",
                })}
              </Button>
            </DialogClose>

            <Button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto"
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