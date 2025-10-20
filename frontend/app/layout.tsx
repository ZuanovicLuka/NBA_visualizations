import "bootstrap/dist/css/bootstrap.min.css";
import type { Metadata } from "next";
import { Providers } from "./client";
import "./globals.css";

export const metadata: Metadata = {
  title: "NBetA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Providers>
        <body>{children}</body>
      </Providers>
    </html>
  );
}
