import { AdvocacySection } from "./AdvocacySection";
import { ChaptersMapSection } from "./ChaptersMapSection";
import { ClosingCTASection } from "./ClosingCTASection";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { MembershipSection } from "./MembershipSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { OpportunityStreamSection } from "./OpportunityStreamSection";
import { ProgramsSection } from "./ProgramsSection";

export default function LandingPage() {
  return (
    <div className="text-ink">
      <LandingHeader />

      <main className="relative">
        <HeroSection />
        <ProgramsSection />
        <AdvocacySection />
        <OpportunitiesSection />
        <OpportunityStreamSection />
        <MembershipSection />
        <ChaptersMapSection />
        <ContactSection />
        <ClosingCTASection />
      </main>

      <LandingFooter />
    </div>
  );
}
