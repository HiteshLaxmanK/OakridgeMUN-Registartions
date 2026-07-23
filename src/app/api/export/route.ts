import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAllDelegates } from "@/lib/db";
import type { Delegate } from "@/lib/types";

export const dynamic = "force-dynamic";

const HEADERS = ["Name", "Committee", "Checked In", "Check-in Method", "Checked In By", "Liability Form"];
const LIABILITY_COL = 5;

function methodLabel(method: Delegate["checkedInMethod"]): string {
  if (method === "qr") return "QR Scan";
  if (method === "manual") return "Manual";
  return "—";
}

function delegateRow(d: Delegate, origin: string): (string | number)[] {
  return [
    d.name,
    d.committee,
    d.checkedIn ? "Yes" : "No",
    d.checkedIn ? methodLabel(d.checkedInMethod) : "—",
    d.checkedInBy || "—",
    d.liabilityFormOnFile ? `${origin}/api/delegates/${d.id}/liability-form` : "Not submitted",
  ];
}

function sheetFor(delegates: Delegate[], origin: string): XLSX.WorkSheet {
  const rows = delegates
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => delegateRow(d, origin));

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  sheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 26 }, { wch: 46 }];

  rows.forEach((row, i) => {
    const link = row[LIABILITY_COL];
    if (typeof link === "string" && link.startsWith("http")) {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: LIABILITY_COL });
      sheet[cellRef].l = { Target: link, Tooltip: "Open liability form PDF" };
      sheet[cellRef].v = "View PDF";
    }
  });

  return sheet;
}

function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet";
}

export async function GET(req: NextRequest) {
  const committeeParam = req.nextUrl.searchParams.get("committee");
  const origin = req.nextUrl.origin;

  const all = await getAllDelegates();
  const workbook = XLSX.utils.book_new();

  if (committeeParam) {
    const delegates = all.filter((d) => d.committee === committeeParam);
    if (delegates.length === 0) {
      return NextResponse.json({ error: "No delegates found for that committee." }, { status: 404 });
    }
    XLSX.utils.book_append_sheet(workbook, sheetFor(delegates, origin), safeSheetName(committeeParam));
  } else {
    // Combined "who registered" master list, checked first before the
    // per-committee breakdown sheets.
    XLSX.utils.book_append_sheet(workbook, sheetFor(all, origin), "Verification");

    const committees = Array.from(new Set(all.map((d) => d.committee))).sort();
    for (const committee of committees) {
      const delegates = all.filter((d) => d.committee === committee);
      XLSX.utils.book_append_sheet(workbook, sheetFor(delegates, origin), safeSheetName(committee));
    }
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = committeeParam
    ? `oakridge-mun-${safeSheetName(committeeParam).toLowerCase().replace(/\s+/g, "-")}.xlsx`
    : "oakridge-mun-all-committees.xlsx";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
