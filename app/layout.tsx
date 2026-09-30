import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Sentence Changed. Who Gets Hit?",
  description:
    "An interactive change-impact demo: amend one clause of a fictional regulation and watch which fictional businesses are affected, with the full evidence trace. Demo data only - not legal advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
