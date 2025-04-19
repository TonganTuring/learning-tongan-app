import { SignIn } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <SignIn />
      </div>
    </main>
  );
} 