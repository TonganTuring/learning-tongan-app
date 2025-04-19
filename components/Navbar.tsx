'use client';

import Image from "next/image";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <div className="w-full flex justify-center p-4">
      <nav className="flex items-center justify-between px-4 py-4 max-w-6xl w-full border border-black/5 bg-white/70 backdrop-blur-md shadow-sm rounded-xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors">
            <Image
              src="/logo.svg"
              alt="LearningTongan.com Logo"
              width={32}
              height={32}
              className="text-[#722F37]"
            />
            <span className="text-xl font-semibold">LearningTongan.com</span>
          </Link>

          {isSignedIn && (
            <>
              <Link
                href="/dashboard"
                className="navbar-link"
              >
                Dashboard
              </Link>
              <Link
                href="/edit-flashcards"
                className="navbar-link"
              >
                Edit Flashcards
              </Link>
            </>
          )}
          <Link
            href="/bible/gen/1"
            className="navbar-link"
          >
            Read Tongan
          </Link>
          <Link
            href="/learn"
            className="navbar-link"
          >
            Learn Tongan
          </Link>
        </div>

        <div>
          {isSignedIn ? (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: {
                    width: 40,
                    height: 40
                  }
                }
              }}
            />
          ) : (
            <Link
              href="/sign-in"
              className="secondary-button"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
} 