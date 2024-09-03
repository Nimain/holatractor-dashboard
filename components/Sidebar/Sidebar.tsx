"use client";

import { RootState } from "@/redux/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ExpandedSidebar from "./ExpandedSidebar";

import LOGO from "@/assets/traclog.png";
import ToogleButton from "./ToogleButton";
import { usePathname } from "next/navigation";
import {
  AgentIcon,
  BookingIcon,
  BusinessIcon,
  DashboardIcon,
  DealersIcon,
  FarmsIcon,
  InvestorsIcon,
  LoanssIcon,
  OperatorsIcon,
  PaymentHistoryIcon,
  PaymentMethodsIcon,
  StatementsIcon,
  SubcriptionsIcon,
  TractorsIcon,
  AccountingIcon,
  AffiliationIcon,
  InsuranceIcon,
  PermissionsIcon,
  RolesIcon,
  UsersIcon,
  LogIcon,
  LogOutIcon,
} from "@/assets/sidebar/SidebarImages";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import { ReceiptIcon, SettingsIcon } from "lucide-react";

const getTranslation = (locale: string, translations: any) => {
  return translations[locale] || translations["en"];
};

type Translations = {
  inventory: string;
  billing: string;
  settings: string;
  bookings: string;
  users: string
};

const Sidebar = () => {
  const [activeLeftSIdeTag, setActiveLeftSideTag] = useState("Dashboard");

  const pathname = usePathname();

  const { sidebarShow, activeMenu: LeftSideSctiveItem } = useSelector(
    (root: RootState) => root.SidebarShow
  );
  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const pathMap: { [key: string]: string } = {
    "/": "Dashboard",
    "/ParticularBooking": "Bookings",
    "/SingleOperator": "Operators",
    "/Operators": "Operators",
    "/Farms": "Farms",
    "/Agents": "Agents",
    "/Bookings": "Bookings",
    "/Roles": "Roles",
    "/Permissions": "Permission",
    "/Users": "Users",
    "/Inventory": "Tractors",
    "/Subscription": "Subscriptions",
    "/Business": "Business",
    "/Dealers": "Dealers",
    "/Affiliation": "Affiliation",
    "/Logs": "Logs",
    "/Insurance": "Insurance",
    "/Investors": "Investors",
    "/Loans": "Loans",
    "/Statements": "Statements",
    "/PaymentHistory": "Payment history",
    "/PaymentMethods": "Payment methods",
    "/Accounting": "Accounting",
    "/Attachments": "Attachments",
    "/Store": "Store",
  };

  useEffect(() => {
    const activeTag = Object.keys(pathMap).find((key) =>
      pathname.includes(key)
    );
    if (activeTag && pathMap[activeTag] !== activeLeftSIdeTag) {
      setActiveLeftSideTag(pathMap[activeTag]);
    }
  }, [pathname]);

  const topLeftSideList = [
    {
      icon: (
        <Image
          src={DashboardIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Dashboard"
        />
      ),
      name: getTranslation(locale, {
        en: "Dashboard",
        es: "Panel",
        ay: "Kuntasiña",
        qu: "Rimanakuyta apakuy",
        gn: "Tembikuaa",
      }),
      route: "/",
    },
    {
      icon: (
        <Image
          src={FarmsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Farms"
        />
      ),
      name: getTranslation(locale, {
        en: "Farms",
        es: "Granjas",
        ay: "Chhijllaña",
        qu: "Qichwasqa",
        gn: "Ñemityha",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={BusinessIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Business"
        />
      ),
      name: getTranslation(locale, {
        en: "Business",
        es: "Negocio",
        ay: "Kamani",
        qu: "Ruwasqa",
        gn: "Negósio",
      }),
      route: "#",
    },
  ];

  const inventoryList = [
    {
      icon: (
        <Image
          src={TractorsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Tractors"
        />
      ),
      name: getTranslation(locale, {
        en: "Tractors",
        es: "Tractores",
        ay: "Wichari",
        qu: "Qhapaqyaq",
        gn: "Traktór",
      }),
      route: "/Inventory",
    },
    {
      icon: (
        <Image
          src={LoanssIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Attachments"
        />
      ),
      name: getTranslation(locale, {
        en: "Attachments",
        es: "Adjuntos",
        ay: "Uchawi",
        qu: "Aqha",
        gn: "Jepya",
      }),
      route: "/Attachments",
    },
    {
      icon: (
        <Image
          src={InvestorsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Store"
        />
      ),
      name: getTranslation(locale, {
        en: "Store",
        es: "Tienda",
        ay: "Wawa",
        qu: "Qatari",
        gn: "Nda’ari",
      }),
      route: "/Store",
    },
  ];

  const middleLeftSideList = [
    {
      icon: (
        <Image
          src={StatementsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Statements"
        />
      ),
      name: getTranslation(locale, {
        en: "Statements",
        es: "Declaraciones",
        ay: "Jach’a qilqaña",
        qu: "Yachayniyuq",
        gn: "Ñe’ēpa",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={PaymentHistoryIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Payment History"
        />
      ),
      name: getTranslation(locale, {
        en: "Payment History",
        es: "Historial de pagos",
        ay: "Qullqi qhippacha",
        qu: "Qullqi ch’akchinay",
        gn: "Rekuérdo repóha",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={PaymentMethodsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Payment Methods"
        />
      ),
      name: getTranslation(locale, {
        en: "Payment Methods",
        es: "Métodos de pago",
        ay: "Qullqi lurañani",
        qu: "Qullqi llank’ay",
        gn: "Ñemongueta",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={AccountingIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Accounting"
        />
      ),
      name: getTranslation(locale, {
        en: "Accounting",
        es: "Contabilidad",
        ay: "Qillqaña",
        qu: "Qataña",
        gn: "Contabilidad",
      }),
      route: "#",
    },
  ];

  const bookingList = [
    {
      icon: (
        <Image
          src={BookingIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Bookings"
        />
      ),
      name: getTranslation(locale, {
        en: "Bookings",
        es: "Reservaciones",
        ay: "Manq’asa",
        qu: "Qhapaq ñakariy",
        gn: "Tavisa",
      }),
      route: "/Bookings",
    },
    {
      icon: (
        <Image
          src={LogIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Lease"
        />
      ),
      name: getTranslation(locale, {
        en: "Lease",
        es: "Arrendamiento",
        ay: "Uru purisiri",
        qu: "Masi",
        gn: "Ipotĩ",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={LogOutIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Share"
        />
      ),
      name: getTranslation(locale, {
        en: "Share",
        es: "Compartir",
        ay: "Ayniri",
        qu: "Rimanakuy",
        gn: "Mboja’aha",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={SubcriptionsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Subscriptions"
        />
      ),
      name: getTranslation(locale, {
        en: "Subscriptions",
        es: "Suscripciones",
        ay: "Churasa",
        qu: "Qhatariynin",
        gn: "Ñemity",
      }),
      route: "#",
    },
  ];

  const SettingsOptions = [
    {
      icon: (
        <Image
          src={RolesIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Roles"
        />
      ),
      name: getTranslation(locale, {
        en: "Roles",
        es: "Roles",
        ay: "Tukuyani",
        qu: "Llamk’aqkuna",
        gn: "Ñangarekóva",
      }),
      route: "/Roles",
    },
    {
      icon: (
        <Image
          src={PermissionsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Permission"
        />
      ),
      name: getTranslation(locale, {
        en: "Permission",
        es: "Permiso",
        ay: "Ayniri",
        qu: "Hap'iy",
        gn: "Permiso",
      }),
      route: "/Permissions",
    },
    {
      icon: (
        <Image
          src={UsersIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Country"
        />
      ),
      name: getTranslation(locale, {
        en: "Country",
        es: "País",
        ay: "Marka",
        qu: "Suyu",
        gn: "Tetã",
      }),
      route: "/Country",
    },
    {
      icon: (
        <Image
          src={UsersIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="City"
        />
      ),
      name: getTranslation(locale, {
        en: "City",
        es: "",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/City",
    },
    {
      icon: (
        <Image
          src={AffiliationIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Notifications"
        />
      ),
      name: getTranslation(locale, {
        en: "Notifications",
        es: "Notificaciones",
        ay: "Yatiyaña",
        qu: "Rimaykunap",
        gn: "Aviso",
      }),
      route: "#",
    },
  ];
  
  const UsersOptions = [
    {
      icon: (
        <Image
          src={RolesIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Roles"
        />
      ),
      name: getTranslation(locale, {
        en: "Owner",
        es: "",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Owner",
    },
    {
      icon: (
        <Image
          src={AgentIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Agents"
        />
      ),
      name: getTranslation(locale, {
        en: "Agents",
        es: "Agentes",
        ay: "Aruskipiri",
        qu: "Waqaypa qhapaqkuna",
        gn: "Agente",
      }),
      route: "/Agent",
    },
    {
      icon: (
        <Image
          src={DealersIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Dealers"
        />
      ),
      name: getTranslation(locale, {
        en: "Dealers",
        es: "Distribuidores",
        ay: "Wanakuta",
        qu: "Haqllaqkuna",
        gn: "Mba’apoha",
      }),
      route: "#",
    },
    {
      icon: (
        <Image
          src={OperatorsIcon}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Operators"
        />
      ),
      name: getTranslation(locale, {
        en: "Operators",
        es: "Operadores",
        ay: "Jach'a uywiri",
        qu: "Qhapaq ruwariq",
        gn: "Omoñangáva",
      }),
      route: "/Operator",
    },
  ];

  // Define translations for "Inventory", "Billing", and "Settings"
  const translations: Record<string, Translations> = {
    en: {
      inventory: "Inventory",
      billing: "Billing",
      settings: "Settings",
      bookings: "Bookings",
      users: "Users"
    },
    es: {
      inventory: "Inventario",
      billing: "Facturación",
      settings: "Configuraciones",
      bookings: "Reservas",
      users: "Usuarios"
    },
    ay: {
      inventory: "Lurawi utanaka",
      billing: "Jisk'a qallta",
      settings: "Qillqatanaka",
      bookings: "Qillqatapxañani",
      users: "Jach'a uywiri"
    },
    qu: {
      inventory: "Hawa llaqtaqmasi",
      billing: "Wasiwi",
      settings: "Chaskiykuna",
      bookings: "Llamk'apay",
      users: "Runa"
    },
    gn: {
      inventory: "Ñemitype",
      billing: "Kamby rehegua",
      settings: "Ñemohenda",
      bookings: "Jehechauka",
      users: "Póry"
    },
  };
  

  return (
    <div
      className={`w-[36px] p-[10px] transition-all duration-500 box-content bg-[#ededed]`}
    >
      <div className={`w-full transition-all duration-500 box-content bg-[#ededed] h-fit min-h-screen ${sidebarShow ? "hidden" : "flex flex-col gap-[20px]"}`}>
      <Image
        alt="Logo"
        src={LOGO}
        className="w-[80%] h-auto object-cover mx-auto"
      />

      <ToogleButton />

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <ul className="flex flex-col gap-[8px]">
        {topLeftSideList.map((listItem, index) => {
          return (
            <Link
              href={`${listItem.route}`}
              key={index}
              className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
              } drop-shadow-md rounded transition-all duration-500 relative`}
              onClick={() => {
                setActiveLeftSideTag(listItem.name);
              }}
            >
              <Tooltip title={listItem.name} placement="right">
                {listItem.icon}
              </Tooltip>
            </Link>
          );
        })}
      </ul>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>
        <div className="flex items-center justify-center w-full aspect-square rounded-full bg-gray-200 shadow-xl">
          <Tooltip title={translations[locale]?.users || translations.en.users} placement="right">
            <Image
              src={InsuranceIcon}
              className="w-[20px] h-auto object-cover"
              width={20}
              height={20}
              alt="Bookings"
            />
          </Tooltip>
        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {UsersOptions.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
                onClick={() => {
                  setActiveLeftSideTag(listItem.name);
                }}
              >
                <Tooltip title={listItem.name} placement="right">
                  {listItem.icon}
                </Tooltip>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>
        <div className="flex items-center justify-center w-full aspect-square rounded-full bg-gray-200 shadow-xl">
          <Tooltip title={translations[locale]?.bookings || translations.en.bookings} placement="right">
            <Image
              src={InsuranceIcon}
              className="w-[20px] h-auto object-cover"
              width={20}
              height={20}
              alt="Bookings"
            />
          </Tooltip>
        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {bookingList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
                onClick={() => {
                  setActiveLeftSideTag(listItem.name);
                }}
              >
                <Tooltip title={listItem.name} placement="right">
                  {listItem.icon}
                </Tooltip>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>
        <div className="flex items-center justify-center w-full aspect-square rounded-full bg-gray-200 shadow-xl">
          <Tooltip title={translations[locale]?.inventory || translations.en.inventory} placement="right">
            <Image
              src={InsuranceIcon}
              className="w-[20px] h-auto object-cover"
              width={20}
              height={20}
              alt="Statements"
            />
          </Tooltip>
        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {inventoryList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
                onClick={() => {
                  setActiveLeftSideTag(listItem.name);
                }}
              >
                <Tooltip title={listItem.name} placement="right">
                  {listItem.icon}
                </Tooltip>
              </Link>
            );
          })}
        </ul>
      </div>

      <div>
          <div className="flex items-center justify-center w-full aspect-square rounded-full bg-gray-200 shadow-xl">
            <Tooltip title={translations[locale]?.billing || translations.en.billing} placement="right">
              <ReceiptIcon />
            </Tooltip>
          </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {middleLeftSideList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
                onClick={() => {
                  setActiveLeftSideTag(listItem.name);
                }}
              >
                <Tooltip title={listItem.name} placement="right">
                  {listItem.icon}
                </Tooltip>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

          <div className="flex items-center justify-center w-full aspect-square rounded-full bg-gray-200 shadow-xl">
            <Tooltip title={translations[locale]?.settings || translations.en.settings} placement="right">
              <SettingsIcon />
            </Tooltip>
          </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {SettingsOptions.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`flex gap-[10px] w-fit mx-auto aspect-square rounded-full items-center justify-center ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
                onClick={() => {
                  setActiveLeftSideTag(listItem.name);
                }}
              >
                <Tooltip title={listItem.name} placement="right">
                  {listItem.icon}
                </Tooltip>
              </Link>
            );
          })}
        </ul>
        </div>
        <ExpandedSidebar />
    </div>
  );
};

export default Sidebar;
