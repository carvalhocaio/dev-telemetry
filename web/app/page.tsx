import { Suspense } from "react";

import AuthGate from "@/components/AuthGate";
import Dashboard from "@/components/Dashboard";
import DashboardHeader from "@/components/DashboardHeader";
import { AuthProvider } from "@/hooks/useAuth";
import { ReportRefetchProvider } from "@/hooks/useReportRefetch";

/**
 * Minimal Server Component shell. All interactivity lives in client leaves:
 * `AuthProvider` holds the session, `AuthGate` renders the login modal until
 * authenticated, and the header + dashboard read the granularity from the URL
 * (hence the `Suspense` boundary around `useSearchParams`).
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <AuthProvider>
        <AuthGate>
          <ReportRefetchProvider>
            <Suspense fallback={null}>
              <DashboardHeader />
              <Dashboard />
            </Suspense>
          </ReportRefetchProvider>
        </AuthGate>
      </AuthProvider>
    </main>
  );
}
