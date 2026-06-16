const BUY_KEYWORDS = [
  "куплю",
  "заказ",
  "оформ",
  "заброн",
  "хочу купить",
  "сколько стоит",
  "цена",
  "доставк",
  "забрать",
  "запишите",
  "перезвон",
  "свяжитесь",
  "номер телефона",
];

const PHONE_REGEX =
  /(?:\+7|8)[\s(-]?\d{3}[\s)-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;

export type LeadIntent = {
  hasIntent: boolean;
  phone: string | null;
  note: string | null;
};

export function detectLeadIntent(text: string): LeadIntent {
  const lower = text.toLowerCase();
  const phoneMatch = text.match(PHONE_REGEX);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "").replace(/^8/, "7") : null;
  const hasKeyword = BUY_KEYWORDS.some((k) => lower.includes(k));
  const hasIntent = Boolean(phone) || hasKeyword;

  return {
    hasIntent,
    phone: phone ? `+${phone.startsWith("7") ? phone : `7${phone}`}` : null,
    note: hasIntent ? text.slice(0, 500) : null,
  };
}
