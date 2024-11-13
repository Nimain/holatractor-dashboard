"use client"

import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

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

export default TranslatedText