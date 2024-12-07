"use client"

import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import { operatorDashboardTranslations } from '../Dashboards/Operator/OperatorDashboardTranslations';

type LanguageCode = 'en' | 'es' | 'ay' | 'qu' | 'gn';

type Greetings = {
    en: string;
    es: string;
    ay: string;
    qu: string;
    gn: string;
  };

const TranslatedText = ({ greetings }:{ greetings: Greetings }) => {
    const language = useSelector((state: RootState) => state.ActiveLanguage.language) as LanguageCode;
const activeGreeting = greetings[language] || greetings.en;
  return activeGreeting
}

export const TranslatedTaskText = ({ greetings }:{ greetings: number }) => {
    const language = useSelector((state: RootState) => state.ActiveLanguage.language) as LanguageCode;
const activeGreeting = operatorDashboardTranslations.tasksToday[language](greetings) || operatorDashboardTranslations.tasksToday.en(greetings);
  return activeGreeting
}

export default TranslatedText