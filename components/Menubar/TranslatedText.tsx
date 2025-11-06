"use client";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { operatorDashboardTranslations } from "../Dashboards/Operator/OperatorDashboardTranslations";

type LanguageCode = "en" | "es" | "ay" | "qu" | "gn";

type Greetings = {
  en: string;
  es?: string;
  ay?: string;
  qu?: string;
  gn?: string;
};

const TranslatedText = ({ greetings }: { greetings?: Greetings }) => {
  const language = useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) as LanguageCode;

  // ✅ fallback safety
  const activeGreeting =
    greetings?.[language] ??
    greetings?.en ??
    "";

  return activeGreeting;
};

export const TranslatedTaskText = ({ greetings }: { greetings: number }) => {
  const language = useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) as LanguageCode;

  const fn = operatorDashboardTranslations?.tasksToday?.[language];

  // ✅ safely handle function
  if (typeof fn === "function") {
    return fn(greetings);
  }

  return operatorDashboardTranslations.tasksToday.en(greetings);
};

export default TranslatedText;
