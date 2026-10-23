import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FeedbackProvider from "@/components/providers/FeedbackProvider";
import StoreProvider from "@/components/providers/StoreProvider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Eastman Smart Cart", template: "%s · Eastman Smart Cart" },
  description: "Shop campus essentials, manage your cart and check out fast.",
};

function HeaderFallback() {
  return <div className="sticky top-0 z-50 h-16 border-b border-[#e2e8f0] bg-white/85 md:h-20" />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <head>
        {/* Icon font used throughout the design. display=block hides icon names while it loads. */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font -- app router root layout, loads on every page */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..500,0..1,0&display=block"
        />
      </head>
      <body className="flex min-h-full flex-col font-sans text-body-md">
        <FeedbackProvider>
          <StoreProvider>
            <Suspense fallback={<HeaderFallback />}>
              <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
          </StoreProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
