import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white pt-12">
      <div className="mx-auto grid w-[92%] max-w-6xl gap-8 text-sm text-muted md:grid-cols-4">
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">
            Youth Service Philippines
          </h4>
          <p className="mt-2">
            Fueling youth-led service, one chapter at a time.
          </p>
        </div>
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">Explore</h4>
          <Link className="mt-2 block hover:text-orange-600" href="/#programs">
            Programs
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/#opportunities">
            Opportunities
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/#membership">
            Membership
          </Link>
        </div>
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">
            For Chapters
          </h4>
          <Link className="mt-2 block hover:text-orange-600" href="/membership">
            Start a Chapter
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/chapters">
            Chapter Network
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/login">
            Chapter Head Login
          </Link>
        </div>
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">Contact</h4>
          <Link className="mt-2 block hover:text-orange-600" href="/contact">
            Email
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/contact">
            Facebook
          </Link>
          <Link className="mt-2 block hover:text-orange-600" href="/contact">
            Mobile
          </Link>
        </div>
      </div>
      <div className="footer-hero" aria-hidden="true">
        <p className="footer-hero__text">Amplify</p>
      </div>
    </footer>
  );
}
