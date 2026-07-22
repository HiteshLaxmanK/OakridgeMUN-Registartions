import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { insertDelegates, type ImportRow } from "@/lib/db";

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function rowsFromSheet(sheet: XLSX.WorkSheet): ImportRow[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return raw.map((r) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(r)) {
      normalized[normalizeKey(key)] = String(value ?? "").trim();
    }
    return {
      name: normalized["name"] || "",
      email: normalized["email"] || "",
      school: normalized["school"] || "",
      committee: normalized["committee"] || "",
      country: normalized["country"] || "",
    };
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return NextResponse.json(
      { error: "Could not parse file. Please upload a valid CSV or Excel file." },
      { status: 400 }
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "The file has no sheets." }, { status: 400 });
  }

  const rows = rowsFromSheet(workbook.Sheets[sheetName]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in the file." }, { status: 400 });
  }

  const result = await insertDelegates(rows);
  return NextResponse.json(result);
}
