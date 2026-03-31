import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kareli Gaam Convention RSVP",
  description: "RSVP website for the Kareli Gaam Convention in Dallas, Texas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}