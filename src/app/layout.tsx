import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-tech",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Dat Photo Command Center",
    template: "%s | Dat Photo Command Center",
  },
  description:
    "Shoot scheduling, quotes, invoicing, and gallery delivery for DatPhotography.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${cormorant.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          // Applied before paint so switching to light mode doesn't flash
          // the default dark theme on load.
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("dpcc-theme")==="light"){document.documentElement.classList.add("light")}}catch(e){}`,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
