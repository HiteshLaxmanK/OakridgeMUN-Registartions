import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAllDelegates, TEST_COMMITTEE } from "@/lib/db";
import type { Delegate } from "@/lib/types";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Name",
  "Committee",
  "Country",
  "Day 1",
  "Day 2",
  "Day 3",
  "Checked In",
  "Check-in Method",
  "Checked In By",
  "Liability Form",
];
const LIABILITY_COL = 9;

function methodLabel(method: Delegate["checkedInMethod"]): string {
  if (method === "qr") return "QR Scan";
  if (method === "manual") return "Manual";
  return "—";
}

function delegateRow(d: Delegate, origin: string): (string | number)[] {
  return [
    d.name,
    d.committee,
    d.country,
    d.day1Present ? "Yes" : "No",
    d.day2Present ? "Yes" : "No",
    d.day3Present ? "Yes" : "No",
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
  sheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 26 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 26 },
    { wch: 46 },
  ];

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

// Fast, minimal roll-call-style sheet for a single day — just who's
// present, nothing else to scroll past. One sheet per committee, mirroring
// the paper roll-call format already used at the venue.
const DAY_HEADERS = ["Name", "Country", "Present"];

function dayPresent(d: Delegate, day: 1 | 2 | 3): boolean {
  if (day === 1) return d.day1Present;
  if (day === 2) return d.day2Present;
  return d.day3Present;
}

function daySheetFor(delegates: Delegate[], day: 1 | 2 | 3): XLSX.WorkSheet {
  const rows = delegates
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => [d.name, d.country, dayPresent(d, day) ? "Yes" : "No"]);
  const sheet = XLSX.utils.aoa_to_sheet([DAY_HEADERS, ...rows]);
  sheet["!cols"] = [{ wch: 28 }, { wch: 26 }, { wch: 10 }];
  return sheet;
}

export async function GET(req: NextRequest) {
  const committeeParam = req.nextUrl.searchParams.get("committee");
  const dayParam = req.nextUrl.searchParams.get("day");
  const day = dayParam === "1" || dayParam === "2" || dayParam === "3" ? (Number(dayParam) as 1 | 2 | 3) : null;
  const origin = req.nextUrl.origin;

  const allRaw = await getAllDelegates();
  const workbook = XLSX.utils.book_new();

  if (day) {
    // Single-day roll-call export: one sheet per committee, Name/Country/
    // Present only — deliberately skips the "Verification" combined sheet
    // and all the extra columns, since the whole point is a fast download.
    const all = allRaw.filter((d) => d.committee !== TEST_COMMITTEE);
    const committees = Array.from(new Set(all.map((d) => d.committee))).sort();
    for (const committee of committees) {
      const delegates = all.filter((d) => d.committee === committee);
      XLSX.utils.book_append_sheet(workbook, daySheetFor(delegates, day), safeSheetName(committee));
    }
  } else if (committeeParam) {
    const delegates = allRaw.filter((d) => d.committee === committeeParam);
    if (delegates.length === 0) {
      return NextResponse.json({ error: "No delegates found for that committee." }, { status: 404 });
    }
    XLSX.utils.book_append_sheet(workbook, sheetFor(delegates, origin), safeSheetName(committeeParam));
  } else {
    // Test delegates (e.g. mun@oakridge.in) are excluded from the
    // all-committees export — the per-committee export above still
    // allows pulling that sheet explicitly if ever needed.
    const all = allRaw.filter((d) => d.committee !== TEST_COMMITTEE);

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
  const filename = day
    ? `oakridge-mun-day-${day}-attendance.xlsx`
    : committeeParam
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
