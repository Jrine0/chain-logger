import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "org-profiles.json");

async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeDb(data: Record<string, unknown>) {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, orgName, orgDescription, website, country } = body;

    if (!address || !orgName) {
      return NextResponse.json(
        { error: "Address and organization name are required" },
        { status: 400 }
      );
    }

    const db = await readDb();

    db[address] = {
      orgName,
      orgDescription: orgDescription || "",
      website: website || "",
      country: country || "",
      createdAt: new Date().toISOString(),
    };

    await writeDb(db);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save organization profile" },
      { status: 500 }
    );
  }
}
