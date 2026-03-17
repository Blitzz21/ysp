"use client";

import { useEffect } from "react";

const streamImages = [
  "/images/stream/014d3923-5e06-47d0-8a9a-efebe045c6e0.jfif",
  "/images/stream/30e47b51-d75a-4005-ae46-4f37bacb72d5.jfif",
  "/images/stream/43038641-a50e-4d46-95cd-12d0e185bb40.jfif",
  "/images/stream/489fcb6f-d2e6-43dd-be4b-b76a540595f4.jfif",
  "/images/stream/8d59f95f-787a-4cfa-88da-78a91ffa9ae1.jfif",
  "/images/stream/a77a5681-1b99-49d1-8642-ad26ae8275ab.jfif",
  "/images/stream/af1f29b2-64bc-4e69-b802-fad4f387c6e0.jfif",
  "/images/stream/d570fdaf-bfc1-4b41-8b76-554c3d74b98d.jfif",
  "/images/stream/f5509470-01b1-487f-908e-ff1580188a2c.jfif",
  "/images/stream/f6cf0b93-6012-4930-adc9-3d3bafc2c6ea.jfif",
];

// Distribute 10 images across 3 rows of 5
const row1Images = [streamImages[0], streamImages[1], streamImages[2], streamImages[3], streamImages[4]];
const row2Images = [streamImages[5], streamImages[6], streamImages[7], streamImages[8], streamImages[9]];
const row3Images = [streamImages[2], streamImages[0], streamImages[7], streamImages[5], streamImages[3]];

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
            {row1Images.map((src, i) => (
              <div
                key={i}
                className="stream-card"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </div>
        <div className="stream-row">
          <div className="stream-track" data-stream-row data-direction="-1" data-speed="1.35">
            {row2Images.map((src, i) => (
              <div
                key={i}
                className="stream-card"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </div>
        <div className="stream-row">
          <div className="stream-track" data-stream-row data-direction="1" data-speed="1.15">
            {row3Images.map((src, i) => (
              <div
                key={i}
                className="stream-card"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
