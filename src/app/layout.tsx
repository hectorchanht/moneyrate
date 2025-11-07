import "@/theme/globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
// import Head from 'next/head';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Provider } from 'jotai';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Money Rate - Fiat Crypto Conversion",
  description: "Instantly fiat and crypto conversion for you and me.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const fullScreen = 'w-dvw h-dvh overflow-auto mx-auto p-4 md:px-2 sm:px-1';
  // const main = 'grid grid-cols-1 justify-between m-auto max-w-[800px] p-4 md:px-2 sm:px-1';

  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9591354036084214">
        <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Money Rate - Fiat Crypto Conversion" />
        <link rel="manifest" href="/site.webmanifest" />
        <script src="/clarity.js" async />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}
