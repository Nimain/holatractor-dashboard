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
} from "@/assets/sidebar/SidebarImages";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import { ReceiptIcon, SettingsIcon } from "lucide-react";

const getTranslation = (locale: string, translations: any) => {
  return translations[locale] || translations["en"];
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
    "/Tractors": "Tractors",
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
        fr: "Tableau de bord",
        pt: "Painel",
        de: "Armaturenbrett",
        ko: "계기반",
        es: "Panel",
        sv: "Instrumentbräda",
        en: "Dashboard",
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
        fr: "Fermes",
        pt: "Fazendas",
        de: "Bauernhöfe",
        ko: "전원",
        es: "Granjas",
        sv: "Gårdar",
        en: "Farms",
      }),
      // route: "/Farms/AllFarms",
      route: "#",
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
        fr: "Agents",
        pt: "Agentes",
        de: "Agenten",
        ko: "자치령 대표",
        es: "Agentes",
        sv: "Agenter",
        en: "Agents",
      }),
      // route: "/Agents",
      route: "#",
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
        fr: "Concessionnaires",
        pt: "Revendedores",
        de: "Händler",
        ko: "딜러",
        es: "Distribuidores",
        sv: "Återförsäljare",
        en: "Dealers",
      }),
      // route: "/Dealers",
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
        fr: "Les opérateurs",
        pt: "Operadores",
        de: "Betreiber",
        ko: "운영자",
        es: "Operadores",
        sv: "Operatörer",
        en: "Operators",
      }),
      // route: "/Operators",
      route: "#",
    },
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
        fr: "Réservations",
        pt: "Reservas",
        de: "Buchungen",
        ko: "예약",
        es: "Reservaciones",
        sv: "Bokningar",
        en: "Bookings",
      }),
      // route: "/Bookings/AllBookings",
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
        fr: "Entreprise",
        pt: "Negócios",
        de: "Geschäft",
        ko: "사업",
        es: "Negocio",
        sv: "Företag",
        en: "Business",
      }),
      // route: "/Business",
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
        fr: "Abonnements",
        pt: "Assinaturas",
        de: "Abonnements",
        ko: "구독",
        es: "Suscripciones",
        sv: "Prenumerationer",
        en: "Subscriptions",
      }),
      // route: "/Subscription",
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
        fr: "Tracteurs",
        pt: "Tratores",
        de: "Traktoren",
        ko: "트랙터",
        es: "Tractores",
        sv: "Traktorer",
        en: "Tractors",
      }),
      // route: "/Tractors/AllTractors",
      route: "#",
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
        fr: "Attachments",
        pt: "Attachments",
        de: "Attachments",
        ko: "Attachments",
        es: "Attachments",
        sv: "Attachments",
        en: "Attachments",
      }),
      // route: "/Attachments",
      route: "#",
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
        fr: "Store",
        pt: "Store",
        de: "Store",
        ko: "Store",
        es: "Store",
        sv: "Store",
        en: "Store",
      }),
      // route: "/Store",
      route: "#",
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
        fr: "Déclarations",
        pt: "Declarações",
        de: "Aussagen",
        ko: "진술",
        es: "Declaraciones",
        sv: "Uttalanden",
        en: "Statements",
      }),
      // route: "/Statements",
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
        fr: "Historique de paiement",
        pt: "Histórico de pagamento",
        de: "Zahlungshistorie",
        ko: "결제 내역",
        es: "Historial de pagos",
        sv: "Betalningshistorik",
        en: "Payment history",
      }),
      // route: "/PaymentHistory",
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
        fr: "Méthodes de payement",
        pt: "Métodos de Pagamento",
        de: "Zahlungsarten",
        ko: "결제 방법",
        es: "Métodos de pago",
        sv: "Betalningsmetoder",
        en: "Payment methods",
      }),
      // route: "/PaymentMethods",
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
        fr: "Comptabilité",
        pt: "Contabilidade",
        de: "Buchhaltung",
        ko: "회계",
        es: "Contabilidad",
        sv: "Bokföring",
        en: "Accounting",
      }),
      // route: "/Accounting",
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
        fr: "Les rôles",
        pt: "Funções",
        de: "Rollen",
        ko: "역할",
        es: "Roles",
        sv: "Roller",
        en: "Roles",
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
        fr: "Autorisation",
        pt: "Permissão",
        de: "Erlaubnis",
        ko: "허가",
        es: "Permiso",
        sv: "Lov",
        en: "Permission",
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
          alt="Users"
        />
      ),
      name: getTranslation(locale, {
        fr: "Utilisateurs",
        pt: "Comercial",
        de: "Benutzer",
        ko: "사용자",
        es: "Usuarios",
        sv: "Användare",
        en: "Users",
      }),
      route: "/Users",
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
        fr: "Notifications",
        pt: "Notificações",
        de: "Benachrichtigungen",
        ko: "알림",
        es: "Notificaciones",
        sv: "Aviseringar",
        en: "Notifications",
      }),
      // route: "/Notifications",
      route: "#",
    },
  ];

  // Define translations for "Inventory", "Billing", and "Settings"
  const translations = {
    en: {
      inventory: "Inventory",
      billing: "Billing",
      settings: "Settings",
    },
    fr: {
      inventory: "Inventaire",
      billing: "Facturation",
      settings: "Paramètres",
    },
    pt: {
      inventory: "Inventário",
      billing: "Faturamento",
      settings: "Configurações",
    },
    de: {
      inventory: "Inventar",
      billing: "Abrechnung",
      settings: "Einstellungen",
    },
    ko: {
      inventory: "재고",
      billing: "청구",
      settings: "설정",
    },
    es: {
      inventory: "Inventario",
      billing: "Facturación",
      settings: "Configuraciones",
    },
    sv: {
      inventory: "Inventering",
      billing: "Fakturering",
      settings: "Inställningar",
    },
  };

  return (
    <div
      className={`w-[36px] p-[10px] transition-all duration- flex flex-col gap-[20px] box-content bg-[#ededed]`}
    >
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
          <Tooltip title={"Inventory"} placement="right">
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
            <Tooltip title={"Billing"} placement="right">
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
            <Tooltip title={"Settings"} placement="right">
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
        <ExpandedSidebar />
    </div>
  );
};

export default Sidebar;
