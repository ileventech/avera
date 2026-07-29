'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type CurrencyOption = {
  code: string;        // ISO 4217 e.g. "USD"
  locale: string;      // BCP 47 locale e.g. "en-US"
  label: string;       // display name
  region: string;      // grouping label
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  // ── North America ──────────────────────────────────────────────────────────
  { code: 'USD', locale: 'en-US', label: 'US Dollar (USD)', region: 'Americas' },
  { code: 'CAD', locale: 'en-CA', label: 'Canadian Dollar (CAD)', region: 'Americas' },
  { code: 'MXN', locale: 'es-MX', label: 'Mexican Peso (MXN)', region: 'Americas' },

  // ── Europe ─────────────────────────────────────────────────────────────────
  { code: 'EUR', locale: 'de-DE', label: 'Euro (EUR)', region: 'Europe' },
  { code: 'GBP', locale: 'en-GB', label: 'British Pound (GBP)', region: 'Europe' },
  { code: 'CHF', locale: 'de-CH', label: 'Swiss Franc (CHF)', region: 'Europe' },
  { code: 'SEK', locale: 'sv-SE', label: 'Swedish Krona (SEK)', region: 'Europe' },
  { code: 'NOK', locale: 'nb-NO', label: 'Norwegian Krone (NOK)', region: 'Europe' },
  { code: 'DKK', locale: 'da-DK', label: 'Danish Krone (DKK)', region: 'Europe' },
  { code: 'PLN', locale: 'pl-PL', label: 'Polish Zloty (PLN)', region: 'Europe' },
  { code: 'CZK', locale: 'cs-CZ', label: 'Czech Koruna (CZK)', region: 'Europe' },
  { code: 'HUF', locale: 'hu-HU', label: 'Hungarian Forint (HUF)', region: 'Europe' },
  { code: 'RON', locale: 'ro-RO', label: 'Romanian Leu (RON)', region: 'Europe' },
  { code: 'BGN', locale: 'bg-BG', label: 'Bulgarian Lev (BGN)', region: 'Europe' },
  { code: 'TRY', locale: 'tr-TR', label: 'Turkish Lira (TRY)', region: 'Europe' },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { code: 'NGN', locale: 'en-NG', label: 'Nigerian Naira (NGN)', region: 'Africa' },
  { code: 'ZAR', locale: 'en-ZA', label: 'South African Rand (ZAR)', region: 'Africa' },
  { code: 'KES', locale: 'en-KE', label: 'Kenyan Shilling (KES)', region: 'Africa' },
  { code: 'GHS', locale: 'en-GH', label: 'Ghanaian Cedi (GHS)', region: 'Africa' },
  { code: 'EGP', locale: 'ar-EG', label: 'Egyptian Pound (EGP)', region: 'Africa' },
  { code: 'ETB', locale: 'am-ET', label: 'Ethiopian Birr (ETB)', region: 'Africa' },
  { code: 'TZS', locale: 'sw-TZ', label: 'Tanzanian Shilling (TZS)', region: 'Africa' },
  { code: 'UGX', locale: 'en-UG', label: 'Ugandan Shilling (UGX)', region: 'Africa' },
  { code: 'XOF', locale: 'fr-SN', label: 'West African CFA Franc (XOF)', region: 'Africa' },
  { code: 'XAF', locale: 'fr-CM', label: 'Central African CFA Franc (XAF)', region: 'Africa' },
  { code: 'MAD', locale: 'ar-MA', label: 'Moroccan Dirham (MAD)', region: 'Africa' },
  { code: 'DZD', locale: 'ar-DZ', label: 'Algerian Dinar (DZD)', region: 'Africa' },
  { code: 'TND', locale: 'ar-TN', label: 'Tunisian Dinar (TND)', region: 'Africa' },
  { code: 'ZMW', locale: 'en-ZM', label: 'Zambian Kwacha (ZMW)', region: 'Africa' },
  { code: 'MWK', locale: 'en-MW', label: 'Malawian Kwacha (MWK)', region: 'Africa' },
  { code: 'BWP', locale: 'en-BW', label: 'Botswana Pula (BWP)', region: 'Africa' },
  { code: 'MZN', locale: 'pt-MZ', label: 'Mozambican Metical (MZN)', region: 'Africa' },
  { code: 'RWF', locale: 'rw-RW', label: 'Rwandan Franc (RWF)', region: 'Africa' },
  { code: 'SOS', locale: 'so-SO', label: 'Somali Shilling (SOS)', region: 'Africa' },
  { code: 'LYD', locale: 'ar-LY', label: 'Libyan Dinar (LYD)', region: 'Africa' },
  { code: 'SZL', locale: 'en-SZ', label: 'Swazi Lilangeni (SZL)', region: 'Africa' },
  { code: 'NAD', locale: 'en-NA', label: 'Namibian Dollar (NAD)', region: 'Africa' },

  // ── Middle East / Asia ──────────────────────────────────────────────────────
  { code: 'AED', locale: 'ar-AE', label: 'UAE Dirham (AED)', region: 'Middle East' },
  { code: 'SAR', locale: 'ar-SA', label: 'Saudi Riyal (SAR)', region: 'Middle East' },
  { code: 'INR', locale: 'en-IN', label: 'Indian Rupee (INR)', region: 'Asia' },
  { code: 'CNY', locale: 'zh-CN', label: 'Chinese Yuan (CNY)', region: 'Asia' },
  { code: 'JPY', locale: 'ja-JP', label: 'Japanese Yen (JPY)', region: 'Asia' },
  { code: 'SGD', locale: 'en-SG', label: 'Singapore Dollar (SGD)', region: 'Asia' },
  { code: 'AUD', locale: 'en-AU', label: 'Australian Dollar (AUD)', region: 'Oceania' },
];

const STORAGE_KEY = 'avera_currency';
const DEFAULT_CODE = 'USD';

function getStoredCurrency(): CurrencyOption {
  if (typeof window === 'undefined') return CURRENCY_OPTIONS.find(c => c.code === DEFAULT_CODE)!;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = CURRENCY_OPTIONS.find(c => c.code === stored);
      if (found) return found;
    }
  } catch {
    // localStorage not available (e.g. SSR or private mode)
  }
  return CURRENCY_OPTIONS.find(c => c.code === DEFAULT_CODE)!;
}

/** Global reactive state — single source of truth across all hook consumers */
let _listeners: Array<(c: CurrencyOption) => void> = [];
let _current: CurrencyOption = getStoredCurrency();

function notifyListeners(c: CurrencyOption) {
  _current = c;
  _listeners.forEach(fn => fn(c));
}

export function setCurrencyGlobal(opt: CurrencyOption) {
  try { localStorage.setItem(STORAGE_KEY, opt.code); } catch { /* ignore */ }
  notifyListeners(opt);
}

/** Hook: consume the current org currency anywhere in the app */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyOption>(_current);

  useEffect(() => {
    // Subscribe to global changes (e.g. admin changes currency in settings)
    const handler = (c: CurrencyOption) => setCurrencyState(c);
    _listeners.push(handler);
    return () => { _listeners = _listeners.filter(fn => fn !== handler); };
  }, []);

  const formatCurrency = useCallback((val: number, compact = false): string => {
    if (compact) {
      // Smart axis formatter: scale K / M / B
      const symbol = getCurrencySymbol(currency.code, currency.locale);
      if (val >= 1_000_000_000) return `${symbol}${(val / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
      if (val >= 1_000_000)     return `${symbol}${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
      if (val >= 1_000)         return `${symbol}${(val / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
      return `${symbol}${val}`;
    }
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 0,
    }).format(val);
  }, [currency]);

  return { currency, formatCurrency };
}

function getCurrencySymbol(code: string, locale: string): string {
  try {
    return (0).toLocaleString(locale, { style: 'currency', currency: code, minimumFractionDigits: 0 })
      .replace(/[\d,.\s]/g, '').trim();
  } catch {
    return code;
  }
}

/** Hook for admin settings page — can also persist to DB */
export function useCurrencySetting() {
  const supabase = useMemo(() => createClient(), []);
  const { currency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // On mount, load from org_settings and sync global state
  useEffect(() => {
    supabase
      .from('org_settings')
      .select('value')
      .eq('key', 'currency')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const found = CURRENCY_OPTIONS.find(c => c.code === data.value);
          if (found) notifyListeners(found);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCurrency = useCallback(async (opt: CurrencyOption) => {
    setSaving(true);
    setMessage(null);
    setCurrencyGlobal(opt);

    // Upsert to org_settings — org_id is a simple text key 'default' shared across the org
    await supabase.from('org_settings').upsert(
      { org_id: 'default', key: 'currency', value: opt.code, updated_at: new Date().toISOString() },
      { onConflict: 'org_id,key' }
    );

    setSaving(false);
    setMessage(`Currency updated to ${opt.label}`);
    setTimeout(() => setMessage(null), 3000);
  }, [supabase]);

  return { currency, saveCurrency, saving, message };
}
