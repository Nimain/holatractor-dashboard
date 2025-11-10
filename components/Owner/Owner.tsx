"use client";

import { useEffect, useState } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Owner } from "@/utils/Types/types";
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
    return usersList.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  };

  function fetchAllUsers() {
    setLoading(true);
    renderInstance
      .get("/owner")
      .then((res) => {
        const sortedUsers = sortUsersByUpdateDate(res.data);
        setUsers(sortedUsers);
      })
      .catch((err) => {
        errorMessage("Error fetching user list");
      })
      .finally(() => {
        setLoading(false);
      });
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
              className="w-full sm:w-auto"
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
            className="bg-white h-fit w-[90vw] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-base md:text-lg font-medium">
              {getTranslation(locale, {
                en: "Name",
                es: "Nombre",
                ay: "Suti",
                qu: "Suti",
                gn: "Téra",
              })}
            </Label>

            <Input
              value={newOwnerName}
              onChange={(e) => {
                handleNameChage(e.target.value);
              }}
              className="w-full"
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false);
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

              {isSignUpCard ? (
                <OwnerRegister inPage={true} name={newOwnerName} />
              ) : (
                <Button
                  name="Name_next_button"
                  onClick={() => {
                    errorMessage("Please give your name");
                  }}
                  className="w-full sm:w-auto"
                >
                  {getTranslation(locale, {
                    en: "Next",
                    es: "Siguiente",
                    ay: "Jutiri",
                    qu: "Ñawpaq",
                    gn: "Upeigua",
                  })}
                </Button>
              )}
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