import "./../styles/globals.css";
import { Inter, Fraunces } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Suspense } from 'react'
import Breadcrumbs from "../components/Breadcrumbs";
import Header from "../components/Header";

const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata = {
  title: "MyBookSelf - Know the library you own",
  description:
    "Digitise your physical bookshelf, see what you own and what you have read, and finish the books you buy.",
  keywords: "reading app, book tracker, digital library, home library, finish books",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.mybookself.com"),
  openGraph: {
    title: "MyBookSelf - Know the library you own",
    description: "Digitise your physical bookshelf and finish the books you buy.",
    siteName: "MyBookSelf",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${fraunces.variable} bg-peach-50 text-forest-900`}>
	  
		<Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          </div>
        }>
		<Header />
		<Breadcrumbs />
		  {children}
		</Suspense>  
		<GoogleAnalytics />
      </body>
    </html>
  );
}
