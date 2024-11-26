"use client";

import Map from "@/components/map";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Google Maps Demo</h1>
      <Map />
    </main>
  );
}
