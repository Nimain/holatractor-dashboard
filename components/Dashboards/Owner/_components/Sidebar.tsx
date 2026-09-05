"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Store as StoreIcon,
  UserSearch,
  Wallet,
  TabletSmartphone,
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  ShoppingBag,
  Users,
  LogOut,
} from "lucide-react";
import { useCookie } from "next-cookie";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Tooltip } from "@mui/material";
import { useDispatch } from "react-redux";
import { changeNewStoreShow } from "@/redux/NewStoreShow/NewStoreShow";
import { useRouter, usePathname } from "next/navigation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { ownerSidebar } from "./OwnerSidebarTranslations";
import { useOwnerStoreContext } from "@/components/wrappers/StoreProvider";

import { getAuthUser, getAuthUserId } from "@/utils/auth/clientAuth";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showStoreList, setShowStoreList] = useState(false);

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser;
  const authUser = getAuthUser();
  const user: user = parsedUser || authUser || {};
  const currentUserId = user?.userId || authUser.userId || getAuthUserId();
  const pathname = usePathname();

  const { fetchOwner, stores, loading } = useOwnerStoreContext();
  const dispatch = useDispatch();
  const router = useRouter();

  function handleLogOut() {
    const cookiesToRemove = [
      "access_token",
      "user",
      "isFarmer",
      "isOperator",
      "isAgent",
      "isOwner",
      "isDealer",
      "isODealer",
    ];

    cookiesToRemove.forEach((name) => {
      cookie.remove(name, { path: "/" });
      cookie.remove(name);
      if (typeof document !== "undefined") {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    router.push("/login");
  }

  useEffect(() => {
    fetchOwner();
  }, []);

  const isActive = (path: string) => pathname === path || (path !== "/owner" && pathname.startsWith(path));

  const linkBaseClasses =
    "w-full flex items-center gap-3 text-xs font-semibold rounded-xl px-3 py-2.5 transition-all cursor-pointer";

  return (
    <aside
      className={`my-3 h-[calc(100vh-24px)] rounded-2xl bg-[#800000] text-white shadow-xl transition-all duration-300 flex flex-col py-5 px-3 shrink-0 ${
        isExpanded ? "w-[250px]" : "w-[72px]"
      }`}
    >
      {/* Stitch Header Brand Logo */}
      <div className="mb-5 flex items-center justify-between px-1">
        <Link href="/owner" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
            <Image
              src="https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"
              alt="Holatractor Logo"
              width={24}
              height={24}
              className="h-6 w-auto object-contain"
            />
          </div>
          {isExpanded && (
            <div className="truncate">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
                Holatractor
              </h1>
              <p className="text-[10px] text-white/70 font-medium truncate">Owner Dashboard</p>
            </div>
          )}
        </Link>

        <Button
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-7 w-7 p-0 shrink-0"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation List matching Stitch Sidebar Specs */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {/* Dashboard Link */}
        <Link
          href="/owner"
          className={`${linkBaseClasses} ${
            isActive("/owner")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Dashboard" placement="right" disableHoverListener={isExpanded}>
            <LayoutDashboard className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.dashboard} /></span>}
        </Link>

        {/* Store Collapsible Link */}
        <Collapsible open={showStoreList} onOpenChange={setShowStoreList}>
          <CollapsibleTrigger asChild>
            <div
              className={`${linkBaseClasses} bg-transparent text-white/80 hover:bg-white/10 hover:text-white ${
                !isExpanded ? "justify-center px-0" : "justify-start"
              }`}
            >
              <Tooltip title="Stores" placement="right" disableHoverListener={isExpanded}>
                <StoreIcon className="h-5 w-5 shrink-0 text-white" />
              </Tooltip>
              {isExpanded && (
                <>
                  <span className="flex-1 text-left truncate">
                    <TranslatedText greetings={ownerSidebar.store} /> ({loading ? "..." : stores.length})
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showStoreList ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-8 pr-1 pt-1 space-y-1">
            {isExpanded && (
              <>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {stores.map((store, i) => (
                    <Link
                      key={i}
                      href={`/owner/stores/${store.id}`}
                      className={`block py-1.5 px-2.5 text-xs rounded-lg transition-colors truncate ${
                        isActive(`/owner/stores/${store.id}`)
                          ? "bg-white/20 font-bold text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {store.name}
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full flex items-center gap-1.5 justify-start bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs py-1.5 px-2.5 rounded-lg mt-1 transition-colors"
                  onClick={() => dispatch(changeNewStoreShow())}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <TranslatedText greetings={ownerSidebar.newStore} />
                </button>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bookings Link */}
        <Link
          href="/owner/bookings"
          className={`${linkBaseClasses} ${
            isActive("/owner/bookings")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Bookings" placement="right" disableHoverListener={isExpanded}>
            <CalendarCheck className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.bookings} /></span>}
        </Link>

        {/* Operators Link */}
        <Link
          href="/owner/operator"
          className={`${linkBaseClasses} ${
            isActive("/owner/operator")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Operator" placement="right" disableHoverListener={isExpanded}>
            <UserSearch className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.operator} /></span>}
        </Link>

        {/* Mechanics Link */}
        <Link
          href="/owner/mechanics"
          className={`${linkBaseClasses} ${
            isActive("/owner/mechanics")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Mechanics" placement="right" disableHoverListener={isExpanded}>
            <Wrench className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span>Mechanics</span>}
        </Link>

        {/* Marketplace Link */}
        <Link
          href="/owner/marketplace"
          className={`${linkBaseClasses} ${
            isActive("/owner/marketplace")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Marketplace" placement="right" disableHoverListener={isExpanded}>
            <ShoppingBag className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.marketplace} /></span>}
        </Link>

        {/* Devices Link */}
        <Link
          href="/owner/devicestractors"
          className={`${linkBaseClasses} ${
            isActive("/owner/devicestractors")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Devices" placement="right" disableHoverListener={isExpanded}>
            <TabletSmartphone className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.Devices} /></span>}
        </Link>

        {/* Payment Link */}
        <Link
          href="/owner/payment"
          className={`${linkBaseClasses} ${
            isActive("/owner/payment")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Payment" placement="right" disableHoverListener={isExpanded}>
            <Wallet className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.payment} /></span>}
        </Link>

        {/* Customers Link */}
        <Link
          href="/owner/customer"
          className={`${linkBaseClasses} ${
            isActive("/owner/customer")
              ? "bg-white/20 text-white font-bold shadow-sm"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          } ${!isExpanded ? "justify-center px-0" : "justify-start"}`}
        >
          <Tooltip title="Customers" placement="right" disableHoverListener={isExpanded}>
            <Users className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.customers} /></span>}
        </Link>
      </nav>

      {/* Logout Footer Section */}
      <div className="mt-auto border-t border-white/20 pt-2">
        <button
          type="button"
          onClick={handleLogOut}
          className={`${linkBaseClasses} bg-transparent text-white/80 hover:bg-white/20 hover:text-white ${
            !isExpanded ? "justify-center px-0" : "justify-start"
          }`}
        >
          <Tooltip title="Log out" placement="right" disableHoverListener={isExpanded}>
            <LogOut className="h-5 w-5 shrink-0 text-white" />
          </Tooltip>
          {isExpanded && <span><TranslatedText greetings={ownerSidebar.logOut} /></span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
