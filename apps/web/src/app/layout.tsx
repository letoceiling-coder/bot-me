import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "botme — AI-ассистент для вашего бизнеса",
  description:
    "Подключите Avito и Telegram. Обучите ассистента. Не теряйте клиентов.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${onest.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
