import "@/theme/globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
// import Head from 'next/head';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import ThemeApplier from '@/components/ThemeApplier';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SITE_URL } from '@/lib/pairs';
import { Provider } from 'jotai';
import Script from 'next/script';

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
  metadataBase: new URL(SITE_URL),
  title: "Money Rate - Fiat Crypto Conversion",
  description: "Instantly fiat and crypto conversion for you and me.",
  openGraph: {
    title: "Money Rate - Fiat Crypto Conversion",
    description: "Instantly fiat and crypto conversion for you and me.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Money Rate - Fiat Crypto Conversion",
    description: "Instantly fiat and crypto conversion for you and me.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  // const fullScreen = 'w-dvw h-dvh overflow-auto mx-auto p-4 md:px-2 sm:px-1';
  // const main = 'grid grid-cols-1 justify-between m-auto max-w-[800px] p-4 md:px-2 sm:px-1';

  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Money Rate - Fiat Crypto Conversion" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <Provider>
          <ThemeApplier />
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </Provider>

        {/* Microsoft Clarity — loaded only when a project id is configured. */}
        {clarityId && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`}
          </Script>
        )}
      </body>
    </html>
  );
}
