import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type CurrencyCode = "CAD" | "USD";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  fxRate: number;
  formatPrice: (amountCAD: number, options?: { decimals?: boolean }) => string;
  formatPriceLabel: (label: string) => string;
  isUSD: boolean;
}

const STORAGE_KEY = "atn_currency";
const DEFAULT_FX = 0.72;

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function getStoredCurrency(): CurrencyCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "USD") return "USD";
  } catch {}
  return "CAD";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getStoredCurrency);
  const [fxRate, setFxRate] = useState(DEFAULT_FX);

  useEffect(() => {
    fetch("/api/fx-rate")
      .then((r) => r.json())
      .then((data) => {
        if (data.rate && typeof data.rate === "number") {
          setFxRate(data.rate);
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }, []);

  const formatPrice = useCallback(
    (amountCAD: number, options?: { decimals?: boolean }) => {
      const showDecimals = options?.decimals ?? false;
      if (currency === "USD") {
        const usd = amountCAD * fxRate;
        if (showDecimals || usd < 10) {
          return `US$${usd.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `US$${Math.round(usd).toLocaleString("en-CA")}`;
      }
      if (showDecimals) {
        return `CA$${amountCAD.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `CA$${amountCAD.toLocaleString("en-CA")}`;
    },
    [currency, fxRate]
  );

  const formatPriceLabel = useCallback(
    (label: string) => {
      const match = label.match(/^(?:from\s+)?\$([0-9,]+(?:\.\d+)?)$/i);
      if (!match) return label;
      const prefix = label.toLowerCase().startsWith("from") ? "from " : "";
      const numericStr = match[1].replace(/,/g, "");
      const amount = parseFloat(numericStr);
      if (isNaN(amount)) return label;
      return prefix + formatPrice(amount);
    },
    [formatPrice]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        fxRate,
        formatPrice,
        formatPriceLabel,
        isUSD: currency === "USD",
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
