import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function VolunteerOpportunitiesLoading() {
  return (
    <div className="text-ink">
      <LandingHeader />
      <main className="pb-20">
        <section className="mx-auto w-[92%] max-w-6xl pb-8 pt-14">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-200"></div>
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-gray-100"></div>
        </section>
        <section className="mx-auto w-[92%] max-w-6xl rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="h-10 animate-pulse rounded-xl bg-gray-100"></div>
            <div className="h-10 animate-pulse rounded-xl bg-gray-100"></div>
            <div className="h-10 animate-pulse rounded-xl bg-gray-100"></div>
            <div className="h-10 animate-pulse rounded-xl bg-gray-100"></div>
            <div className="h-10 animate-pulse rounded-xl bg-gray-100"></div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-56 animate-pulse rounded-3xl bg-gray-100"></div>
            <div className="h-56 animate-pulse rounded-3xl bg-gray-100"></div>
            <div className="h-56 animate-pulse rounded-3xl bg-gray-100"></div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
