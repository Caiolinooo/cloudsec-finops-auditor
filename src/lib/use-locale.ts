"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  isLocale,
  localeToHtmlLang,
  type Locale,
} from "@/lib/i18n";

const LOCALE_EVENT = "cloudsec-locale-change";

function readStoredLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const languages =
    navigator.languages?.length > 0
      ? [...navigator.languages]
      : [navigator.language];
  return detectBrowserLocale(languages);
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): Locale {
  return readStoredLocale();
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function useLocale(): {
  locale: Locale;
  setLocale: (next: Locale) => void;
} {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  function setLocale(next: Locale) {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = localeToHtmlLang(next);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }

  return { locale, setLocale };
}
