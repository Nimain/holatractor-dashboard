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
  InsuranceIcon,
  LogIcon,
  LogOutIcon,
  PermissionsIcon,
  RolesIcon,
  UsersIcon,
} from "@/assets/sidebar/SidebarImages";
import { RootState } from "@/redux/store";
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
  users: string
};

const ExpandedSidebar = () => {
  const [activeLeftSIdeTag, setActiveLeftSideTag] = useState("Dashboard");
  const [inventoryShow, setInventoryShow] = useState(false)
  const [billingShow, setBillingShow] = useState(false)
  const [bookingShow, setBookingShow] = useState(false)
  const [settingShow, setSettingShow] = useState(false)
  const [userShow, setUserShow] = useState(false)

  const sectionRef = useRef<HTMLDivElement>(null)

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
      dispatch(updateActiveMenu(pathMap[activeTag])); // Dispatch action to update the store
    }
  }, [pathname, activeLeftSIdeTag, dispatch]);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLDivElement
      target.scrollTop += e.deltaY
    }

    const section = sectionRef.current
    if (section) {
      section.addEventListener('wheel', handleScroll)
    }

    return () => {
      if (section) {
        section.removeEventListener('wheel', handleScroll)
      }
    }
  }, [])

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
      route: "/Lease",
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
      route: "/Dealer",
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
    {
      icon: (
        <Image
          src={OperatorsIcon}
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
    <motion.div
      className={`w-[200px] p-5 flex flex-col gap-[20px] box-content bg-[#ededed] h-screen transition-all duration-500 absolute ${sidebarShow ? "translate-x-0" : "-translate-x-full"} top-0 z-10 overflow-auto`}
      ref={sectionRef}
      style={{
        scrollbarWidth: "none"
      }}
    >
      {/* <p className='text-primaryColor hidden text-[20px] font-[600] w-full 1200px:flex items-center justify-center'>
                Holatractor
            </p> */}

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
              className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                ? "bg-[#d5ebd6]"
                : "hover:bg-gray-200"
                } drop-shadow-md rounded transition-all duration-500 relative`}
            >
              {listItem.icon}
              <span
                className={`${LeftSideSctiveItem === listItem.name
                  ? "text-black"
                  : "text-gray-600"
                  }`}
              >
                {listItem.name}
              </span>
            </Link>
          );
        })}
      </ul>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>
        <div className="flex items-center justify-between">

          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.users || translations.en.users}
          </p>

          <div onClick={() => { setUserShow(pre => !pre) }}>
            {
              userShow ?
                <ChevronDown className="rotate-180 transition-all duration-500" />
                :
                <ChevronDown className="rotate-0 transition-all duration-500" />
            }
          </div>

        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {userShow && UsersOptions.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
                  } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${LeftSideSctiveItem === listItem.name
                    ? "text-black"
                    : "text-gray-600"
                    }`}
                >
                  {listItem.name}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>

        <div className="flex items-center justify-between">

          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.bookings || translations.en.bookings}
          </p>

          <div onClick={() => { setBookingShow(pre => !pre) }}>
            {
              bookingShow ?
                <ChevronDown className="rotate-180 transition-all duration-500" />
                :
                <ChevronDown className="rotate-0 transition-all duration-500" />
            }
          </div>

        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {bookingShow && bookingList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
                  } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${LeftSideSctiveItem === listItem.name
                    ? "text-black"
                    : "text-gray-600"
                    }`}
                >
                  {listItem.name}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>

        <div className="flex items-center justify-between">

          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.inventory || translations.en.inventory}
          </p>

          <div onClick={() => { setInventoryShow(pre => !pre) }}>
            {
              inventoryShow ?
                <ChevronDown className="rotate-180 transition-all duration-500" />
                :
                <ChevronDown className="rotate-0 transition-all duration-500" />
            }
          </div>

        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {inventoryShow && inventoryList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
                  } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${LeftSideSctiveItem === listItem.name
                    ? "text-black"
                    : "text-gray-600"
                    }`}
                >
                  {listItem.name}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>

        <div className="flex items-center justify-between">

          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.billing || translations.en.billing}
          </p>

          <div onClick={() => { setBillingShow(pre => !pre) }}>
            {
              billingShow ?
                <ChevronDown className="rotate-180 transition-all duration-500" />
                :
                <ChevronDown className="rotate-0 transition-all duration-500" />
            }
          </div>

        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {billingShow && middleLeftSideList.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
                  } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${LeftSideSctiveItem === listItem.name
                    ? "text-black"
                    : "text-gray-600"
                    }`}
                >
                  {listItem.name}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-[2px] bg-gray-300 rounded-full" />

      <div>

        <div className="flex items-center justify-between">

          <p className="pl-[4px] text-[18px] font-[500] text-gray-700">
            {translations[locale]?.settings || translations.en.settings}
          </p>

          <div onClick={() => { setSettingShow(pre => !pre) }}>
            {
              settingShow ?
                <ChevronDown className="rotate-180 transition-all duration-500" />
                :
                <ChevronDown className="rotate-0 transition-all duration-500" />
            }
          </div>

        </div>

        <ul className="flex flex-col gap-[8px] mt-[8px]">
          {settingShow && SettingsOptions.map((listItem, index) => {
            return (
              <Link
                href={`${listItem.route}`}
                key={index}
                className={`text-[20px] font-[500] flex gap-[10px] px-[10px] py-[6px] items-center cursor-pointer ${LeftSideSctiveItem === listItem.name
                  ? "bg-[#d5ebd6]"
                  : "hover:bg-gray-200"
                  } drop-shadow-md rounded transition-all duration-500 relative`}
              >
                {listItem.icon}
                <span
                  className={`${LeftSideSctiveItem === listItem.name
                    ? "text-black"
                    : "text-gray-600"
                    }`}
                >
                  {listItem.name}
                </span>
              </Link>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
};

export default ExpandedSidebar;
