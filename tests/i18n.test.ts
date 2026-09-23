import { describe, expect, it } from "vitest";
import { apiErrorMessage, getCopy, riskLabel, statusLabel } from "@/lib/copy";
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  isLocale,
  localeToHtmlLang,
} from "@/lib/i18n";
import { SCENARIO_PRESETS } from "@/lib/presets";

describe("locale detection", () => {
  it("maps pt* to PT and everything else to EN", () => {
    expect(detectBrowserLocale(["pt-BR", "en-US"])).toBe("pt");
    expect(detectBrowserLocale(["pt"])).toBe("pt");
    expect(detectBrowserLocale(["en-US"])).toBe("en");
    expect(detectBrowserLocale([])).toBe(DEFAULT_LOCALE);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(localeToHtmlLang("pt")).toBe("pt-BR");
    expect(localeToHtmlLang("en")).toBe("en");
  });
});

describe("copy dictionaries", () => {
  it("keeps the same keys in EN and PT", () => {
    const en = getCopy("en");
    const pt = getCopy("pt");
    expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort());
    expect(Object.keys(en.errors).sort()).toEqual(Object.keys(pt.errors).sort());
  });

  it("localizes status, risk, and capacity errors", () => {
    expect(statusLabel("NON_COMPLIANT", "pt")).toBe("NÃO CONFORME");
    expect(statusLabel("NON_COMPLIANT", "en")).toBe("NON-COMPLIANT");
    expect(riskLabel("CRITICAL", "pt")).toBe("CRÍTICO");
    expect(riskLabel("CRITICAL", "en")).toBe("CRITICAL");
    expect(apiErrorMessage("MODEL_UNAVAILABLE", "pt")).toMatch(/demanda alta/i);
    expect(apiErrorMessage("MODEL_UNAVAILABLE", "en")).toMatch(/high demand/i);
  });

  it("localizes example chip labels", () => {
    for (const preset of SCENARIO_PRESETS) {
      expect(preset.label.en.length).toBeGreaterThan(0);
      expect(preset.label.pt.length).toBeGreaterThan(0);
      expect(preset.architecture_scenario.en.length).toBeGreaterThan(12);
      expect(preset.architecture_scenario.pt.length).toBeGreaterThan(12);
    }
  });
});
