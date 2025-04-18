"use client";

import Link from "next/link";
import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";

function AnimatedText() {
  const [isEnglish, setIsEnglish] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIsEnglish(!isEnglish);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [isEnglish]);

  return (
    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
      <span 
        className={`inline-block transition-all duration-300 ease-in-out ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4'
        }`}
      >
        {isEnglish ? (
          <>Wanna learn <span className="underline text-[var(--primary)]">Tongan</span>?</>
        ) : (
          <>
            Fie ako <span className="underline text-[var(--primary)]">lea fakatonga</span>?
          </>
        )}
      </span>
    </h1>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-3xl mx-auto">
          <AnimatedText />
          <p className="sm:text-lg mb-4">
            Learning Tongan is hard — this app makes it easier.
          </p>
          <Link href="/bible/MAT/1" className="primary-button">
            Start learning Tongan
          </Link>
        </div>
      </div>
    </main>
  );
}
