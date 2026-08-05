"use client";

import TranslatedText from '@/components/Menubar/TranslatedText';
import React, { useEffect, useState } from 'react';
import { WelcomeTranslation } from '../../Farmer/FarmerTranslation';
import { useCookie } from 'next-cookie';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Languages from '@/components/Menubar/Languages';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { OwnerNotification } from '@/utils/Types/types';
import UpgradePlanModal from './UpgradePlanModal';

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const Header = () => {
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { cookie } = useCookie();
  const user: user = cookie.get("user");
  const access_token = cookie.get("access_token");

  const fetchNotifications = async () => {
    if (user?.userId) {
      renderInstance.get(`/owner/${user.userId}`).then((res) => {
        setNotifications(res.data.notifications || []);
      });
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    renderInstance.delete(`/owner/deleteNotification/${id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, []);

  useEffect(() => {
    if (!isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <header className="bg-white/90 backdrop-blur-md text-[#800000] border-b border-slate-200/80 px-6 py-3 sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm rounded-2xl">
      {/* Stitch Welcome Header */}
      <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#800000]">
        <TranslatedText greetings={WelcomeTranslation} /> {user?.name || "Abraham Nogales"}
      </h2>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        {/* Search Bar */}
        <div className="relative hidden sm:block w-56 lg:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] w-full text-slate-800 shadow-inner"
          />
        </div>

        {/* Upgrade Plan Button */}
        <Button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-full text-xs transition-all shadow-sm hover:shadow-md"
        >
          Upgrade Plan
        </Button>

        <UpgradePlanModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onSuccess={() => fetchNotifications()}
        />

        {/* Notifications Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-slate-100 p-2 text-slate-600 hover:text-[#800000]"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full animate-ping" />
              )}
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Notifications ({notifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-auto p-3">
                <AnimatePresence initial={false}>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full relative mb-2 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl group transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="pr-2">
                            <p className="text-xs font-bold text-slate-800">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {notification.message}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

        {/* Language Switcher */}
        <Languages />
      </div>
    </header>
  );
};

export default Header;