// ExpandedSidebar.tsx - CORRECTED CODE
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import LOGO from "@/assets/traclog.png";
import Image from "next/image";
import ToogleButton from "./ToogleButton";
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
  LogIcon,
  LogOutIcon,
  PermissionsIcon,
  RolesIcon,
  UsersIcon,
  FarmerIcon,
} from "@/assets/sidebar/SidebarImages";
import type { RootState } from "@/redux/store";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { updateActiveMenu } from "@/redux/Sidebar/SidebarShow";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const getTranslation = (locale: string, translations: any) => {
  return translations[locale] || translations["en"];
};

type Translations = {
  inventory: string;
  billing: string;
  settings: string;
  bookings: string;
  users: string;
  credit: string;
};

const ExpandedSidebar = () => {
  const [activeLeftSIdeTag, setActiveLeftSideTag] = useState("Dashboard");
  const [inventoryShow, setInventoryShow] = useState(false);
  const [billingShow, setBillingShow] = useState(false);
  const [bookingShow, setBookingShow] = useState(false);
  const [settingShow, setSettingShow] = useState(false);
  const [userShow, setUserShow] = useState(false);
  const [creditShow, setCreditShow] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { activeMenu: LeftSideSctiveItem, sidebarShow } = useSelector(
    (root: RootState) => root.SidebarShow
  );
  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const pathMap: { [key: string]: string } = {
    "/": "Dashboard",
    "/ParticularBooking": "Bookings",
    "/Services": "services",
    "/Category": "Category",
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
    "/Currencymanagement": "Currency Management",
    "/Creditpackage": "Credit Package",
  };

  useEffect(() => {
    const activeTag = Object.keys(pathMap).find((key) =>
      pathname.includes(key)
    );
    if (activeTag && pathMap[activeTag] !== activeLeftSIdeTag) {
      setActiveLeftSideTag(pathMap[activeTag]);
      dispatch(updateActiveMenu(pathMap[activeTag]));
    }
  }, [pathname, activeLeftSIdeTag, dispatch]);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLDivElement;
      target.scrollTop += e.deltaY;
    };
    const section = sectionRef.current;
    if (section) {
      section.addEventListener("wheel", handleScroll);
    }
    return () => {
      if (section) {
        section.removeEventListener("wheel", handleScroll);
      }
    };
  }, []);

  const topLeftSideList = [
    {
      icon: (
        <Image
          src={DashboardIcon || "/placeholder.svg"}
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
          src={FarmsIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Farms"
        />
      ),
      name: getTranslation(locale, {
        en: "Farms",
        es: "Campos",
        ay: "Chhijllaña",
        qu: "Qichwasqa",
        gn: "Ñemityha",
      }),
      route: "/Farms",
    },
    {
      icon: (
        <Image
          src={BusinessIcon || "/placeholder.svg"}
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
          src={TractorsIcon || "/placeholder.svg"}
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
          src={LoanssIcon || "/placeholder.svg"}
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
          src={InvestorsIcon || "/placeholder.svg"}
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
    {
      icon: (
        <Image
          src={FarmerIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="service"
        />
      ),
      name: getTranslation(locale, {
        en: "Category",
        es: "Categoria",
        ay: "Ch'iqi",
        qu: "Suyuchay",
        gn: "Mboja'o",
      }),
      route: "/Category",
    },
    {
      icon: (
        <Image
          src={BusinessIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="service"
        />
      ),
      name: getTranslation(locale, {
        en: "Service",
        es: "Servicios",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Services",
    },
  ];

  const middleLeftSideList = [
    {
      icon: (
        <Image
          src={StatementsIcon || "/placeholder.svg"}
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
          src={PaymentHistoryIcon || "/placeholder.svg"}
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
      route: "/PaymentHistory",
    },
    {
      icon: (
        <Image
          src={PaymentMethodsIcon || "/placeholder.svg"}
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
          src={AccountingIcon || "/placeholder.svg"}
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
          src={BookingIcon || "/placeholder.svg"}
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
          src={LogIcon || "/placeholder.svg"}
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
      route: "/Lease",
    },
    {
      icon: (
        <Image
          src={LogOutIcon || "/placeholder.svg"}
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
          src={SubcriptionsIcon || "/placeholder.svg"}
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
      route: "/Subscriptions",
    },
    {
      icon: (
        <Image
          src={SubcriptionsIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Subscriptions"
        />
      ),
      name: getTranslation(locale, {
        en: "Booking inquiry",
        es: "",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/booking-inquiry",
    },
  ];

  const creditList = [
    {
      icon: (
        <Image
          src={StatementsIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Currency Management"
        />
      ),
      name: getTranslation(locale, {
        en: "Currency Management",
        es: "Gestión de Moneda",
        ay: "Qullqi apnaqawi",
        qu: "Qullqi kamachiy",
        gn: "Viru ñangareko",
      }),
      route: "/Currencymanagement",
    },
    {
      icon: (
        <Image
          src={PaymentHistoryIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Credit Package"
        />
      ),
      name: getTranslation(locale, {
        en: "Credit Package",
        es: "Paquete de Crédito",
        ay: "Qullqi ch’ani",
        qu: "Qullqi ch’aniq",
        gn: "Crédito mba’e’aty",
      }),
      route: "/Creditpackage",
    },
  ];

  const SettingsOptions = [
    {
      icon: (
        <Image
          src={RolesIcon || "/placeholder.svg"}
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
          src={PermissionsIcon || "/placeholder.svg"}
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
          src={UsersIcon || "/placeholder.svg"}
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
          src={UsersIcon || "/placeholder.svg"}
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
          src={AffiliationIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Notifications"
        />
      ),
      name: getTranslation(locale, {
        en: "Logs",
        es: "",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Logs",
    },
  ];

  const UsersOptions = [
    {
      icon: (
        <Image
          src={RolesIcon || "/placeholder.svg"}
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
          src={FarmerIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Farmers"
        />
      ),
      name: getTranslation(locale, {
        en: "Farmers",
        es: "Agricultores",
        ay: "Yapuchirinaka",
        qu: "Chakra runas",
        gn: "Kokue jára",
      }),
      route: "/Farmers",
    },
    {
      icon: (
        <Image
          src={AgentIcon || "/placeholder.svg"}
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
          src={DealersIcon || "/placeholder.svg"}
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
      route: "/Dealer",
    },
    {
      icon: (
        <Image
          src={OperatorsIcon || "/placeholder.svg"}
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
    {
      icon: (
        <Image
          src={OperatorsIcon || "/placeholder.svg"}
          className="w-[20px] h-auto object-cover"
          width={20}
          height={20}
          alt="Admins"
        />
      ),
      name: getTranslation(locale, {
        en: "Admins",
        es: "",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Admin",
    },
  ];

  const translations: Record<string, Translations> = {
    en: {
      inventory: "Inventory",
      billing: "Billing",
      settings: "Settings",
      bookings: "Bookings",
      users: "Users",
      credit: "Credit",
    },
    es: {
      inventory: "Inventario",
      billing: "Facturación",
      settings: "Configuraciones",
      bookings: "Reservas",
      users: "Usuarios",
      credit: "Crédito",
    },
    ay: {
      inventory: "Lurawi utanaka",
      billing: "Jisk'a qallta",
      settings: "Qillqatanaka",
      bookings: "Qillqatapxañani",
      users: "Jach'a uywiri",
      credit: "Qullqi",
    },
    qu: {
      inventory: "Hawa llaqtaqmasi",
      billing: "Wasiwi",
      settings: "Chaskiykuna",
      bookings: "Llamk'apay",
      users: "Runa",
      credit: "Qullqi",
    },
    gn: {
      inventory: "Ñemitype",
      billing: "Kamby rehegua",
      settings: "Ñemohenda",
      bookings: "Jehechauka",
      users: "Póry",
      credit: "Crédito",
    },
  };

  return (
    <motion.div
      className={`w-[200px] p-5 flex flex-col gap-[20px] box-content bg-[#ededed] h-screen transition-all duration-500 absolute ${
        sidebarShow ? "translate-x-0" : "-translate-x-full"
      } top-0 z-10 overflow-auto`}
      ref={sectionRef}
      style={{
        scrollbarWidth: "none",
      }}
    >
      <Image
        alt="Logo"
        src={LOGO || "/placeholder.svg"}
        className="w-[80%] h-auto object-cover mx-auto"
      />
      <ToogleButton />
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <ul className="flex flex-col gap-[8px]">
        {topLeftSideList.map((listItem, index) => (
          <Link
            href={`${listItem.route}`}
            key={index}
            className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
              LeftSideSctiveItem === listItem.name
                ? "bg-[#d5ebd6]"
                : "hover:bg-gray-200"
            } drop-shadow-md rounded transition-all duration-500 relative`}
          >
            {listItem.icon}
            <span
              className={`${
                LeftSideSctiveItem === listItem.name
                  ? "text-black"
                  : "text-gray-600"
              }`}
            >
              {listItem.name}
            </span>
          </Link>
        ))}
      </ul>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.users || translations.en.users}
          </p>
          <div
            onClick={() => {
              setUserShow((pre) => !pre);
            }}
          >
            {userShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {userShow &&
            UsersOptions.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.bookings || translations.en.bookings}
          </p>
          <div
            onClick={() => {
              setBookingShow((pre) => !pre);
            }}
          >
            {bookingShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {bookingShow &&
            bookingList.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.inventory || translations.en.inventory}
          </p>
          <div
            onClick={() => {
              setInventoryShow((pre) => !pre);
            }}
          >
            {inventoryShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {inventoryShow &&
            inventoryList.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.billing || translations.en.billing}
          </p>
          <div
            onClick={() => {
              setBillingShow((pre) => !pre);
            }}
          >
            {billingShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {billingShow &&
            middleLeftSideList.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.credit || translations.en.credit}
          </p>
          <div
            onClick={() => {
              setCreditShow((pre) => !pre);
            }}
          >
            {creditShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {creditShow &&
            creditList.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
      <div className="w-full h-[2px] bg-gray-300 rounded-full" />
      <div>
        <div className="flex items-center justify-between">
          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.settings || translations.en.settings}
          </p>
          <div
            onClick={() => {
              setSettingShow((pre) => !pre);
            }}
          >
            {settingShow ? (
              <ChevronDown className="rotate-180 transition-all duration-500" />
            ) : (
              <ChevronDown className="rotate-0 transition-all duration-500" />
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {settingShow &&
            SettingsOptions.map((listItem, index) => (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${
                  LeftSideSctiveItem === listItem.name
                    ? "bg-[#d5ebd6]"
                    : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${
                    LeftSideSctiveItem === listItem.name
                      ? "text-black"
                      : "text-gray-600"
                  }`}
                >
                  {listItem.name}
                </span>
              </Link>
            ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default ExpandedSidebar;