"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <p className="text-[#6B7280] text-sm font-medium">Loading LuminaCRM...</p>
    </div>
  );
}
