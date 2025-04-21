"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

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
    <h1 className="text-3xl sm:text-5xl font-bold mb-4">
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
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleStartLearning = () => {
    if (isSignedIn) {
      router.push("/study");
    } else {
      router.push("/bible/gen/1");
    }
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <main className="h-screen overflow-hidden flex flex-col fixed w-full">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-4 h-full">
          <div className="text-center max-w-3xl mx-auto">
            <AnimatedText />
            <p className="sm:text-lg mb-4 px-14 sm:px-0">
              Learning Tongan is hard — this app makes it easier.
            </p>
            <button onClick={handleStartLearning} className="primary-button">
              Start learning Tongan
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
