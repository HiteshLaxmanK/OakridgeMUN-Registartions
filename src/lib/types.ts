export interface Delegate {
  id: string;
  name: string;
  email: string;
  school: string;
  committee: string;
  country: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  note: string | null;
  liabilityFormOnFile: boolean;
  liabilityFormAt: string | null;
  createdAt: string;
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
