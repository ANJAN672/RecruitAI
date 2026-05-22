import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { SiteNav } from "@/lib/site-nav";
import { SWRProvider } from "@/lib/swr-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecruitAI",
  description: "AI-powered recruiting: requisitions, candidate ranking, sourcing, interview guides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-900 selection:bg-blue-100 selection:text-blue-900" suppressHydrationWarning>
        <AuthProvider>
          <SWRProvider>
            <SiteNav />
            <main>{children}</main>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
