"use client";

import React from "react";
import Link from "next/link";
import { Mail, Shield, ShieldCheck, User, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { userProfileTranslations } from "../FarmerTranslation";

interface UserProfileCardProps {
  name: string;
  email: string;
  avatarUrl: string;
  isOnline: boolean;
  isEmailVerified: boolean;
}

export default function UserProfileCard({
  name,
  email,
  avatarUrl,
  isOnline,
  isEmailVerified,
}: UserProfileCardProps) {
  return (
    <Link href="/farmer/profile" className="block group">
      <Card className="w-full rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 rounded-2xl border-2 border-emerald-500/30">
            <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                {name}
              </h3>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Badge
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              isOnline
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {isOnline ? (
              <TranslatedText greetings={userProfileTranslations.online} />
            ) : (
              <TranslatedText greetings={userProfileTranslations.offline} />
            )}
          </Badge>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            {isEmailVerified ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
            <span>
              {isEmailVerified ? (
                <TranslatedText greetings={userProfileTranslations.emailVerified} />
              ) : (
                <TranslatedText greetings={userProfileTranslations.emailNotVerified} />
              )}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}