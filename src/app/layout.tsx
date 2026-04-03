import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { PostHogProvider, PostHogInit } from "@/lib/posthog";
import { PostHogPageView } from "@/components/PostHogPageView";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Native Works",
  description:
    "We define how digital products should work. Product clarity, system thinking, and decision quality for teams building complex products.",
  openGraph: {
    title: "Native Works",
    description: "Product clarity for teams building complex digital products.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <PostHogInit />
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
