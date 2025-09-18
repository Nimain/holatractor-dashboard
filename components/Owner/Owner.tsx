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
      return dateB - dateA; // Descending order (most recent first)
    });
  };

  function fetchAllUsers() {
    setLoading(true);
    renderInstance
      .get("/owner")
      .then((res) => {
        // Sort the data before setting it to state
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
  
    // 🔥 Same helper you use in ExpandedSidebar
    const getTranslation = (locale: string, translations: any) => {
      return translations[locale] || translations["en"];
    };
  
  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/); // Split by spaces
    const firstName = nameParts.shift(); // Take the first element as the first name
    const lastName = nameParts.pop(); // Take the last element as the last name
    const middleName = nameParts.join(" "); // Join the rest as middle name

    return { firstName, middleName, lastName };
  };

  function handleNameChage(name: string) {
    setNewOwnerName(name);

    const { lastName } = splitFullName(name);

    if (lastName) setIsSignUpCard(true);
    else setIsSignUpCard(false);
  }

  // Function to refresh the list after updates
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
    <div className="mt-[40px] text-[18px]">
      <div className="mb-[20px] w-full flex items-center justify-between">
        <p className="text-[22px] font-[600]">{getTranslation(locale, {
            en: "Total owners:",
            es: "Propietarios totales:",
            ay: "Taqpacha jilatanaka:",
            qu: "Lliw dueñoqkuna:",
            gn: "Opa jára:",
          })} {users.length}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="Name_next_button"
              onClick={() => {
                setOpen(true);
              }}
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
            className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-lg font-medium">{getTranslation(locale, {
                en: "Name",
                es: "Nombre",
                ay: "Suti",
                qu: "Suti",
                gn: "Téra",
              })}</Label>

            <Input
              value={newOwnerName}
              onChange={(e) => {
                handleNameChage(e.target.value);
              }}
              className="w-full"
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
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

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[100px] flex items-center justify-between group">
         {getTranslation(locale, {
            en: "Id",
            es: "Id",
            ay: "Id",
            qu: "Id",
            gn: "Id",
          })}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div
              className="rounded-full w-[30px] h-[30px] 
            flex items-center justify-center transition-all duration-500 hover:bg-gray-300"
            >
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
        {getTranslation(locale, {
                    en: "Name",
                    es: "Nombre",
                    ay: "Suti",
                    qu: "Suti",
                    gn: "Téra",
                  })}
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
                    {getTranslation(locale, {
            en: "Email",
            es: "Correo electrónico",
            ay: "Chaski qillqiri",
            qu: "Willay qillqa",
            gn: "Ñanduti veve",
          })}
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
  className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
  onMouseEnter={() => {
    setActiveHover("Verified");
  }}
  onMouseLeave={() => {
    setActiveHover("");
  }}
>
  {activeHover === "Verified"
    ? getTranslation(locale, {
        en: "Verified",
        es: "Verificado",
        ay: "Chiqachata",
        qu: "Kachkan",
        gn: "Oñemoneĩ",
      })
    : getTranslation(locale, {
        en: "Verified",
        es: "Verif...",
        ay: "Chiq...",
        qu: "Kach...",
        gn: "Oñe...",
      })}
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
          {getTranslation(locale, {
            en: "Status",
            es: "Estado",
            ay: "Kawsawi",
            qu: "Kawsay",
            gn: "Tekotee",
          })}
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
    setActiveHover("Joined at");
  }}
  onMouseLeave={() => {
    setActiveHover("");
  }}
>
  {activeHover === "Joined at"
    ? getTranslation(locale, {
        en: "Joined at",
        es: "Unido el",
        ay: "Chiqachata",
        qu: "Qillqaykama",
        gn: "Ojejapo",
      })
    : getTranslation(locale, {
        en: "Joined at",
        es: "Uni...",
        ay: "Chi...",
        qu: "Qill...",
        gn: "Oje...",
      })}
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
  {activeHover === "Updated at"
    ? getTranslation(locale, {
        en: "Updated at",
        es: "Actualizado el",
        ay: "Qillqata",
        qu: "Rimaykuy",
        gn: "Guarã",
      })
    : getTranslation(locale, {
        en: "Updated at",
        es: "Actu...",
        ay: "Qill...",
        qu: "Rima...",
        gn: "Gua...",
      })}
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
          <p>{getTranslation(locale, {
              en: "Fetching owner",
              es: "Obteniendo propietario",
              ay: "Jilata katuqkasa",
              qu: "Dueño apanayta",
              gn: "Oñembyaty jára",
            })}</p>
        ) : users.length === 0 ? (
          <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No image found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          users.map((details, index) => {
            const name = `${details.user.first_name} ${
              details.user.middle_name ? details.user.middle_name + " " : ""
            }${details.user.last_name}`;
            return (
              <div
                key={details.id} // Use unique ID instead of index for better React rendering
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
  );
};

export default OwnerSection;
