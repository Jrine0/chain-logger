"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useWriteContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";

type Step = "connect" | "create-org" | "complete-profile" | "redirecting";

export default function AuthPage() {
  const router = useRouter();
  const { isConnected, connect, connectors, disconnect, address } = useAuth();
  const { data: hash, writeContract, isPending } = useWriteContract();

  const [step, setStep] = useState<Step>("connect");
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgCountry, setOrgCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // If wallet connected, move to create org step
  useEffect(() => {
    if (isConnected && step === "connect") {
      setStep("create-org");
    }
  }, [isConnected, step]);

  // If org created on-chain, move to profile step
  useEffect(() => {
    if (hash && step === "create-org") {
      setStep("complete-profile");
    }
  }, [hash, step]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName.trim()) {
      setError("Organization name is required.");
      return;
    }

    writeContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      abi: CHAIN_LOGGER_ABI,
      functionName: "createOrganization",
      args: [orgName.trim(), orgDescription.trim()],
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/org/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          orgName: orgName.trim(),
          orgDescription: orgDescription.trim(),
          website: orgWebsite.trim(),
          country: orgCountry.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setStep("redirecting");
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ChainLogger</h1>
          <p className="mt-2 text-gray-500">
            Connect your wallet and set up your organization to get started.
          </p>
        </div>

        {/* Step 1: Connect Wallet */}
        {step === "connect" && (
          <Card>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold text-gray-900">Connect Your Wallet</h2>
              <p className="mt-2 text-sm text-gray-500">
                You need a connected wallet to create your organization on-chain.
              </p>
            </div>
            <Button onClick={() => connect({ connector: connectors[0] })} className="w-full" size="lg">
              Connect Wallet
            </Button>
          </Card>
        )}

        {/* Step 2: Create Organization */}
        {step === "create-org" && (
          <Card>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-xl font-bold text-gray-900">Create Organization</h2>
              <p className="mt-2 text-sm text-gray-500">
                This creates an on-chain organization record.
              </p>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <Input
                label="Organization Name"
                placeholder="e.g. Acme Foundation"
                value={orgName}
                onChange={(e) => { setOrgName(e.target.value); setError(null); }}
                required
              />
              <Input
                label="Description"
                placeholder="Brief description of your organization"
                value={orgDescription}
                onChange={(e) => { setOrgDescription(e.target.value); setError(null); }}
              />
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={isPending} className="w-full" size="lg">
                {isPending ? "Creating..." : "Create Organization"}
              </Button>
              {hash && (
                <p className="text-xs text-gray-500 text-center font-mono break-all">
                  TX: {hash}
                </p>
              )}
            </form>
          </Card>
        )}

        {/* Step 3: Complete Profile */}
        {step === "complete-profile" && (
          <Card>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-gray-900">Organization Created!</h2>
              <p className="mt-2 text-sm text-gray-500">
                Now complete your profile. These details are saved securely.
              </p>
              {hash && (
                <p className="mt-2 text-xs text-gray-400 font-mono break-all">
                  TX: {hash}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                disabled
              />
              <Input
                label="Website (optional)"
                placeholder="https://your-org.org"
                value={orgWebsite}
                onChange={(e) => setOrgWebsite(e.target.value)}
              />
              <Input
                label="Country (optional)"
                placeholder="e.g. United States"
                value={orgCountry}
                onChange={(e) => setOrgCountry(e.target.value)}
              />
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={isSaving} className="w-full" size="lg">
                {isSaving ? "Saving..." : "Complete Setup"}
              </Button>
            </form>
          </Card>
        )}

        {/* Redirecting */}
        {step === "redirecting" && (
          <Card>
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900">All Set!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Redirecting to your dashboard...
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
