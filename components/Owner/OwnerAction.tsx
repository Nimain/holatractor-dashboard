"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// utils/formatDate.ts
export function formatDateOnly(dateString?: string | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ✅ extend props
interface UserDetails {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  dob?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  mobile?: string | null;
  phoneVerified?: boolean | null;
  country_code?: string | null;
  image?: string | null;
}

interface DocumentDetails {
  document_number?: string;
  attachment?: string;
  expire_date?: string | null;
}

interface LocationDetails {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  lat?: string;
  lng?: string; // ✅ fixed lan → lng
}

interface OwnerActionProps {
  index: number;
  mailHover: number;
  name: string;
  email: string;
  emailVerified: boolean;
  creatDate: string;
  updateDate: string;
  status: number;
  id: string;
  screenshots: string[];
  user?: UserDetails;
  document?: DocumentDetails;
  location?: LocationDetails;
  onUpdate?: () => void; // ✅ optional callback instead of reload
}

const OwnerAction = ({
  index,
  name,
  mailHover,
  email,
  emailVerified,
  creatDate,
  updateDate,
  status,
  id,
  screenshots,
  user,
  document,
  location,
  onUpdate,
}: OwnerActionProps) => {
  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Get language from Redux store
  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  // Helper function for translations
  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  // ✅ one state object for all buttons
  const [loading, setLoading] = useState<{
    delete: boolean;
    active: boolean;
    inactive: boolean;
  }>({
    delete: false,
    active: false,
    inactive: false,
  });

  const updateOwnerStatus = async (
    endpoint: string,
    type: keyof typeof loading,
    success: string
  ) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      await renderInstance.patch(endpoint, {}, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      successMessage(success);
      onUpdate?.(); // ✅ call parent refresh
    } catch (err: any) {
      errorMessage(err?.response?.data?.message || getTranslation(locale, {
        en: "Try again",
        es: "Inténtalo de nuevo",
        ay: "Wasitat yant'aña",
        qu: "Huk kutitapas ruway",
        gn: "Eha jevy",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const DeleteOwner = () =>
    updateOwnerStatus(
      `/owner/delete_owner/${id}`,
      "delete",
      getTranslation(locale, {
        en: "Owner deleted successfully",
        es: "Propietario eliminado exitosamente",
        ay: "Jilata suma chhaqtayata",
        qu: "Dueño allinta chinkachisqa",
        gn: "Jára oñemboguete porã",
      })
    );

  const ActiveOwner = () =>
    updateOwnerStatus(
      `/owner/activate_owner/${id}`,
      "active",
      getTranslation(locale, {
        en: "Activated successfully",
        es: "Activado exitosamente",
        ay: "Suma ch'amanchata",
        qu: "Allinta llamk'achisqa",
        gn: "Oñemyendy porã",
      })
    );

  const InactiveOwner = () =>
    updateOwnerStatus(
      `/owner/inactivate_owner/${id}`,
      "inactive",
      getTranslation(locale, {
        en: "Inactivated successfully",
        es: "Desactivado exitosamente",
        ay: "Suma jani ch'amanchata",
        qu: "Allinta sayachisqa",
        gn: "Oñembogue porã",
      })
    );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <p className="w-[100px]">{index + 1}</p>
          <p className="w-[140px] truncate" title={name}>
            {mailHover === index ? name : `${name.slice(0, 5)}...`}
          </p>
          <p
            className={`transition truncate ${
              index === mailHover ? "w-fit" : "w-[140px]"
            }`}
            title={email}
          >
            {mailHover === index ? email : `${email.slice(0, 5)}...`}
          </p>
          <div
            className={`px-[10px] text-[14px] py-[6px] ${
              emailVerified ? "text-green-600" : "text-red-600"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {emailVerified ? getTranslation(locale, {
              en: "Yes",
              es: "Sí",
              ay: "Jisa",
              qu: "Arí",
              gn: "Héẽ",
            }) : getTranslation(locale, {
              en: "No",
              es: "No",
              ay: "Janiwa",
              qu: "Mana",
              gn: "Nahániri",
            })}
          </div>
          <p
            className={`px-[10px] text-[14px] py-[6px] ${
              status === 1 ? "text-green-600" : "text-red-600"
            } bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {status === 1 ? getTranslation(locale, {
              en: "Active",
              es: "Activo",
              ay: "Ch'aman",
              qu: "Llamk'aq",
              gn: "Oiko",
            }) : getTranslation(locale, {
              en: "Inactive",
              es: "Inactivo",
              ay: "Jani ch'aman",
              qu: "Mana llamk'aq",
              gn: "Ndoikói",
            })}
          </p>
          <p className="w-[180px] truncate" title={creatDate}>
            {mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}
          </p>
          <p className="w-[180px] truncate" title={updateDate}>
            {mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}
          </p>
        </div>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {getTranslation(locale, {
              en: `Update status of ${name}`,
              es: `Actualizar estado de ${name}`,
              ay: `${name} kawsawi machaña`,
              qu: `${name} -pa kawsaynintas hukchachinayki`,
              gn: `${name} rerekotee mboheko`,
            })}
          </SheetTitle>
          <SheetDescription className="text-red-600">
            {status === 1
              ? `${name} is an active operator`
              : `${name} is inactive. Click "Active" to activate.`}
          </SheetDescription>
        </SheetHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* ✅ User Profile */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src={
                user?.image && user.image.trim() !== "" ? user.image : "/pic.jpg"
              }
              alt={`${name}'s profile`}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-full object-cover border-2 shadow-md"
            />
          </div>

          {/* ✅ Owner Details */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              {getTranslation(locale, {
                en: "Owner Details",
                es: "Detalles del Propietario",
                ay: "Jilata yatiyawinaka",
                qu: "Dueño willakuykuna",
                gn: "Jára marandu",
              })}
            </h3>
            <div className="space-y-3 mt-3">
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Name",
                    es: "Nombre",
                    ay: "Suti",
                    qu: "Suti",
                    gn: "Téra",
                  })}
                </Label>
                <Input value={name} readOnly />
              </div>
              {user?.gender && (
                <div>
                  <Label>
                    {getTranslation(locale, {
                      en: "Gender",
                      es: "Género",
                      ay: "Chacha warmi",
                      qu: "Qhari warmi",
                      gn: "Kuña ha kuimba'e",
                    })}
                  </Label>
                  <Input value={user.gender} readOnly />
                </div>
              )}
              {user?.dob && (
                <div>
                  <Label>
                    {getTranslation(locale, {
                      en: "Date of Birth",
                      es: "Fecha de Nacimiento",
                      ay: "Yurina uru",
                      qu: "Paqarisqa p'unchay",
                      gn: "Heñóimby ára",
                    })}
                  </Label>
                  <Input value={formatDateOnly(user.dob)} readOnly />
                </div>
              )}
              <div>
                <Label className="flex items-center gap-2">
                  {getTranslation(locale, {
                    en: "Email",
                    es: "Correo electrónico",
                    ay: "Chaski qillqiri",
                    qu: "Willay qillqa",
                    gn: "Ñanduti veve",
                  })}
                  {" "}
                  {user?.emailVerified ? (
                    <CheckCircle className="text-green-500 w-4 h-4" />
                  ) : (
                    <XCircle className="text-red-500 w-4 h-4" />
                  )}
                </Label>
                <Input value={user?.email || email} readOnly />
              </div>
              {user?.mobile && (
                <div>
                  <Label className="flex items-center gap-2">
                    {getTranslation(locale, {
                      en: "Mobile",
                      es: "Móvil",
                      ay: "Jach'a telefono",
                      qu: "Kuyuchiq telefono",
                      gn: "Pumbyry popeguasu",
                    })}
                    {" "}
                    {user?.phoneVerified ? (
                      <CheckCircle className="text-green-500 w-4 h-4" />
                    ) : (
                      <XCircle className="text-red-500 w-4 h-4" />
                    )}
                  </Label>
                  <Input
                    value={`${user.country_code || ""} ${user.mobile}`}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>

          {/* ✅ Payment Details with Screenshots */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              {getTranslation(locale, {
                en: "Payment Details",
                es: "Detalles de Pago",
                ay: "Phuqhaña yatiyawinaka",
                qu: "Qullqi quy willakuykuna",
                gn: "Tepyme marandu",
              })}
            </h3>
            {screenshots?.length > 0 ? (
              <div className="mt-3">
                {screenshots.map((src, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 flex flex-col items-center bg-gray-50"
                  >
                    <Image
                      src={src && src.trim() !== "" ? src : "/pic.jpg"}
                      alt={`Payment Screenshot ${i + 1}`}
                      width={300}
                      height={200}
                      className="rounded-lg object-cover border mb-2"
                    />
                    <div className="w-full space-y-1">
                      <Label>
                        {getTranslation(locale, {
                          en: "Screenshot ID",
                          es: "ID de Captura",
                          ay: "Rixita ID",
                          qu: "Hap'ina ID",
                          gn: "Ta'anga japyha ID",
                        })}
                      </Label>
                      <Input value={`${i + 1}`} readOnly />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-3">
                {getTranslation(locale, {
                  en: "No payment screenshots uploaded",
                  es: "No se han subido capturas de pago",
                  ay: "Janiw phuqhaña rixitanakax apaqataniti",
                  qu: "Mana qullqi quy hap'inanakun churasqachu",
                  gn: "Ndaipóri tepyme ta'anga japyha oñehupivarekue",
                })}
              </p>
            )}
          </div>

          {/* ✅ Document */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              {getTranslation(locale, {
                en: "Document",
                es: "Documento",
                ay: "Qillqa",
                qu: "Qillqa",
                gn: "Kuatia",
              })}
            </h3>
            <div className="space-y-3 mt-3">
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Document Number",
                    es: "Número de Documento",
                    ay: "Qillqa jakhuwi",
                    qu: "Qillqa yupayna",
                    gn: "Kuatia papapy",
                  })}
                </Label>
                <Input value={document?.document_number || "N/A"} readOnly />
              </div>
              {document?.expire_date && (
                <div>
                  <Label>
                    {getTranslation(locale, {
                      en: "Expiry Date",
                      es: "Fecha de Vencimiento",
                      ay: "Tukuña uru",
                      qu: "Tukuq p'unchay",
                      gn: "Opáva ára",
                    })}
                  </Label>
                  <Input value={formatDateOnly(document.expire_date)} readOnly />
                </div>
              )}
            </div>
          </div>

          {/* ✅ Location */}
          <div>
            <h3 className="text-xl font-semibold border-b pb-2">
              {getTranslation(locale, {
                en: "Location",
                es: "Ubicación",
                ay: "Chiqanaka",
                qu: "Maypi kaq",
                gn: "Tendápe",
              })}
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "City",
                    es: "Ciudad",
                    ay: "Marka",
                    qu: "Llaqta",
                    gn: "Táva",
                  })}
                </Label>
                <Input value={location?.city || "N/A"} readOnly />
              </div>
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "State",
                    es: "Estado",
                    ay: "Departamento",
                    qu: "Suyu",
                    gn: "Tetã",
                  })}
                </Label>
                <Input value={location?.state || "N/A"} readOnly />
              </div>
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Country",
                    es: "País",
                    ay: "Jacha suyu",
                    qu: "Mama llaqta",
                    gn: "Tetã tuicha",
                  })}
                </Label>
                <Input value={location?.country || "N/A"} readOnly />
              </div>
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Zip Code",
                    es: "Código Postal",
                    ay: "Postal chimpuq",
                    qu: "Postal chimpuy",
                    gn: "Código postal",
                  })}
                </Label>
                <Input value={location?.zip_code || "N/A"} readOnly />
              </div>
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Latitude",
                    es: "Latitud",
                    ay: "Latitud",
                    qu: "Latitud",
                    gn: "Latitud",
                  })}
                </Label>
                <Input value={location?.lat || "N/A"} readOnly />
              </div>
              <div>
                <Label>
                  {getTranslation(locale, {
                    en: "Longitude",
                    es: "Longitud",
                    ay: "Longitud",
                    qu: "Longitud",
                    gn: "Longitud",
                  })}
                </Label>
                <Input value={location?.lng || "N/A"} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Footer Actions */}
        <SheetFooter className="flex justify-between items-center mt-auto pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={DeleteOwner}
            disabled={loading.delete}
          >
            {loading.delete ? (
              <CircularProgress size={16} />
            ) : (
              getTranslation(locale, {
                en: "Delete",
                es: "Eliminar",
                ay: "Chhaqtayaña",
                qu: "Chinkachiy",
                gn: "Mboguete",
              })
            )}
          </Button>

          <div className="flex gap-3">
            {status === 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={InactiveOwner}
                disabled={loading.inactive}
              >
                {loading.inactive ? (
                  <CircularProgress size={16} />
                ) : (
                  getTranslation(locale, {
                    en: "Inactive",
                    es: "Inactivo",
                    ay: "Jani ch'aman",
                    qu: "Mana llamk'aq",
                    gn: "Ndoikói",
                  })
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-green-800 hover:bg-green-700"
                onClick={ActiveOwner}
                disabled={loading.active}
              >
                {loading.active ? (
                  <CircularProgress size={16} />
                ) : (
                  getTranslation(locale, {
                    en: "Active",
                    es: "Activo",
                    ay: "Ch'aman",
                    qu: "Llamk'aq",
                    gn: "Oiko",
                  })
                )}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default OwnerAction;