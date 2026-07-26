"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function OrgSettingsPage() {
  return (
    <ProtectedRoute>
      <OrgSettingsContent />
    </ProtectedRoute>
  );
}

function OrgSettingsContent() {
  const { selectedOrg } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization &quot;{selectedOrg?.name}&quot; settings and members.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Organization Info</h2>
          <p className="mt-1 text-sm text-gray-500">Basic details about your organization.</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="text-sm text-gray-900">{selectedOrg?.name || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Slug</label>
              <p className="text-sm text-gray-900">{selectedOrg?.slug || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm text-gray-900">{selectedOrg?.description || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Role</h2>
          <p className="mt-1 text-sm text-gray-500">Your current role in this organization.</p>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-brand-50 text-brand-700 border border-brand-100 capitalize">
              {selectedOrg?.role || "viewer"}
            </span>
          </div>
          {selectedOrg?.role === "admin" && (
            <p className="mt-3 text-xs text-gray-400">
              As an admin, you can manage members, view all data, and perform all finance and vendor actions.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <p className="mt-1 text-sm text-gray-500">
            Organization members will appear here once the member management page is built.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">On-Chain Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Receipts, projects, invoices, and evidence are all stored on the Polygon blockchain.
          </p>
          <div className="mt-4">
            <a href={`https://polygonscan.com/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-700 hover:text-brand-800">
              View contract on PolygonScan →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
