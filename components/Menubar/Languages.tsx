"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { changeLanguage } from "@/redux/Language/ActiveLanguage";
import { Button } from "@/components/ui/button";
import { Globe2, Check, Sparkles, ChevronDown, Languages as LanguagesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface LanguageOption {
  name: string;
  nativeName: string;
  locale: "en" | "es" | "pt" | "hi" | "ay" | "qu" | "gn";
  flag: string;
  region: string;
  greeting: string;
}

export const ALL_LANGUAGES: LanguageOption[] = [
  {
    name: "Spanish",
    nativeName: "Español",
    locale: "es",
    flag: "🇧🇴",
    region: "Bolivia / América Latina",
    greeting: "¡Bienvenido!",
  },
  {
    name: "English",
    nativeName: "English",
    locale: "en",
    flag: "🇺🇸",
    region: "Global Agri Operations",
    greeting: "Welcome!",
  },
  {
    name: "Portuguese",
    nativeName: "Português",
    locale: "pt",
    flag: "🇧🇷",
    region: "Brasil / América do Sul",
    greeting: "Bem-vindo!",
  },
  {
    name: "Hindi",
    nativeName: "हिन्दी",
    locale: "hi",
    flag: "🇮🇳",
    region: "India / Asian Hub",
    greeting: "नमस्ते!",
  },
  {
    name: "Aymara",
    nativeName: "Aymar aru",
    locale: "ay",
    flag: "🏔️",
    region: "Andes & Altiplano Boliviano",
    greeting: "Kamisaraki!",
  },
  {
    name: "Quechua",
    nativeName: "Runa Simi",
    locale: "qu",
    flag: "🌾",
    region: "Valles & Qullasuyu",
    greeting: "Allillanchu!",
  },
  {
    name: "Guarani",
    nativeName: "Avañe'ẽ",
    locale: "gn",
    flag: "🌿",
    region: "Gran Chaco & Tierras Bajas",
    greeting: "Mbaʼéichapa!",
  },
];

export default function Languages() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { language } = useSelector((state: RootState) => state.ActiveLanguage);

  const activeLang =
    ALL_LANGUAGES.find((l) => l.locale === language) || ALL_LANGUAGES[0];

  const handleSelectLanguage = (loc: any) => {
    dispatch(changeLanguage(loc));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("i18nextLng", loc);
        localStorage.setItem("user_preferred_language", loc);
        document.documentElement.lang = loc;
      } catch {}
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 h-9 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm hover:border-emerald-500/60 group"
        >
          <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm">{activeLang.flag}</span>
          <span className="font-extrabold tracking-tight">{activeLang.nativeName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors ml-0.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <LanguagesIcon className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Select Language / Seleccionar Idioma
            </DialogTitle>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Choose your preferred language for interfaces, agricultural reports, and notifications.
          </p>
        </DialogHeader>

        {/* ── LANGUAGES LIST ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {ALL_LANGUAGES.map((lang) => {
            const isSelected = language === lang.locale;

            return (
              <div
                key={lang.locale}
                onClick={() => handleSelectLanguage(lang.locale)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? "bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-500/70 dark:border-emerald-500/70 shadow-sm"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{lang.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xs ${
                          isSelected
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-900 dark:text-white group-hover:text-emerald-600"
                        }`}
                      >
                        {lang.nativeName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({lang.name})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {lang.region}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      isSelected
                        ? "bg-emerald-600 text-white border-transparent"
                        : "text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {lang.greeting}
                  </Badge>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Dynamic Localization</span>
          </span>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
