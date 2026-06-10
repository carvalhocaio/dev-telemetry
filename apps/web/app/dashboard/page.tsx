import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@dev-telemetry/db/client";
import { userSecret } from "@dev-telemetry/db/schema";
import AuthGate from "@/components/AuthGate";
import Dashboard from "@/components/Dashboard";
import DashboardHeader from "@/components/DashboardHeader";
import { ReportRefetchProvider } from "@/hooks/useReportRefetch";

/**
 * Authenticated dashboard entry point.
 * Validates session + config before rendering the dashboard; unauthenticated
 * users land on /login and unconfigured users land on /settings.
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [secret] = await db
    .select({ hasPat: userSecret.githubPatEnc, hasLlm: userSecret.llmApiKeyEnc })
    .from(userSecret)
    .where(eq(userSecret.userId, session.user.id))
    .limit(1);

  if (!secret?.hasPat || !secret?.hasLlm) {
    redirect("/settings");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <AuthGate>
        <ReportRefetchProvider>
          <Suspense fallback={null}>
            <DashboardHeader />
            <Dashboard />
          </Suspense>
        </ReportRefetchProvider>
      </AuthGate>
    </main>
  );
}
