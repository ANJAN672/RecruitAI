import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { AuthProvider } from "@/lib/auth-context";
import { NavUser } from "@/lib/nav-user";
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
          <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <Link href="/" className="flex-shrink-0 flex items-center group">
                  <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold tracking-tight">RecruitAI</span>
                </Link>
                <NavUser />
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
