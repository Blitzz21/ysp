"use client";

import { useEffect } from "react";

export function OpportunityStreamSection() {
  useEffect(() => {
    const streamSection = document.querySelector<HTMLElement>(
      "[data-stream-section]"
    );
    if (!streamSection) return;

    const streamRows = streamSection.querySelectorAll<HTMLElement>(
      "[data-stream-row]"
    );
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId: number | null = null;
    let isScrollBound = false;

    const setStaticFallback = () => {
      streamSection.dataset.motionMode = "reduced";
      streamRows.forEach((row) => {
        row.style.transform = "none";
      });
      streamSection.style.opacity = "1";
      streamSection.style.transform = "none";
    };

    const updateStreamGallery = () => {
      if (mediaQuery.matches) {
        setStaticFallback();
        return;
      }

      streamSection.dataset.motionMode = "full";
      const rect = streamSection.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const rawProgress =
        (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
      const offset = (clampedProgress - 0.5) * 2;

      streamRows.forEach((row) => {
        const direction = Number.parseFloat(row.dataset.direction || "1");
        const speed = Number.parseFloat(row.dataset.speed || "1");
        const maxShift = 160 * speed;
        row.style.transform = `translateX(${offset * maxShift * direction}px)`;
      });

      let fade = 1;
      if (rawProgress > 1) {
        fade = Math.max(0, 1 - (rawProgress - 1) * 2);
      }
      streamSection.style.opacity = fade.toString();
      streamSection.style.transform = `translateY(${(1 - fade) * 24}px)`;
    };

    const handleScroll = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(updateStreamGallery);
    };

    const bindMotionBehavior = () => {
      if (mediaQuery.matches) {
        if (isScrollBound) {
          window.removeEventListener("scroll", handleScroll);
          isScrollBound = false;
        }
        setStaticFallback();
        return;
      }

      if (!isScrollBound) {
        window.addEventListener("scroll", handleScroll, { passive: true });
        isScrollBound = true;
      }
      updateStreamGallery();
    };

    bindMotionBehavior();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", bindMotionBehavior);
    } else {
      mediaQuery.addListener(bindMotionBehavior);
    }

    return () => {
      if (isScrollBound) {
        window.removeEventListener("scroll", handleScroll);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", bindMotionBehavior);
      } else {
        mediaQuery.removeListener(bindMotionBehavior);
      }
    };
  }, []);

  return (
    <section
      className="opportunity-stream py-20"
      data-stream-section
      aria-label="Opportunity stream gallery"
    >
      <div className="mx-auto w-[92%] max-w-6xl text-center">
        <div className="reveal inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600">
          Opportunity Stream
        </div>
        <h2 className="reveal mt-6 font-manrope text-3xl font-bold md:text-4xl">
          Your Future Awaits
        </h2>
        <p className="reveal mx-auto mt-3 max-w-2xl text-muted">
          Swipe through the world of possibilities. Each image represents a
          real impact made by our volunteers across the country.
        </p>
      </div>

      <div className="stream-rows mx-auto mt-12 space-y-6">
          <div className="stream-row">
            <div className="stream-track" data-stream-row data-direction="1" data-speed="1.1">
            <div className="stream-card bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#D7F5F5_0%,#1FA2A5_90%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE7D9_0%,#F24A00_90%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F1F6FF_0%,#1F2A33_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF4D6_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#D7F5F5_0%,#1FA2A5_90%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE7D9_0%,#F24A00_90%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F1F6FF_0%,#1F2A33_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF4D6_0%,#FF7A1A_100%)]"></div>
          </div>
        </div>
          <div className="stream-row">
            <div className="stream-track" data-stream-row data-direction="-1" data-speed="1.35">
            <div className="stream-card bg-[linear-gradient(135deg,#E4F0FF_0%,#0C1230_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF0DE_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE3C6_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#E9F7F2_0%,#1FA2A5_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF7E8_0%,#F24A00_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#E4F0FF_0%,#0C1230_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF0DE_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE3C6_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#E9F7F2_0%,#1FA2A5_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF7E8_0%,#F24A00_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_100%)]"></div>
          </div>
        </div>
          <div className="stream-row">
            <div className="stream-track" data-stream-row data-direction="1" data-speed="1.15">
            <div className="stream-card bg-[linear-gradient(135deg,#FFEFE1_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F0FBFF_0%,#1FA2A5_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF6DA_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE0C8_0%,#F24A00_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F1F6FF_0%,#0C1230_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFEFE1_0%,#FF7A1A_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F0FBFF_0%,#1FA2A5_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFF6DA_0%,#FFCF3D_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#FFE0C8_0%,#F24A00_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F1F6FF_0%,#0C1230_100%)]"></div>
            <div className="stream-card bg-[linear-gradient(135deg,#F7F8FA_0%,#FF7A1A_100%)]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
