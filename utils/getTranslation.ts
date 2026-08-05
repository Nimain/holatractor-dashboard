export const getTranslation = (locale: string, translations: Record<string, string>): string => {
  return translations[locale] || translations["en"] || "";
};

export default getTranslation;
