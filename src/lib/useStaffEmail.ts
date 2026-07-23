"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "oakmun_staff_email";

// Asked once per device/browser, then remembered — every check-in after
// that is silently tagged with whoever's currently signed in on this
// device, with zero added friction.
export function useStaffEmail() {
  const [staffEmail, setStaffEmailState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStaffEmailState(localStorage.getItem(STORAGE_KEY));
    setLoaded(true);
  }, []);

  function setStaffEmail(email: string) {
    const trimmed = email.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    setStaffEmailState(trimmed);
  }

  function clearStaffEmail() {
    localStorage.removeItem(STORAGE_KEY);
    setStaffEmailState(null);
  }

  return { staffEmail, loaded, setStaffEmail, clearStaffEmail };
}
