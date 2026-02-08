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
          <a className="mt-2 block hover:text-orange-600" href="#programs">
            Programs
          </a>
          <a className="mt-2 block hover:text-orange-600" href="#opportunities">
            Opportunities
          </a>
          <a className="mt-2 block hover:text-orange-600" href="#membership">
            Membership
          </a>
        </div>
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">
            For Chapters
          </h4>
          <a className="mt-2 block hover:text-orange-600" href="#membership">
            Start a Chapter
          </a>
          <a className="mt-2 block hover:text-orange-600" href="#chapters">
            Chapter Network
          </a>
          <a className="mt-2 block hover:text-orange-600" href="/login">
            Chapter Head Login
          </a>
        </div>
        <div>
          <h4 className="font-manrope text-base font-semibold text-ink">Contact</h4>
          <a className="mt-2 block hover:text-orange-600" href="#contact">Email</a>
          <a className="mt-2 block hover:text-orange-600" href="#contact">
            Facebook
          </a>
          <a className="mt-2 block hover:text-orange-600" href="#contact">Mobile</a>
        </div>
      </div>
      <div className="footer-hero" aria-hidden="true">
        <p className="footer-hero__text">Amplify</p>
      </div>
    </footer>
  );
}
