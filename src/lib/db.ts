import { randomUUID } from "crypto";
import { supabase, LIABILITY_FORMS_BUCKET } from "./supabase";
import type { Delegate, Stats } from "./types";

interface DelegateRow {
  id: string;
  name: string;
  email: string;
  school: string;
  committee: string;
  country: string;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_method: "qr" | "manual" | null;
  checked_in_by: string | null;
  note: string | null;
  liability_form_on_file: boolean;
  liability_form_at: string | null;
  created_at: string;
}

function fromRow(row: DelegateRow): Delegate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    school: row.school,
    committee: row.committee,
    country: row.country,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    checkedInMethod: row.checked_in_method,
    checkedInBy: row.checked_in_by,
    note: row.note,
    liabilityFormOnFile: row.liability_form_on_file,
    liabilityFormAt: row.liability_form_at,
    createdAt: row.created_at,
  };
}

export async function getAllDelegates(): Promise<Delegate[]> {
  const { data, error } = await supabase.from("delegates").select("*");
  if (error) throw new Error(error.message);
  return (data as DelegateRow[]).map(fromRow);
}

export async function getDelegateById(id: string): Promise<Delegate | undefined> {
  const { data, error } = await supabase
    .from("delegates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as DelegateRow) : undefined;
}

export interface ImportRow {
  name: string;
  email: string;
  school: string;
  committee: string;
  country: string;
}

export async function insertDelegates(rows: ImportRow[]): Promise<{
  inserted: number;
  skipped: number;
  total: number;
}> {
  const { data: existing, error: existingError } = await supabase
    .from("delegates")
    .select("email");
  if (existingError) throw new Error(existingError.message);

  const existingEmails = new Set(
    (existing as { email: string }[]).map((d) => d.email.trim().toLowerCase())
  );

  let inserted = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  const toInsert: Record<string, unknown>[] = [];

  for (const row of rows) {
    const email = (row.email || "").trim().toLowerCase();
    if (!row.name || !email) {
      skipped++;
      continue;
    }
    if (existingEmails.has(email)) {
      skipped++;
      continue;
    }
    existingEmails.add(email);
    toInsert.push({
      id: randomUUID(),
      name: row.name.trim(),
      email: row.email.trim(),
      school: (row.school || "").trim(),
      committee: (row.committee || "").trim(),
      country: (row.country || "").trim(),
      checked_in: false,
      checked_in_at: null,
      checked_in_method: null,
      note: null,
      liability_form_on_file: false,
      liability_form_at: null,
      created_at: now,
    });
    inserted++;
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("delegates").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  const total = existingEmails.size;
  return { inserted, skipped, total };
}

export async function resetDelegates(): Promise<void> {
  const { error } = await supabase
    .from("delegates")
    .delete()
    .not("id", "is", null);
  if (error) throw new Error(error.message);

  const { data: files } = await supabase.storage
    .from(LIABILITY_FORMS_BUCKET)
    .list();
  if (files && files.length > 0) {
    await supabase.storage
      .from(LIABILITY_FORMS_BUCKET)
      .remove(files.map((f) => f.name));
  }
}

// Committee used to mark internal test delegates (e.g. mun@oakridge.in),
// so they can stay usable for testing the live QR-lookup/check-in flow
// without polluting admin-facing stats, lists, and exports.
export const TEST_COMMITTEE = "Oakridge MUN";

export interface SearchQuery {
  q?: string;
  committee?: string;
  school?: string;
  country?: string;
  checkedIn?: "true" | "false";
  liabilityForm?: "true" | "false";
  method?: "qr" | "manual";
  excludeTest?: boolean;
}

export async function searchDelegates(query: SearchQuery): Promise<Delegate[]> {
  let builder = supabase.from("delegates").select("*");

  // Test delegates stay out of the default (unfiltered) dashboard list so
  // they don't pollute passive browsing — but an admin actively searching
  // for one by name/email should still be able to find and check it in.
  if (query.excludeTest && !query.q?.trim()) {
    builder = builder.neq("committee", TEST_COMMITTEE);
  }
  if (query.checkedIn === "true") {
    builder = builder.eq("checked_in", true);
  } else if (query.checkedIn === "false") {
    builder = builder.eq("checked_in", false);
  }
  if (query.liabilityForm === "true") {
    builder = builder.eq("liability_form_on_file", true);
  } else if (query.liabilityForm === "false") {
    builder = builder.eq("liability_form_on_file", false);
  }
  if (query.method) builder = builder.eq("checked_in_method", query.method);
  if (query.committee) builder = builder.eq("committee", query.committee);
  if (query.school) builder = builder.eq("school", query.school);
  if (query.country) builder = builder.eq("country", query.country);

  if (query.q && query.q.trim()) {
    const q = query.q.trim().replace(/[%,]/g, "");
    builder = builder.or(
      [
        `name.ilike.%${q}%`,
        `school.ilike.%${q}%`,
        `country.ilike.%${q}%`,
        `committee.ilike.%${q}%`,
        `email.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return (data as DelegateRow[]).map(fromRow);
}

export async function checkInDelegate(
  id: string,
  method: "qr" | "manual" = "qr",
  checkedInBy?: string
): Promise<
  | { status: "success"; delegate: Delegate }
  | { status: "duplicate"; delegate: Delegate }
  | { status: "not_found" }
> {
  // Try the atomic conditional update directly instead of reading first —
  // the common case (a fresh check-in) then only costs one round trip to
  // Supabase instead of two, which is what was making manual check-in feel
  // slow. The read-after-write below only runs for the rarer not-found /
  // already-checked-in cases, where it's needed to tell them apart.
  const checkedInAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("delegates")
    .update({
      checked_in: true,
      checked_in_at: checkedInAt,
      checked_in_method: method,
      checked_in_by: checkedInBy || null,
    })
    .eq("id", id)
    .eq("checked_in", false)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (data) {
    return { status: "success", delegate: fromRow(data as DelegateRow) };
  }

  const existing = await getDelegateById(id);
  if (!existing) return { status: "not_found" };
  return { status: "duplicate", delegate: existing };
}

export async function undoCheckIn(id: string): Promise<Delegate | undefined> {
  const { data, error } = await supabase
    .from("delegates")
    .update({
      checked_in: false,
      checked_in_at: null,
      checked_in_method: null,
      checked_in_by: null,
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as DelegateRow) : undefined;
}

export async function setDelegateNote(
  id: string,
  note: string
): Promise<Delegate | undefined> {
  const { data, error } = await supabase
    .from("delegates")
    .update({ note: note.trim() || null })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as DelegateRow) : undefined;
}

export async function markLiabilityFormOnFile(
  id: string
): Promise<Delegate | undefined> {
  const { data, error } = await supabase
    .from("delegates")
    .update({
      liability_form_on_file: true,
      liability_form_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as DelegateRow) : undefined;
}

export async function getStats(): Promise<Stats> {
  const delegates = (await getAllDelegates()).filter((d) => d.committee !== TEST_COMMITTEE);
  const total = delegates.length;
  const checkedIn = delegates.filter((d) => d.checkedIn).length;
  const remaining = total - checkedIn;

  const committeeMap = new Map<string, { total: number; checkedIn: number }>();
  for (const d of delegates) {
    const key = d.committee || "Unassigned";
    const entry = committeeMap.get(key) || { total: 0, checkedIn: 0 };
    entry.total++;
    if (d.checkedIn) entry.checkedIn++;
    committeeMap.set(key, entry);
  }

  const committees = Array.from(committeeMap.entries())
    .map(([committee, v]) => ({ committee, ...v }))
    .sort((a, b) => a.committee.localeCompare(b.committee));

  const recentCheckins = delegates
    .filter((d) => d.checkedIn && d.checkedInAt)
    .sort((a, b) => (b.checkedInAt! > a.checkedInAt! ? 1 : -1))
    .slice(0, 15);

  return { total, checkedIn, remaining, committees, recentCheckins };
}

export async function getFacets() {
  const delegates = (await getAllDelegates()).filter((d) => d.committee !== TEST_COMMITTEE);
  const committees = Array.from(new Set(delegates.map((d) => d.committee))).sort();
  const schools = Array.from(new Set(delegates.map((d) => d.school))).sort();
  const countries = Array.from(new Set(delegates.map((d) => d.country))).sort();
  return { committees, schools, countries };
}

export interface QrLookup {
  id: string;
  email: string;
  found: boolean;
  delegateId: string | null;
  createdAt: string;
}

export interface QrLookupStats {
  totalLookups: number;
  uniqueEmails: number;
  foundCount: number;
  notFoundCount: number;
  lookups: QrLookup[];
}

export async function getQrLookupStats(): Promise<QrLookupStats> {
  const { data, error } = await supabase
    .from("qr_lookups")
    .select("id, email, found, delegate_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data || []) as {
    id: string;
    email: string;
    found: boolean;
    delegate_id: string | null;
    created_at: string;
  }[];

  const lookups: QrLookup[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    found: r.found,
    delegateId: r.delegate_id,
    createdAt: r.created_at,
  }));

  return {
    totalLookups: lookups.length,
    uniqueEmails: new Set(lookups.map((l) => l.email)).size,
    foundCount: lookups.filter((l) => l.found).length,
    notFoundCount: lookups.filter((l) => !l.found).length,
    lookups,
  };
}
