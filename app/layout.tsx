import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import BackgroundImage from "./components/BackgroundImage";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "간단한 캘린더 앱",
  description: "Next.js와 FullCalendar로 만든 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <BackgroundImage />
        {children}
      </body>
    </html>
  );
}
