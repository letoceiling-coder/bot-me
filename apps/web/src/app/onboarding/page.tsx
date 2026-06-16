import { Suspense } from "react";
import OnboardingPage from "./onboarding-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-base text-text-muted">
          Загрузка…
        </div>
      }
    >
      <OnboardingPage />
    </Suspense>
  );
}
