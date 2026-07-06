import type { Metadata } from "next";
import "../styles/tokens.css";
import "../styles/hcp.css";
import "../styles/app.css";
import Shell from "../components/Shell";

export const metadata: Metadata = {
  title: "Collections Teammate — Housecall Pro",
  description: "An AR-owning member of the Housecall Pro AI Team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="hcp">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
