"use client";

import { useState, useEffect } from "react";

interface BotStats {
  totalUsers: number;
  totalWallets: number;
  totalPositions: number;
  botStatus: "active" | "inactive";
}

interface MonitorStatus {
  status: "active" | "inactive";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchMonitorStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_stats",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          ...data.stats,
          botStatus: "active",
        });
      } else {
        // Fallback to placeholder data
        setStats({
          totalUsers: 0,
          totalWallets: 0,
          totalPositions: 0,
          botStatus: "active",
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        totalUsers: 0,
        totalWallets: 0,
        totalPositions: 0,
        botStatus: "active",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitorStatus = async () => {
    try {
      const response = await fetch("/api/monitor");
      if (response.ok) {
        const data = await response.json();
        setMonitorStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch monitor status:", err);
    }
  };

  const toggleMonitoring = async () => {
    try {
      const action = monitorStatus?.status === "active" ? "stop" : "start";
      const response = await fetch("/api/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchMonitorStatus();
      }
    } catch (err) {
      console.error("Failed to toggle monitoring:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Telegram Bot Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.totalUsers || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Wallets
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.totalWallets || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Positions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.totalPositions || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        stats?.botStatus === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Bot Status
                      </dt>
                      <dd
                        className={`text-lg font-medium ${
                          stats?.botStatus === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stats?.botStatus === "active" ? "Active" : "Inactive"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        monitorStatus?.status === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM20 4v6h-2V4h2zM4 4v6h2V4H4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Transfer Monitoring
                      </dt>
                      <dd
                        className={`text-lg font-medium ${
                          monitorStatus?.status === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {monitorStatus?.status === "active"
                          ? "Active"
                          : "Inactive"}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={toggleMonitoring}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
                      monitorStatus?.status === "active"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {monitorStatus?.status === "active"
                      ? "Stop Monitoring"
                      : "Start Monitoring"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Bot Information
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Commands Available
                  </h4>
                  <ul className="mt-2 text-sm text-gray-900 space-y-1">
                    <li>• /start - Create wallet and get started</li>
                    <li>• /wallet - View wallet address and balance</li>
                    <li>• /balance - Check balances across all chains</li>
                    <li>• /markets - List available markets</li>
                    <li>• /positions - Show current positions</li>
                    <li>• /trade - Place a trade</li>
                    <li>• /monitor - Start/stop transfer monitoring</li>
                    <li>• /help - Show available commands</li>
                    <li>• /delete - Delete account (irreversible)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Security Features
                  </h4>
                  <ul className="mt-2 text-sm text-gray-900 space-y-1">
                    <li>• AES-256-CBC encryption for private keys</li>
                    <li>• Prisma ORM with SQLite database</li>
                    <li>• User isolation and data separation</li>
                    <li>• Secure key management</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    API Endpoints
                  </h4>
                  <ul className="mt-2 text-sm text-gray-900 space-y-1">
                    <li>• POST /api/telegram - Webhook handler</li>
                    <li>• POST /api/wallet - Wallet operations</li>
                    <li>• GET /api/markets - Market data</li>
                    <li>• POST/GET /api/monitor - Transfer monitoring</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Database Schema
                  </h4>
                  <ul className="mt-2 text-sm text-gray-900 space-y-1">
                    <li>• users - Telegram user information</li>
                    <li>• wallets - Encrypted wallet data</li>
                    <li>• positions - User trading positions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
