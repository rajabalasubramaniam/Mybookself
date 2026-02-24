import "./../styles/globals.css";
import { Inter } from "next/font/google";

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
        {children}
      </body>
    </html>
  );
}
