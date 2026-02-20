"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { PrivacyAdvisoryModal } from "@/components/ui/PrivacyAdvisoryModal";

const SECTOR_OPTIONS = [
    "Youth",
    "PWD",
    "Farmers",
    "Indigenous People",
    "TODA",
    "Others",
] as const;

interface OnboardingClientProps {
    chapters: { id: string; name: string }[];
    prefillName?: string;
    prefillEmail?: string;
}

export default function OnboardingClient({ chapters, prefillName, prefillEmail }: OnboardingClientProps) {
    const router = useRouter();

    const [fullName, setFullName] = useState(prefillName ?? "");
    const [age, setAge] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [chapterId, setChapterId] = useState("");
    const [phone, setPhone] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [registeredVoter, setRegisteredVoter] = useState(false);
    const [householdSize, setHouseholdSize] = useState("1");
    const [householdVoters, setHouseholdVoters] = useState("");
    const [sector, setSector] = useState("");
    const [sectorOther, setSectorOther] = useState("");
    const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
    const [privacyConsent, setPrivacyConsent] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const errorRef = useRef<HTMLDivElement | null>(null);
    const submitLockRef = useRef(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setError(null);

        if (!privacyConsent) {
            setError("You must agree to the Privacy Advisory and Data Consent.");
            submitLockRef.current = false;
            return;
        }
        if (!chapterId) {
            setError("Please select a chapter.");
            submitLockRef.current = false;
            return;
        }

        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] ?? "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setLoading(true);
        try {
            const response = await fetch("/api/auth/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: fullName.trim(),
                    firstName,
                    lastName,
                    age: age ? Number(age) : undefined,
                    birthdate: birthdate || undefined,
                    chapterId,
                    phone: phone || undefined,
                    facebookUrl: facebookUrl || undefined,
                    registeredVoter,
                    householdSize: householdSize ? Number(householdSize) : undefined,
                    householdVoters: householdVoters ? Number(householdVoters) : undefined,
                    sector: sector || undefined,
                    sectorOther: sector === "Others" ? sectorOther : undefined,
                    newsletterSubscribed,
                    privacyConsent,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setError(data?.error ?? "Failed to complete onboarding. Please try again.");
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Failed to complete onboarding. Please try again.");
        } finally {
            submitLockRef.current = false;
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col w-full bg-slate-50 relative overflow-x-hidden">
            <LandingHeader fullWidth />

            <div className="flex-1 w-full max-w-[540px] mx-auto px-4 py-8 md:py-12 z-10 flex flex-col">
                <section className="auth-card w-full shadow-2xl rounded-2xl bg-white p-6 md:p-8">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-orange-600">Complete your profile</p>
                        <h2 className="font-manrope text-2xl font-semibold text-navy">Welcome to YSP!</h2>
                        <p className="text-sm text-muted">
                            Please fill in the details below to complete your membership application and join a chapter.
                        </p>
                        {prefillEmail && (
                            <p className="text-xs text-muted">
                                Signed in as <span className="font-semibold text-navy">{prefillEmail}</span>
                            </p>
                        )}
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <label className="block text-sm font-semibold text-navy">
                            Full Name *
                            <input
                                className="auth-input mt-2"
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm font-semibold text-navy">
                                Age *
                                <input
                                    className="auth-input mt-2"
                                    type="number"
                                    placeholder="18"
                                    min={1}
                                    max={120}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-semibold text-navy">
                                Birthdate
                                <input
                                    className="auth-input mt-2"
                                    type="date"
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                />
                            </label>
                        </div>

                        <label className="block text-sm font-semibold text-navy">
                            Chapter *
                            <select
                                className="auth-input mt-2"
                                value={chapterId}
                                onChange={(e) => setChapterId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select your chapter</option>
                                {chapters.map((ch) => (
                                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                                ))}
                            </select>
                        </label>

                        <label className="block text-sm font-semibold text-navy">
                            Contact Number *
                            <input
                                className="auth-input mt-2"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </label>

                        <label className="block text-sm font-semibold text-navy">
                            Facebook Link (optional)
                            <input
                                className="auth-input mt-2"
                                type="url"
                                placeholder="https://facebook.com/yourprofile"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                            />
                        </label>

                        <div className="flex items-center gap-3 py-1">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={registeredVoter}
                                onClick={() => setRegisteredVoter((v) => !v)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${registeredVoter ? "bg-orange-500" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${registeredVoter ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                            <span className="text-sm text-navy">Are you a registered voter?</span>
                        </div>

                        <p className="text-xs italic text-muted">
                            Comprehensive details are collected for our Annual Voter&apos;s Education.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm font-semibold text-navy">
                                How many are in your household? *
                                <input
                                    className="auth-input mt-2"
                                    type="number"
                                    min={1}
                                    value={householdSize}
                                    onChange={(e) => setHouseholdSize(e.target.value)}
                                    required
                                />
                            </label>
                            <label className="block text-sm font-semibold text-navy">
                                Household registered voters? (Optional)
                                <input
                                    className="auth-input mt-2"
                                    type="number"
                                    min={0}
                                    value={householdVoters}
                                    onChange={(e) => setHouseholdVoters(e.target.value)}
                                />
                            </label>
                        </div>

                        <label className="block text-sm font-semibold text-navy">
                            Sector *
                            <select
                                className="auth-input mt-2"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select your sector</option>
                                {SECTOR_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s === "Youth" ? "Youth (30 years old and under)" : s}</option>
                                ))}
                            </select>
                        </label>

                        {sector === "Others" && (
                            <label className="block text-sm font-semibold text-navy">
                                Please specify your sector *
                                <input
                                    className="auth-input mt-2"
                                    type="text"
                                    placeholder="Enter your sector"
                                    value={sectorOther}
                                    onChange={(e) => setSectorOther(e.target.value)}
                                    required
                                />
                            </label>
                        )}

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="flex-shrink-0 h-4 w-4 rounded border-gray-300 text-orange-500 accent-orange-500"
                                checked={newsletterSubscribed}
                                onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                            />
                            <span className="text-sm text-navy">
                                Subscribe to our monthly newsletter for volunteer &amp; organization opportunities.
                            </span>
                        </label>

                        <div className="rounded-2xl bg-[#fef7ee] px-4 py-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="flex-shrink-0 h-5 w-5 rounded border-gray-300 text-orange-500 accent-orange-500"
                                    checked={privacyConsent}
                                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                                    required
                                />
                                <span className="text-sm text-navy">
                                    I agree to the{" "}
                                    <button
                                        type="button"
                                        className="font-semibold text-orange-600 underline hover:text-orange-700"
                                        onClick={() => setShowPrivacyModal(true)}
                                    >
                                        Privacy Advisory and Data Consent
                                    </button>
                                </span>
                            </label>
                        </div>

                        {error ? (
                            <div
                                ref={errorRef}
                                className="auth-reveal rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                                role="alert"
                                aria-live="assertive"
                                aria-atomic="true"
                                tabIndex={-1}
                            >
                                {error}
                            </div>
                        ) : null}

                        <button
                            className="mt-2 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70"
                            type="submit"
                            disabled={loading}
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
                                {loading ? "Completing..." : "Complete Registration"}
                            </span>
                        </button>
                    </form>
                </section>
            </div>

            <PrivacyAdvisoryModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
}
