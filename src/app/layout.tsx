import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "FLOWMINDS'26 — AI-Powered Real-Time Stress & Vulnerability Assessment",
  description:
    "Prototype decision-support layer for first-contact grievance handling (SIH26093). AI recommends; trained personnel verify and act.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
