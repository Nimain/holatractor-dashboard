"use client";

import { useEffect, useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Owner } from "@/utils/Types/types";
import axios from "axios";
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
import OwnerRegister from "../Authentication/OwnerRegister";
import Image from "next/image";
import NullImage from "@/assets/AnimateIcons/Owner.svg";
import OwnerAction from "./OwnerAction";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const OwnerSection = () => {
  const [activeHover, setActiveHover] = useState("");
  const [mailHover, setMailHover] = useState(-1);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<Owner[]>([]);
  const [open, setOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [isSignUpCard, setIsSignUpCard] = useState(false);

  // Sort users by updatedAt in descending order (most recent first)
  const sortUsersByUpdateDate = (usersList: Owner[]) => {
    if (!Array.isArray(usersList)) return [];
    return [...usersList].sort((a, b) => {
      const dateA = new Date(a?.updatedAt || 0).getTime();
      const dateB = new Date(b?.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  };

  async function fetchAllUsers() {
    setLoading(true);
    try {
      let ownerList: Owner[] = [];
      try {
        const localRes = await axios.get("/api/owner");
        if (Array.isArray(localRes.data) && localRes.data.length > 0) {
          ownerList = localRes.data;
        }
      } catch {}

      if (ownerList.length === 0) {
        const res = await renderInstance.get("/owner");
        ownerList = Array.isArray(res.data)
          ? res.data
          : (res.data?.owners || res.data?.data || []);
      }

      const sortedUsers = sortUsersByUpdateDate(ownerList);
      setUsers(sortedUsers);
    } catch (err) {
      errorMessage("Error fetching user list");
    } finally {
      setLoading(false);
    }
  }

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts.shift();
    const lastName = nameParts.pop();
    const middleName = nameParts.join(" ");

    return { firstName, middleName, lastName };
  };

  function handleNameChage(name: string) {
    setNewOwnerName(name);

    const { lastName } = splitFullName(name);

    if (lastName) setIsSignUpCard(true);
    else setIsSignUpCard(false);
  }

  const refreshUsersList = () => {
    fetchAllUsers();
  };

  useEffect(() => {
    fetchAllUsers();
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

  return (
    <div className="mt-6 md:mt-10 px-4 md:px-6 lg:px-8 text-base md:text-lg">

      <div className="mb-5 md:mb-8 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-lg md:text-xl lg:text-2xl font-semibold">
          {getTranslation(locale, {
            en: "Total owners:",
            es: "Propietarios totales:",
            ay: "Taqpacha jilatanaka:",
            qu: "Lliw dueñoqkuna:",
            gn: "Opa jára:",
          })}{" "}
          {users.length}
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="Name_next_button"
              onClick={() => {
                setOpen(true);
              }}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
            >
              {getTranslation(locale, {
                en: "New owner",
                es: "Nuevo propietario",
                ay: "Machaqa jilata",
                qu: "Musuq dueño",
                gn: "Jára pyahu",
              })}
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-white rounded-2xl w-[95vw] max-w-[460px] p-0 overflow-hidden shadow-2xl border border-gray-100"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Owner Directory</p>
              <h2 className="text-xl font-bold">
                {getTranslation(locale, {
                  en: "Register New Owner",
                  es: "Registrar Nuevo Propietario",
                  ay: "Machaqa Jilata Qillqaña",
                  qu: "Musuq Dueño Qillqay",
                  gn: "Jára Pyahu Mboheraguasu",
                })}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {getTranslation(locale, {
                  en: "Enter the owner's full legal name to start registration.",
                  es: "Ingrese el nombre completo del propietario para comenzar.",
                  ay: "Qalltañatakix jilatan taqpach sutip qillqaña.",
                  qu: "Qallarinaykipaq dueñopa llapan sutinta qillqay.",
                  gn: "Emoinge jára réra hekopete eñepyrũ hag̃ua.",
                })}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {getTranslation(locale, {
                    en: "Full Legal Name *",
                    es: "Nombre Completo *",
                    ay: "Taqpacha Suti *",
                    qu: "Llapan Suti *",
                    gn: "Téra Hekopete *",
                  })}
                </Label>
                <Input
                  value={newOwnerName}
                  onChange={(e) => {
                    handleNameChage(e.target.value);
                  }}
                  placeholder="e.g. Juan Carlos Martinez"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all bg-white"
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

              {isSignUpCard ? (
                <OwnerRegister inPage={true} name={newOwnerName} />
              ) : (
                <Button
                  name="Name_next_button"
                  onClick={() => {
                    errorMessage("Please give your name");
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  {getTranslation(locale, {
                    en: "Next Step →",
                    es: "Siguiente Paso →",
                    ay: "Jutiri Paso →",
                    qu: "Qatiqnin Paso →",
                    gn: "Paso Upeigua →",
                  })}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View - Hidden on mobile/tablet */}
      <div className="hidden lg:block">
        {/* Table Header */}
        <div className="text-base lg:text-lg xl:text-xl font-semibold flex items-center justify-between gap-2 xl:gap-4 bg-[#ededed] p-4 xl:p-5 rounded cursor-pointer overflow-x-auto">
          <div className="min-w-[80px] flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Id",
              es: "Id",
              ay: "Id",
              qu: "Id",
              gn: "Id",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
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
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[120px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Email",
              es: "Correo electrónico",
              ay: "Chaski qillqiri",
              qu: "Willay qillqa",
              gn: "Ñanduti veve",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div
            className="min-w-[100px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
            onMouseEnter={() => {
              setActiveHover("Verified");
            }}
            onMouseLeave={() => {
              setActiveHover("");
            }}
          >
            {activeHover === "Verified"
              ? getTranslation(locale, {
                en: "Veri...",
                es: "Veri...",
                ay: "Chiq...",
                qu: "Kach...",
                gn: "Oñe...",
              })
              : getTranslation(locale, {
                en: "Verified",
                es: "Verificado",
                ay: "Chiqachata",
                qu: "Kachkan",
                gn: "Oñemoneĩ",
              })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div className="min-w-[100px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
            {getTranslation(locale, {
              en: "Status",
              es: "Estado",
              ay: "Kawsawi",
              qu: "Kawsay",
              gn: "Tekotee",
            })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div
            className="min-w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
            onMouseEnter={() => {
              setActiveHover("Joined at");
            }}
            onMouseLeave={() => {
              setActiveHover("");
            }}
          >
            {activeHover === "Joined at"
              ? getTranslation(locale, {
                en: "Join...",
                es: "Uni...",
                ay: "Chi...",
                qu: "Qill...",
                gn: "Oje...",
              })
              : getTranslation(locale, {
                en: "Joined at",
                es: "Unido el",
                ay: "Chiqachata",
                qu: "Qillqaykama",
                gn: "Ojejapo",
              })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>

          <div
            className="min-w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
            onMouseEnter={() => {
              setActiveHover("Updated at");
            }}
            onMouseLeave={() => {
              setActiveHover("");
            }}
          >
            {activeHover === "Updated at"
              ? getTranslation(locale, {
                en: "Upda...",
                es: "Actu...",
                ay: "Qill...",
                qu: "Rima...",
                gn: "Gua...",
              })
              : getTranslation(locale, {
                en: "Updated at",
                es: "Actualizado el",
                ay: "Qillqata",
                qu: "Rimaykuy",
                gn: "Guarã",
              })}
            <div className="flex items-center gap-1 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <ArrowUpwardIcon fontSize="small" />
              </div>
              <div className="rounded-full w-7 h-7 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
                <MoreVertIcon fontSize="small" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Owner rows */}
        <div className="flex flex-col gap-2 mt-5">
          {loading ? (
            <p className="text-center py-8">
              {getTranslation(locale, {
                en: "Fetching owner",
                es: "Obteniendo propietario",
                ay: "Jilata katuqkasa",
                qu: "Dueño apanayta",
                gn: "Oñembyaty jára",
              })}
            </p>
          ) : users.length === 0 ? (
            <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
              <Image
                src={NullImage}
                alt="No image found"
                className="w-[300px] lg:w-[500px] xl:w-[700px] h-auto object-cover"
                width={400}
                height={400}
                unoptimized={true}
              />
            </div>
          ) : (
            users.map((details, index) => {
              const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""
                }${details.user.last_name}`;
              return (
                <div
                  key={details.id}
                  onMouseEnter={() => {
                    setMailHover(index);
                  }}
                  onMouseLeave={() => {
                    setMailHover(-1);
                  }}
                  className="w-full"
                >
                  <OwnerAction
                    creatDate={formatDate(details.createdAt)}
                    email={details.user.email}
                    emailVerified={details.user.emailVerified}
                    index={index}
                    mailHover={mailHover}
                    name={name}
                    updateDate={formatDate(details.updatedAt)}
                    status={details.status}
                    id={details.id}
                    user={details.user}
                    screenshots={details.paymentScreenshots}
                    document={
                      details.document
                        ? {
                          ...details.document,
                          expire_date:
                            details.document.expire_date instanceof Date
                              ? details.document.expire_date.toISOString()
                              : details.document.expire_date ?? null,
                        }
                        : undefined
                    }
                    location={details.location}
                  />
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
              en: "Fetching owner",
              es: "Obteniendo propietario",
              ay: "Jilata katuqkasa",
              qu: "Dueño apanayta",
              gn: "Oñembyaty jára",
            })}
          </p>
        ) : users.length === 0 ? (
          <div className="w-full h-full min-h-[50vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No image found"
              className="w-[200px] sm:w-[300px] h-auto object-cover"
              width={300}
              height={300}
              unoptimized={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((details, index) => {
              const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""
                }${details.user.last_name}`;
              return (
                <div
                  key={details.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-lg mb-1 text-ellipsis overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1, // show only one line
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {name.split(" ").length > 6 ? name.split(" ").slice(0, 6).join(" ") + "..." : name}
                      </h3>

                      <p className="text-sm text-gray-600 mb-2">#{index + 1}</p>
                    </div>

                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${details.user.emailVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {details.user.emailVerified
                        ? getTranslation(locale, {
                          en: "Verified",
                          es: "Verificado",
                          ay: "Chiqachata",
                          qu: "Kachkan",
                          gn: "Oñemoneĩ",
                        })
                        : getTranslation(locale, {
                          en: "Not Verified",
                          es: "No verificado",
                          ay: "Janiw chiqachatati",
                          qu: "Manam kachkanchu",
                          gn: "Ndoñemoneĩri",
                        })}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex flex-col">
                      <span className="text-gray-600 font-medium">
                        {getTranslation(locale, {
                          en: "Email:",
                          es: "Correo:",
                          ay: "Chaski:",
                          qu: "Willay:",
                          gn: "Ñanduti:",
                        })}
                      </span>
                      <span className="text-gray-900 truncate">
                        {details.user.email}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">
                        {getTranslation(locale, {
                          en: "Status:",
                          es: "Estado:",
                          ay: "Kawsawi:",
                          qu: "Kawsay:",
                          gn: "Tekotee:",
                        })}
                      </span>
                      <span
                        className={`font-medium ${details.status === "active"
                            ? "text-green-600"
                            : details.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                      >
                        {details.status}
                      </span>
                    </div>

                    <div className="flex flex-col pt-2 border-t border-gray-200">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600 font-medium">
                          {getTranslation(locale, {
                            en: "Joined:",
                            es: "Unido:",
                            ay: "Chiqachata:",
                            qu: "Qillqaykama:",
                            gn: "Ojejapo:",
                          })}
                        </span>
                        <span className="text-gray-900 text-xs">
                          {formatDate(details.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">
                          {getTranslation(locale, {
                            en: "Updated:",
                            es: "Actualizado:",
                            ay: "Qillqata:",
                            qu: "Rimaykuy:",
                            gn: "Guarã:",
                          })}
                        </span>
                        <span className="text-gray-900 text-xs">
                          {formatDate(details.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile view - Show OwnerAction component inline */}
                  <div className="pt-3 border-t border-gray-200">
                    <OwnerAction
                      creatDate={formatDate(details.createdAt)}
                      email={details.user.email}
                      emailVerified={details.user.emailVerified}
                      index={index}
                      mailHover={mailHover}
                      name={name}
                      updateDate={formatDate(details.updatedAt)}
                      status={details.status}
                      id={details.id}
                      user={details.user}
                      screenshots={details.paymentScreenshots}
                      document={
                        details.document
                          ? {
                            ...details.document,
                            expire_date:
                              details.document.expire_date instanceof Date
                                ? details.document.expire_date.toISOString()
                                : details.document.expire_date ?? null,
                          }
                          : undefined
                      }
                      location={details.location}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSection;