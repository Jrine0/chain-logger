"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import type { Address } from "viem";

// ─── Types ────────────────────────────────────────────────────────

type Role = "admin" | "finance" | "vendor" | "viewer" | null;

interface Organization {
  id: number;
  name: string;
  description: string;
  admin: Address;
  createdAt: number;
  exists: boolean;
}

interface AuthContextValue {
  isConnected: boolean;
  address: Address | undefined;
  connect: ReturnType<typeof useConnect>["connect"];
  connectors: ReturnType<typeof useConnect>["connectors"];
  disconnect: () => void;
  role: Role;
  isFinance: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isLoadingRole: boolean;
  orgs: Organization[];
  selectedOrg: Organization | null;
  selectOrg: (orgId: number) => void;
  orgsLoading: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [role, setRole] = useState<Role>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgsLoading, setOrgsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setRole(null);
      setOrgs([]);
      setSelectedOrg(null);
      return;
    }

    setIsLoadingRole(true);
    setOrgsLoading(true);
    let cancelled = false;

    detectAuth(address);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  async function detectAuth(userAddress: Address) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      setRole("viewer");
      setIsLoadingRole(false);
      setOrgsLoading(false);
      return;
    }

    try {
      const { createPublicClient, http } = await import("viem");
      const { polygon } = await import("wagmi/chains");

      const client = createPublicClient({
        chain: polygon,
        transport: http(),
      });

      // Fetch user orgs
      let userOrgs: readonly bigint[] = [];
      try {
        userOrgs = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: [
            {
              type: "function",
              name: "getUserOrganizations",
              inputs: [{ name: "_user", type: "address" }],
              outputs: [{ name: "", type: "uint256[]" }],
              stateMutability: "view",
            },
          ],
          functionName: "getUserOrganizations",
          args: [userAddress],
        });
      } catch {
        // No orgs
      }

      if (userOrgs.length > 0) {
        const orgList: Organization[] = [];
        for (const orgId of userOrgs) {
          try {
            const result = await client.readContract({
              address: contractAddress as `0x${string}`,
              abi: [
                {
                  type: "function",
                  name: "getOrganization",
                  inputs: [{ name: "_orgId", type: "uint256" }],
                  outputs: [
                    { name: "id", type: "uint256" },
                    { name: "name", type: "string" },
                    { name: "description", type: "string" },
                    { name: "admin", type: "address" },
                    { name: "createdAt", type: "uint256" },
                    { name: "exists", type: "bool" },
                  ],
                  stateMutability: "view",
                },
              ],
              functionName: "getOrganization",
              args: [orgId],
            });

            const [id, name, description, admin, createdAt, exists] = result as [
              bigint,
              string,
              string,
              Address,
              bigint,
              boolean,
            ];

            if (exists) {
              orgList.push({
                id: Number(id),
                name,
                description,
                admin,
                createdAt: Number(createdAt),
                exists: true,
              });
            }
          } catch {
            // skip
          }
        }

        setOrgs(orgList);
        if (orgList.length > 0) {
          setSelectedOrg(orgList[0]);
          setRole("finance");
        }
        setOrgsLoading(false);
        setIsLoadingRole(false);
        return;
      }

      // No orgs — default to viewer
      setRole("viewer");
      setOrgsLoading(false);
      setIsLoadingRole(false);
    } catch {
      setRole("viewer");
      setOrgsLoading(false);
      setIsLoadingRole(false);
    }
  }

  const selectOrg = useCallback((orgId: number) => {
    const org = orgs.find((o) => o.id === orgId);
    if (org) setSelectedOrg(org);
  }, [orgs]);

  const refreshAuth = useCallback(() => {
    setIsLoadingRole(true);
    setTimeout(() => setIsLoadingRole(false), 500);
  }, []);

  const value: AuthContextValue = {
    isConnected,
    address,
    connect: connect as AuthContextValue["connect"],
    connectors: connectors as AuthContextValue["connectors"],
    disconnect,
    role,
    isFinance: role === "finance" || role === "admin",
    isVendor: role === "vendor",
    isAdmin: role === "admin",
    isLoadingRole,
    orgs,
    selectedOrg,
    selectOrg,
    orgsLoading,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
