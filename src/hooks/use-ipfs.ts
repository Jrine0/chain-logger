"use client";

import { useState, useCallback } from "react";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

interface UploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export function useIpfs() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    if (!PINATA_JWT) {
      throw new Error("Pinata JWT not configured. Set NEXT_PUBLIC_PINATA_JWT in .env.local");
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pinata upload failed (${res.status}): ${text}`);
      }

      const result: UploadResult = await res.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadJson = useCallback(async (json: object, name: string): Promise<UploadResult> => {
    if (!PINATA_JWT) {
      throw new Error("Pinata JWT not configured. Set NEXT_PUBLIC_PINATA_JWT in .env.local");
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: json,
          pinataMetadata: { name },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Pinata JSON upload failed (${res.status}): ${text}`);
      }

      const result: UploadResult = await res.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadFile, uploadJson, uploading, error };
}

export { PINATA_GATEWAY };
