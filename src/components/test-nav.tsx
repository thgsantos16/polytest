"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TestNav() {
  const pathname = usePathname();

  return (
    <div className="flex space-x-4">
      <Link
        href="/"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          pathname === "/"
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        Trading
      </Link>
      <Link
        href="/test"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          pathname === "/test"
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        🧪 Test Suite
      </Link>
    </div>
  );
}
