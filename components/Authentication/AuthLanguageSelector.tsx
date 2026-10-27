"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { changeLanguage } from "@/redux/Language/ActiveLanguage";
import { Globe } from "lucide-react";

export const AuthLanguageSelector: React.FC = () => {
  const dispatch = useDispatch();
  const currentLang = useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) || "en";

  const isSpanish = currentLang === "es";

  const setLanguage = (lang: "en" | "es") => {
    dispatch(changeLanguage(lang));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("i18nextLng", lang);
        localStorage.setItem("user_preferred_language", lang);
        document.documentElement.lang = lang;
      } catch {}
    }
  };

  return (
    <div className="inline-flex items-center bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-md">
      <div className="flex items-center gap-1 pl-2 pr-1 text-white/70">
        <Globe className="w-3.5 h-3.5 text-white/80" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
          isSpanish
            ? "bg-white text-slate-900 shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
        title="Español"
      >
        <span className="text-xs">🇪🇸</span>
        <span>ES</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
          !isSpanish
            ? "bg-white text-slate-900 shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
        title="English"
      >
        <span className="text-xs">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
};

export default AuthLanguageSelector;
