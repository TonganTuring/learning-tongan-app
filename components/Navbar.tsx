'use client';

import Image from "next/image";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { getSupabaseClient } from "@/utils/supabase/supabase-client";
import { useAuth } from "@clerk/nextjs";
import { X, Menu } from "lucide-react";

export default function Navbar() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = await getSupabaseClient(token);
        const { data, error } = await supabase
          .from('users')
          .select('current_book, current_chapter')
          .eq('clerk_id', user.id)
          .single();

        if (error) throw error;
        
        setCurrentBook(data.current_book);
        setCurrentChapter(data.current_chapter);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    fetchUserProgress();
  }, [isSignedIn, user, getToken]);

  return (
    <div className="w-full flex justify-center p-4 z-[9999] relative">
      <nav className="flex items-center justify-between px-4 py-4 max-w-6xl w-full border border-black/5 bg-white backdrop-blur-md shadow-sm rounded-xl">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isSignedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="navbar-link"
                >
                  Dashboard
                </Link>
                <Link
                  href={currentBook && currentChapter ? `/bible/${currentBook}/${currentChapter}` : "/bible/gen/1"}
                  className="navbar-link"
                >
                  Read Tongan
                </Link>
                <Link
                  href="/study"
                  className="navbar-link"
                >
                  Study Tongan
                </Link>
                <Link
                  href="/edit"
                  className="navbar-link"
                >
                  Edit Flashcards
                </Link>
                <Link
                  href="/about"
                  className="navbar-link"
                >
                  About
                </Link>
              </>
            )}
            {!isSignedIn && (
              <>
                <Link
                  href="/bible/gen/1"
                  className="navbar-link"
                >
                  Read Tongan
                </Link>
                <Link
                  href="/about"
                  className="navbar-link"
                >
                  About
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-full hover:bg-[var(--beige)]"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed top-[72px] left-0 right-0 bg-white border-t border-black/5 shadow-lg rounded-b-xl z-[9999] transition-all duration-300 ease-in-out transform ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col py-4 relative">
            {isSignedIn && (
              <>
                <div className="absolute top-0 right-0 px-4 py-2">
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
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href={currentBook && currentChapter ? `/bible/${currentBook}/${currentChapter}` : "/bible/gen/1"}
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Read Tongan
                </Link>
                <Link
                  href="/study"
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Study Tongan
                </Link>
                <Link
                  href="/edit"
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Edit Flashcards
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-2 hover:bg-[var(--beige)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </>
            )}
            {!isSignedIn && (
              <>
                <Link
                  href="/bible/gen/1"
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Read Tongan
                </Link>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 hover:bg-[var(--beige)] border-b border-black/5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/about"
                  className="px-4 py-2 hover:bg-[var(--beige)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Desktop User Profile */}
        <div className="hidden md:block">
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