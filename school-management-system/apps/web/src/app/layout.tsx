import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "PCLU School Portal",
    template: "%s | PCLU School Portal",
  },
  description:
    "Polytechnic College of La Union — School Management System. Manage academics, finance, communication, and more.",
  keywords: [
    "school management",
    "PCLU",
    "student portal",
    "La Union",
    "education",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PCLU Portal",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>
        <QueryProvider>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "var(--radius)",
                fontFamily: "var(--font-outfit)",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
