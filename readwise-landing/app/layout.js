import "./../styles/globals.css";
import { Inter } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Suspense } from 'react'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ReadWise - Finish What You Started",
  description:
    "Turn your unread books into finished stories. Organize your physical library digitally and actually finish the books you buy.",
  keywords: "reading app, book tracker, digital library, finish books",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-gray-800`}>
	  
		<Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          </div>
        }>
		  {children}
		</Suspense>  
		<GoogleAnalytics />
      </body>
    </html>
  );
}
