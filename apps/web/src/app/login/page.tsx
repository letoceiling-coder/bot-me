import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-base text-text-muted">
          Загрузка…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
