"use client";

import React, { useState } from "react";
import Menubar from "../Menubar/Menubar";
import AdminSection from "./Admin";
import AdminUsersSection from "./AdminUsers";
import { Users, Shield } from "lucide-react";

const TABS = [
  { id: "admins", label: "Admin List", icon: Shield },
  { id: "users", label: "All Users", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AdminContainer = () => {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] bg-[#e5e5e5] relative overflow-auto">
      <Menubar pagename={"Admin"} />

      {/* Tab switcher */}
      <div className="mt-4 mb-2 flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              activeTab === id
                ? "bg-slate-900 text-white border-transparent shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "admins" && <AdminSection />}
      {activeTab === "users" && <AdminUsersSection />}
    </div>
  );
};

export default AdminContainer;