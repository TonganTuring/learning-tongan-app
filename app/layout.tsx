import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LearningTongan.com - Learn Tongan Language Online",
  description: "Learn the Tongan language online by reading the Bible and instantly creating flashcards to memorize new words.",
  keywords: "Tongan language, learn Tongan, Tongan lessons, Tongan vocabulary, Tongan pronunciation, Polynesian languages",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "LearningTongan.com - Learn Tongan Language Online",
    description: "Learn the Tongan language online by reading the Bible and instantly creating flashcards to memorize new words.",
    url: "https://learningtongan.com",
    siteName: "LearningTongan.com",
    images: [
      {
        url: '/seo_image.png',
        width: 1200,
        height: 630,
        alt: 'Learning Tongan Language Online',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "LearningTongan.com - Learn Tongan Language Online",
    description: "Learn the Tongan language online by reading the Bible and instantly creating flashcards to memorize new words.",
    images: ['/seo_image.png'],
    creator: '@learningtongan',
  },
  verification: {
    google: 'your-google-site-verification-code', // You'll need to add this after setting up Google Search Console
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}  
