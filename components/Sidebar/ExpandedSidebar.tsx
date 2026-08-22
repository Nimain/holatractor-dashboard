// ExpandedSidebar.tsx - CORRECTED CODE
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import LOGO from "@/assets/traclog.png";
import Image from "next/image";
import ToogleButton from "./ToogleButton";
import {
  LayoutDashboard,
  LandPlot,
  Radio,
  Briefcase,
  Users,
  Sprout,
  Headphones,
  Store,
  HardHat,
  ShieldCheck,
  CalendarCheck,
  FileSignature,
  Share2,
  Repeat,
  HelpCircle,
  Tractor,
  Wrench,
  Layers,
  LayoutGrid,
  Settings2,
  Coins,
  Package,
  Ticket,
  ShoppingCart,
  Receipt,
  FileText,
  History,
  CreditCard,
  Calculator,
  Settings,
  Shield,
  Lock,
  Globe,
  Building2,
  ScrollText,
} from "lucide-react";
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
    "/Services": "Services",
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
    "/Devices": "Devices",
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
    "/Storetractors": "Storetractors",
    "/Currency": "Currency",
    "/Package": "Package",
    "/Coupon": "Coupon",
    "/Purchase": "Purchase",
    "/Owner": "Owner",
    "/Farmers": "Farmer",
    "/Admin": "Admins",
    "/Country": "Country",
    "/City": "City",
    "/Lease": "Lease",
    "/booking-inquiry": "inquiry",
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
      icon: <LayoutDashboard className="w-[20px] h-[20px] text-gray-700" />,
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
      icon: <LandPlot className="w-[20px] h-[20px] text-emerald-700" />,
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
      icon: <Radio className="w-[20px] h-[20px] text-blue-600" />,
      name: getTranslation(locale, {
        en: "Devices",
        es: "Dispositivos",
        ay: "Uñt’awinaka",
        qu: "Ruranakuna",
        gn: "Mba’e’okárape",
      }),
      route: "/Devices",
    },
  ];

  const inventoryList = [
    {
      icon: <Tractor className="w-[20px] h-[20px] text-green-700" />,
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
      icon: <Wrench className="w-[20px] h-[20px] text-gray-700" />,
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
      icon: <Store className="w-[20px] h-[20px] text-blue-600" />,
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
      icon: <Layers className="w-[20px] h-[20px] text-emerald-600" />,
      name: getTranslation(locale, {
        en: "Storetractors",
        es: "Tractores de Tienda",
        ay: "Qhatu Tractoranakuna",
        qu: "Qhatupaq Tractorkuna",
        gn: "Ñemuhã Mymbaha",
      }),
      route: "/Storetractors",
    },
    {
      icon: <LayoutGrid className="w-[20px] h-[20px] text-indigo-600" />,
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
      icon: <Settings2 className="w-[20px] h-[20px] text-amber-600" />,
      name: getTranslation(locale, {
        en: "Services",
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
      icon: <FileText className="w-[20px] h-[20px] text-blue-600" />,
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
      icon: <History className="w-[20px] h-[20px] text-emerald-600" />,
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
      icon: <CreditCard className="w-[20px] h-[20px] text-indigo-600" />,
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
      icon: <Calculator className="w-[20px] h-[20px] text-amber-600" />,
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
      icon: <CalendarCheck className="w-[20px] h-[20px] text-blue-600" />,
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
      icon: <FileSignature className="w-[20px] h-[20px] text-teal-600" />,
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
      icon: <Share2 className="w-[20px] h-[20px] text-purple-600" />,
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
      icon: <Repeat className="w-[20px] h-[20px] text-green-600" />,
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
      icon: <HelpCircle className="w-[20px] h-[20px] text-amber-600" />,
      name: getTranslation(locale, {
        en: "inquiry",
        es: "Consultas",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/booking-inquiry",
    },
  ];

  const creditList = [
    {
      icon: <Coins className="w-[20px] h-[20px] text-yellow-600" />,
      name: getTranslation(locale, {
        en: "Currency",
        es: "Moneda",
        ay: "Qullqi",
        qu: "Qullqi",
        gn: "Viru",
      }),
      route: "/Currency",
    },
    {
      icon: <Package className="w-[20px] h-[20px] text-blue-600" />,
      name: getTranslation(locale, {
        en: "Package",
        es: "Paquete",
        ay: "Qillqiri",
        qu: "Qillqipi",
        gn: "Paquete",
      }),
      route: "/Package",
    },
    {
      icon: <Ticket className="w-[20px] h-[20px] text-purple-600" />,
      name: getTranslation(locale, {
        en: "Coupon",
        es: "Cupón",
        ay: "Kuponi",
        qu: "Kupon",
        gn: "Kupon",
      }),
      route: "/Coupon",
    },
    {
      icon: <ShoppingCart className="w-[20px] h-[20px] text-emerald-600" />,
      name: getTranslation(locale, {
        en: "Purchase",
        es: "Compra",
        ay: "Allichiy",
        qu: "Rantiy",
        gn: "Ñemurã",
      }),
      route: "/Purchase",
    },
  ];

  const SettingsOptions = [
    {
      icon: <Shield className="w-[20px] h-[20px] text-blue-600" />,
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
      icon: <Lock className="w-[20px] h-[20px] text-amber-600" />,
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
      icon: <Globe className="w-[20px] h-[20px] text-emerald-600" />,
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
      icon: <Building2 className="w-[20px] h-[20px] text-indigo-600" />,
      name: getTranslation(locale, {
        en: "City",
        es: "Ciudad",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/City",
    },
    {
      icon: <ScrollText className="w-[20px] h-[20px] text-purple-600" />,
      name: getTranslation(locale, {
        en: "Logs",
        es: "Registros",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Logs",
    },
  ];

  const UsersOptions = [
    {
      icon: <Briefcase className="w-[20px] h-[20px] text-amber-700" />,
      name: getTranslation(locale, {
        en: "Owner",
        es: "Propietarios",
        ay: "",
        qu: "",
        gn: "",
      }),
      route: "/Owner",
    },
    {
      icon: <Sprout className="w-[20px] h-[20px] text-green-700" />,
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
      icon: <Headphones className="w-[20px] h-[20px] text-indigo-600" />,
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
      icon: <Store className="w-[20px] h-[20px] text-blue-700" />,
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
      icon: <HardHat className="w-[20px] h-[20px] text-orange-600" />,
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
      icon: <ShieldCheck className="w-[20px] h-[20px] text-red-600" />,
      name: getTranslation(locale, {
        en: "Admins",
        es: "Administradores",
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
