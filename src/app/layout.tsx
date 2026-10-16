import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai_Looped } from "next/font/google";
import "./globals.css";

/* Looped Thai is much easier for older readers than loopless "modern" Thai.
   The variable name is picked up by --font-sans in globals.css (@theme inline). */
const plexThai = IBM_Plex_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-plex-thai",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

const description =
  "น้องขมิ้น ผู้ช่วยแนะนำยาสมุนไพรในบัญชียาหลักแห่งชาติ — แนะนำเบื้องต้นเท่านั้น ไม่ได้แทนแพทย์หรือเภสัชกร";

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: {
    default: "ผู้ช่วยสมุนไพร",
    template: "%s · ผู้ช่วยสมุนไพร",
  },
  description,
  applicationName: "ผู้ช่วยสมุนไพร",
  /* Shown when the link is shared in LINE. */
  openGraph: {
    title: "ผู้ช่วยสมุนไพร",
    description,
    locale: "th_TH",
    type: "website",
  },
  /* Stop iOS turning doses like "3–4" into phone links.
     Real phone links (โทร 1669) are written as tel: links on purpose. */
  formatDetection: { telephone: false },
};

/* No maximumScale / userScalable: older users must be able to pinch-zoom. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f5a3a", // brand-700, matches the app header
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={plexThai.variable}>
      <body>{children}</body>
    </html>
  );
}
