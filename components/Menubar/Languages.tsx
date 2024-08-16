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

const Languages = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const dispatch = useDispatch();
  const { language } = useSelector((state: RootState) => state.ActiveLanguage);

  const allLanguages = [
    { name: "English", locale: "en" },
    { name: "française", locale: "fr" },
    { name: "Português", locale: "pt" },
    { name: "Deutsch", locale: "de" },
    { name: "한국인", locale: "ko" },
    { name: "Español", locale: "es" },
    { name: "vsvenska", locale: "sv" },
  ];

  // Find the name corresponding to the current locale
  const currentLanguageName = allLanguages.find(
    (lang) => lang.locale === language
  )?.name || language; // Fallback to the locale if not found

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div
          className="font-bold text-[20px] bg-gradient-to-br from-[#fdfcfb] to-[#e2d1c3] px-[40px] py-[8px] rounded-md cursor-pointer"
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          {currentLanguageName}
        </div>
      </DialogTrigger>

      <DialogContent
        className="bg-white max-h-[90vh] overflow-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <DialogHeader>
          <p className="text-2xl font-bold">Select your prefered language</p>
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
              Close
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Languages;
