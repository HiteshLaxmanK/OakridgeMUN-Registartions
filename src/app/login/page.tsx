import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-2xl font-extrabold mb-2 text-center">Login</h1>
      <p className="text-warm-white/50 text-sm text-center mb-8">
        Enter your team's password. Access depends on your role.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
