"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dealerTranslations, Language } from "@/utils/translation/dealerTranslations";

interface DealerLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof dealerTranslations.en) => string;
}

const DealerLanguageContext = createContext<DealerLanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => dealerTranslations.en[key] || (key as string),
});

export const DealerLanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load language preference from cookie or localStorage
    if (typeof window !== "undefined") {
      const savedLang = document.cookie
        .split("; ")
        .find((row) => row.startsWith("dealer_lang="))
        ?.split("=")[1] as Language;

      if (savedLang === "es" || savedLang === "en") {
        setLanguageState(savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof document !== "undefined") {
      document.cookie = `dealer_lang=${lang}; path=/; max-age=31536000;`;
    }
  };

  const t = (key: keyof typeof dealerTranslations.en): string => {
    return dealerTranslations[language]?.[key] || dealerTranslations.en[key] || (key as string);
  };

  return (
    <DealerLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </DealerLanguageContext.Provider>
  );
};

export const useDealerLanguage = () => useContext(DealerLanguageContext);
