"use client";

import { Navbar } from "@/components/navbar";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { CHAIN_LOGGER_ABI } from "@/config/wagmi";
import { validateRequired } from "@/lib/utils";
import { useState } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

function CreateProjectForm() {
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <Card className="text-center">
        <p className="text-gray-500">Connect your wallet as a Finance team member.</p>
      </Card>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return <Card><p className="text-red-600">Contract address not configured.</p></Card>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const n = validateRequired(name, "Project name");
      const desc = description.trim();
      const cid = validateRequired(ipfsCid, "IPFS CID");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_LOGGER_ABI,
        functionName: "createProject",
        args: [n, desc, cid],
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input");
    }
  };

  if (submitted && hash) {
    return (
      <Card>
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-gray-900">Project Created</h3>
          <p className="mt-2 text-sm text-gray-500">Transaction confirmed on Polygon.</p>
          <p className="mt-1 text-xs text-gray-400 font-mono break-all">TX: {hash}</p>
          <Button variant="ghost" className="mt-4" onClick={() => {
            setName("");
            setDescription("");
            setIpfsCid("");
            setSubmitted(false);
          }}>Create Another Project</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input label="Project Name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} required />
        <Textarea label="Description" value={description} onChange={(e) => { setDescription(e.target.value); setError(null); }} rows={3} />
        <Input label="Project Document IPFS CID" value={ipfsCid} onChange={(e) => { setIpfsCid(e.target.value); setError(null); }} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Project"}</Button>
        {hash && <p className="text-xs text-gray-500">TX: {hash}</p>}
      </form>
    </Card>
  );
}

function ProjectList() {
  const { data: total } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHAIN_LOGGER_ABI,
    functionName: "getTotalProjects",
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  const count = total ? Number(total) : 0;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900">Projects ({count})</h3>
      {count === 0 && <p className="mt-2 text-sm text-gray-500">No projects created yet.</p>}
      <p className="mt-2 text-sm text-gray-400">Projects appear here once created on-chain.</p>
    </Card>
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="mt-1 text-gray-500">Create and manage transparency-tracked projects.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <CreateProjectForm />
          <ProjectList />
        </div>
      </div>
    </div>
  );
}
