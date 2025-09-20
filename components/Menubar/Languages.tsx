"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { changeLanguage } from "@/redux/Language/ActiveLanguage";
import { Button } from "../ui/button";

type Translations = {
  selectLanguage: string;
  close: string;
}

const Languages = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const dispatch = useDispatch();
  const { language } = useSelector((state: RootState) => state.ActiveLanguage);

  const allLanguages = [
    { name: "English", locale: "en" },
    { name: "Español", locale: "es" },
    { name: "Aymara", locale: "ay" },
    { name: "Quechua", locale: "qu" },
    { name: "Guarani", locale: "gn" },
  ];
  
  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  // Find the name corresponding to the current locale
  const currentLanguageName = allLanguages.find(
    (lang) => lang.locale === language
  )?.name || language; // Fallback to the locale if not found

  const translations: Record<string, Translations> = {
    en: {
      selectLanguage: "Select your preferred language",
      close: "Close",
    },
    es: {
      selectLanguage: "Seleccione su idioma preferido",
      close: "Cerrar",
    },
    ay: {
      selectLanguage: "Akhamawa jaqi arump jaysiña",
      close: "Khititaña",
    },
    qu: {
      selectLanguage: "Sut'iykimpaq rimayta akllay",
      close: "Wañuy",
    },
    gn: {
      selectLanguage: "Elei ñe'êmboyvegua",
      close: "Ñemboty",
    },
  };  

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
        className="bg-red-500 hover:bg-red-600"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          {currentLanguageName}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="bg-white max-h-[90vh] overflow-auto w-fit"
        style={{ scrollbarWidth: "none" }}
      >
        <DialogHeader>
          <p className="text-2xl font-bold">
          {translations[locale]?.selectLanguage || translations.en.selectLanguage}
          </p>
        </DialogHeader>

        <div className="w-[320px] bg-white text-black rounded-md px-[30px] py-[30px] flex flex-col gap-[6px] box-border relative">
          {allLanguages.map(({ name, locale }, index) => (
            <p
              key={index}
              className={`px-[10px] py-[6px] rounded-md cursor-pointer ${
                language === locale
                  ? "bg-green-400 text-white"
                  : "hover:bg-gray-200"
              } transition-all duration-500`}
              onClick={() => 
                dispatch(changeLanguage(locale))
              }
            >
              {name}
            </p>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <button
              name="add_task_cancel_button"
              className="text-white bg-black font-semibold px-5 py-2 rounded-md"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              {translations[locale].close || translations.en.close}
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Languages;
