import { getUsageStats, UsageStatsDisplay, ResetDataButton } from "@/features/dev-tools";

export default async function DevToolsPage() {
  const stats = await getUsageStats();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Dev Tools</h1>
      <p className="mt-1 text-muted-foreground">
        Alat pengembangan untuk mengelola data aplikasi.
      </p>
      <div className="mt-6">
        <UsageStatsDisplay stats={stats} />
      </div>
      <div className="mt-8">
        <ResetDataButton />
      </div>
    </div>
  );
}
