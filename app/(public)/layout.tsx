import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { RevealObserver } from "@/components/system/RevealObserver";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-ink">
      <RevealObserver />
      <LandingHeader />
      {children}
      <LandingFooter />
    </div>
  );
}
