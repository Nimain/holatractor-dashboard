"use client";

import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { operatorDashboardTranslations } from "../Dashboards/Operator/OperatorDashboardTranslations";

export type LanguageCode = "en" | "es" | "pt" | "hi" | "ay" | "qu" | "gn";

export type Greetings = {
  en: string;
  es?: string;
  pt?: string;
  hi?: string;
  ay?: string;
  qu?: string;
  gn?: string;
  [key: string]: string | undefined;
};

const TranslatedText = ({ greetings }: { greetings?: Greetings }) => {
  const language = useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) as LanguageCode;

  // Fallback chain: selected language -> Spanish (if Latin American) -> English
  const activeGreeting =
    greetings?.[language] ??
    (language === "pt" || language === "ay" || language === "qu" || language === "gn"
      ? greetings?.es || greetings?.en
      : greetings?.en) ??
    "";

  return activeGreeting;
};

export const TranslatedTaskText = ({ greetings }: { greetings: number }) => {
  const language = useSelector(
    (state: RootState) => state.ActiveLanguage.language
  ) as LanguageCode;

  const fn = (operatorDashboardTranslations?.tasksToday as any)?.[language];

  // safely handle function
  if (typeof fn === "function") {
    return fn(greetings);
  }

  return operatorDashboardTranslations?.tasksToday?.en
    ? operatorDashboardTranslations.tasksToday.en(greetings)
    : `${greetings} tasks`;
};

export default TranslatedText;
