import { getMyChapter } from "@/services/chapters";
import { listMyChapterOpportunities } from "@/services/opportunities";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function ChapterHomePage() {
  let chapterName = "Your Chapter";
  let totalOps = 0;
  let publishedOps = 0;
  let draftOps = 0;
  let loadError: string | null = null;

  try {
    const [chapter, opportunities] = await Promise.all([
      getMyChapter(),
      listMyChapterOpportunities(),
    ]);
    chapterName = chapter.name;
    totalOps = opportunities.length;
    publishedOps = opportunities.filter((o) => o.published).length;
    draftOps = totalOps - publishedOps;
  } catch {
    loadError = "Unable to load chapter data. Please ensure your chapter assignment is correct.";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter Head"
        title={chapterName}
        subtitle="Monitor your chapter's activities and manage volunteer opportunities."
      />

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Opportunities"
            value={totalOps}
            accent="orange"
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
          />
          <StatCard
            label="Published"
            value={publishedOps}
            accent="emerald"
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Drafts"
            value={draftOps}
            helper="Pending review"
            accent="amber"
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}
