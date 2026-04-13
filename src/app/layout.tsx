import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { SupabaseInitializer } from "@/components/providers/SupabaseInitializer";

export const metadata: Metadata = {
  title: "Acme Insurance — Claims AI Engine",
  description: "Dynamic Claims Complexity Engine & Decision Summary Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-700 antialiased">
        <SupabaseInitializer>
          <Sidebar />
          <main className="ml-0 lg:ml-64 min-h-screen pt-14 lg:pt-0">
            {children}
          </main>
        </SupabaseInitializer>
      </body>
    </html>
  );
}
