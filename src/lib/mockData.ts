import type { ImportRow } from "./db";

const COMMITTEES = [
  "DISEC",
  "UNSC",
  "WHO",
  "UNHRC",
  "ECOSOC",
  "UNEP",
  "Lok Sabha",
  "AIPPM",
  "Historical Crisis",
  "Press Corps",
];

const SCHOOLS = [
  "Oakridge Bachupally",
  "Oakridge Gachibowli",
  "Delhi Public School",
  "Chirec International",
  "Meridian School",
  "Glendale Academy",
  "Silver Oaks International",
  "Johnson Grammar School",
  "Phoenix Greens",
  "Global Edge School",
  "Sreenidhi International",
  "Bharatiya Vidya Bhavan",
];

const COUNTRIES = [
  "France",
  "Germany",
  "Japan",
  "Brazil",
  "India",
  "United Kingdom",
  "South Africa",
  "Canada",
  "Russia",
  "China",
  "Australia",
  "Mexico",
  "Egypt",
  "South Korea",
  "Italy",
  "Indonesia",
  "Nigeria",
  "Argentina",
  "Sweden",
  "Turkey",
];

const FIRST_NAMES = [
  "Aryan",
  "Ishaan",
  "Ananya",
  "Priya",
  "Rohan",
  "Kavya",
  "Vihaan",
  "Diya",
  "Arjun",
  "Meera",
  "Kabir",
  "Sanya",
  "Aditya",
  "Riya",
  "Vivaan",
  "Anika",
  "Reyansh",
  "Ira",
  "Sai",
  "Myra",
  "Dhruv",
  "Aadhya",
  "Krish",
  "Navya",
  "Yash",
  "Siya",
  "Advait",
  "Prisha",
  "Rudra",
  "Amaira",
];

const LAST_NAMES = [
  "Sharma",
  "Reddy",
  "Rao",
  "Gupta",
  "Kumar",
  "Iyer",
  "Nair",
  "Patel",
  "Verma",
  "Chowdary",
  "Menon",
  "Agarwal",
  "Pillai",
  "Desai",
  "Joshi",
  "Kapoor",
  "Mehta",
  "Bose",
  "Rangan",
  "Krishnan",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function generateMockDelegates(count = 220): ImportRow[] {
  const rows: ImportRow[] = [];
  const usedEmails = new Set<string>();

  let i = 0;
  while (rows.length < count) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    let email = `${slugify(first)}.${slugify(last)}@gmail.com`;
    let suffix = 1;
    while (usedEmails.has(email)) {
      suffix++;
      email = `${slugify(first)}.${slugify(last)}${suffix}@gmail.com`;
    }
    usedEmails.add(email);

    rows.push({
      name,
      email,
      school: pick(SCHOOLS),
      committee: pick(COMMITTEES),
      country: pick(COUNTRIES),
    });
    i++;
    if (i > count * 5) break; // safety valve
  }

  return rows;
}
