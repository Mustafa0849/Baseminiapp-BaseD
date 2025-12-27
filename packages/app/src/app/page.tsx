'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';

// Dynamically import Dashboard with SSR disabled
const Dashboard = dynamic(
  () => import('@/components/Dashboard').then((mod) => mod.Dashboard),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="p-4">
        <Dashboard />
      </main>
    </div>
  );
}
