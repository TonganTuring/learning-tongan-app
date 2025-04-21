"use client";

import Image from 'next/image'
import Link from 'next/link'
import Navbar from "../../components/Navbar"

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 md:hidden">
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="waving hand">👋</span>
              Malo e lelei, I'm Dean...
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-16">
            <div className="col-span-1">
              <div className="relative w-full" style={{ paddingBottom: '177.78%' }}> {/* 9:16 aspect ratio */}
                <iframe 
                  src="https://share.descript.com/embed/JIKXv1rBrxM" 
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameBorder="0" 
                  allowFullScreen
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-2 hidden md:flex">
                <span role="img" aria-label="waving hand">👋</span>
                Malo e lelei, I'm Dean...
              </h1>
              <div className="space-y-4 text-lg">
                <p>
                  For years, I've wrestled with my Tongan identity.
                </p>
                <p>
                  Being from America, I've always felt a <span className="font-bold">"disconnect."</span></p>
                <p>
                  So I spent 29 days in Tonga tryna answer one question: <span className="font-bold">"what does it mean to be Tongan?"</span>
                </p>

                <p className="italic">
                  (you can read my answer <Link href="https://www.notion.so/deanuata/What-does-it-mean-to-be-Tongan-1794e829a99e8072b6f1effe9e9644f6" className="text-primary hover:underline">here</Link>)
                </p>
                <p>
                  Along the way I tried learning the language — the only problem?
                </p>
                <p>
                  It was hard.
                </p>
                <p>
                  There weren't many resources online.
                </p>
                <p>
                  So I built this app for Tongan learners like me.
                </p>
                <p>
                  I hope you enjoy using it as much as I enjoyed building it.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">App Demo</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                <p className="text-gray-600">Video demo coming soon...</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 underline">Key Features</h3>
                <ul className="space-y-3 text-lg">
                  <li><span className="font-semibold">Bible Reading:</span> Learn new words while reading with instant translations</li>
                  <li><span className="font-semibold">Flashcards:</span> Save and review words you wanna remember</li>
                  <li><span className="font-semibold">Practice:</span> Test yourself everyday</li>
                  <li><span className="font-semibold">Progress:</span> Set goals and track everything you learn</li>
                </ul>
              </div>
            </div>
          </section>

          <footer className="text-center text-gray-800 italic">
            Pssst... I'm always down to meet cool people, lets <Link href="https://www.linkedin.com/in/deanuata/" className="text-primary hover:underline">connect</Link> or you can check out my <Link href="https://deanuata.com" className="text-primary hover:underline">personal website</Link>.
          </footer>
        </div>
      </div>
    </main>
  )
}
