"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Languages from "@/components/Menubar/Languages";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Trash2, Zap, UserCheck, Sparkles, Tractor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useCookie } from "next-cookie";
import { FarmerNotification } from "@/utils/Types/types";
import { io, Socket } from "socket.io-client";
import { NestJsBaseURL, renderInstance } from "@/utils/Axios/RenderInstance";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { WelcomeTranslation } from "../FarmerTranslation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SwitchAccountModal from "@/components/wrappers/SwitchAccountModal";
import Link from "next/link";

interface User {
  userId: string;
  image: string;
  name: string;
  email: string;
  email_varified: boolean;
}

const Header = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<FarmerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser: any =
    typeof rawUser === "string"
      ? (() => {
          try {
            return JSON.parse(rawUser);
          } catch {
            return null;
          }
        })()
      : rawUser;
  const user: User = parsedUser || {};
  const userId = parsedUser?.userId || parsedUser?.id || parsedUser?.sub || parsedUser?._id;
  const access_token = cookie.get("access_token");

  const isOwner = cookie.get("isOwner") === "true";
  const isFarmer = cookie.get("isFarmer") === "true";
  const isDealer = cookie.get("isDealer") === "true";
  const isAgent = cookie.get("isAgent") === "true";
  const isOperator = cookie.get("isOperator") === "true";
  const hasMultipleRoles = [isOwner, isFarmer, isDealer, isAgent, isOperator].filter(Boolean).length > 1;

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    renderInstance
      .delete(`/farmer/deleteNotification/${id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .catch((err) => console.error("Error deleting notification:", err));
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    renderInstance
      .get(`/farmer/${userId}`)
      .then((res) => {
        setNotifications(Array.isArray(res.data?.notifications) ? res.data.notifications : []);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
      });
  };

  const showBrowserNotification = (notification: any) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
      });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  useEffect(() => {
    if (!isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const newSocket: Socket = io(NestJsBaseURL, {
        query: {
          userId: userId,
        },
      });
      setSocket(newSocket);

      newSocket.on("newFarmerNotification", (notification: FarmerNotification) => {
        showBrowserNotification(notification);
        setNotifications((prev) => [notification, ...prev]);
      });

      return () => {
        newSocket.disconnect();
      };
    } catch {}
  }, [userId]);

  if (!user) return null;

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 px-6 py-3.5 mb-6 sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm rounded-2xl">
      {/* Welcome Title */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <Tractor className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            <TranslatedText greetings={WelcomeTranslation} /> {user.name || "Farmer"}!
          </h2>
          <p className="text-xs text-slate-400 font-semibold">Agricultural Operations Dashboard</p>
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Switch Account (Shown only when user has 2+ roles) */}
        {hasMultipleRoles && (
          <>
            <Button
              onClick={() => setIsSwitchAccountOpen(true)}
              variant="outline"
              className="border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5 hover:bg-slate-50"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Switch Account
            </Button>
            <SwitchAccountModal
              isOpen={isSwitchAccountOpen}
              onClose={() => setIsSwitchAccountOpen(false)}
            />
          </>
        )}

        {/* 3-Tap Direct Booking Button */}
        <Link href="/farmer/new-booking">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-4 rounded-full text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition-all">
            <Zap className="w-3.5 h-3.5 fill-current" />
            3-Tap Booking
          </Button>
        </Link>

        <Languages />

        {/* Notifications */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative rounded-full border-slate-200 dark:border-slate-700">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Farmer Notifications</span>
                  <span className="text-xs text-slate-400 font-normal">{notifications.length} new</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-auto p-3 space-y-2">
                <AnimatePresence initial={false}>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full relative p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notification.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notification.message}</p>
                          </div>
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* User Avatar & Profile Link */}
        <Link href="/farmer/profile" title="View & Edit Profile">
          <Avatar className="h-9 w-9 border-2 border-emerald-500/40 hover:border-emerald-500 hover:scale-105 transition-all cursor-pointer shadow-sm">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs shadow-md">
              {(user.name || "Farmer").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;