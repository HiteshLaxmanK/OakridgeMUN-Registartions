export interface Delegate {
  id: string;
  name: string;
  email: string;
  school: string;
  committee: string;
  country: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedInMethod: "qr" | "manual" | null;
  checkedInBy: string | null;
  note: string | null;
  liabilityFormOnFile: boolean;
  liabilityFormAt: string | null;
  createdAt: string;
  day1Present: boolean;
  day1PresentAt: string | null;
  day2Present: boolean;
  day2PresentAt: string | null;
  day3Present: boolean;
  day3PresentAt: string | null;
}

export interface CommitteeProgress {
  committee: string;
  total: number;
  checkedIn: number;
}

export interface Stats {
  total: number;
  checkedIn: number;
  remaining: number;
  committees: CommitteeProgress[];
  recentCheckins: Delegate[];
}

export type CheckinResult =
  | { status: "success"; delegate: Delegate }
  | { status: "duplicate"; delegate: Delegate }
  | { status: "not_found" };
