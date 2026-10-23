"use client";

import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import Menubar from "../Menubar/Menubar";
import JobsModerationSection from "./JobsModerationSection";
import { jobsTranslations } from "./JobsTranslations";

const JobsModerationContainer = () => {
  const { language } = useSelector((state: RootState) => state.ActiveLanguage);
  const langKey = language === "en" ? "en" : "es";
  const t = jobsTranslations[langKey];

  return (
    <div className="w-full min-h-[100vh] p-[10px] 1050px:p-[30px] bg-[#f4f6f8] relative overflow-auto">
      <Menubar pagename={t.pageTitle} />
      <JobsModerationSection />
    </div>
  );
};

export default JobsModerationContainer;
