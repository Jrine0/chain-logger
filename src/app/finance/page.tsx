"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card, Badge, Button, Input, SectionTitle } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";
import Link from "next/link";

type FinanceTab = "receipts" | "projects" | "allocations";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("receipts");

  const tabs: { key: FinanceTab; label: string; icon: string; href: string }[] = [
    { key: "receipts", label: "Receipts", icon: "📥", href: "/finance/receipts" },
    { key: "projects", label: "Projects", icon: "📁", href: "/finance/projects" },
    { key: "allocations", label: "Allocations", icon: "💰", href: "/finance/allocations" },
  ];

  return (
    <ProtectedRoute requiredRole="finance">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Portal</h1>
          <p className="mt-2 text-gray-500">
            Record receipts, create projects, and allocate funds.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-2xl bg-gray-200/60 p-1.5 w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Card accent="maroon">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl">
                📥
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Receipts</p>
                <p className="text-xl font-bold text-gray-900">—</p>
              </div>
            </div>
          </Card>
          <Card accent="gold">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-2xl">
                📁
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-xl font-bold text-gray-900">—</p>
              </div>
            </div>
          </Card>
          <Card accent="coral">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral-100 text-2xl">
                💰
              </div>
              <div>
                <p className="text-sm text-gray-500">Allocations Made</p>
                <p className="text-xl font-bold text-gray-900">—</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
