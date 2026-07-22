import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-2xl font-extrabold mb-2 text-center">Admin Login</h1>
      <p className="text-warm-white/50 text-sm text-center mb-8">
        Enter the shared password to access Import, Dashboard, and Check-in.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
