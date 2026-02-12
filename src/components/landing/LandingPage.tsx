import { AdvocacySection } from "./AdvocacySection";
import { ChaptersMapSection } from "./ChaptersMapSection";
import { ClosingCTASection } from "./ClosingCTASection";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { MembershipSection } from "./MembershipSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { OpportunityStreamSection } from "./OpportunityStreamSection";
import { ProgramsSection } from "./ProgramsSection";
import { getSiteStats } from "@/services/stats";

export default async function LandingPage() {
  let stats = {
    projectsCount: 0,
    chaptersCount: 0,
    membersCount: 0,
    livesImpactedCount: 0,
  };
  try {
    stats = await getSiteStats();
  } catch {
    // Keep default zero stats if settings row is unavailable.
  }

  return (
    <main className="relative">
      <HeroSection stats={stats} />
      <ProgramsSection />
      <AdvocacySection />
      <OpportunitiesSection />
      <OpportunityStreamSection />
      <MembershipSection />
      <ChaptersMapSection />
      <ContactSection />
      <ClosingCTASection />
    </main>
  );
}
