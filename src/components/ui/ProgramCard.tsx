"use client";

import { useState } from "react";
import { getFileViewUrl } from "@/lib/imageUrl";
import { ProgramDetailModal } from "./ProgramDetailModal";

type ProgramData = {
  id: string;
  title: string;
  description: string;
  imageFileId?: string;
  createdAt: string;
};

export function ProgramCard({ program }: { program: ProgramData }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <article
        className="reveal group cursor-pointer rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowModal(true); } }}
        role="button"
        tabIndex={0}
      >
        {program.imageFileId ? (
          <div className="h-32 overflow-hidden rounded-2xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- Appwrite storage URL */}
            <img
              src={getFileViewUrl(program.imageFileId)}
              alt={program.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]"></div>
        )}
        <h3 className="mt-4 font-manrope text-lg font-semibold">
          {program.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{program.description}</p>
        <span className="mt-4 inline-flex rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition group-hover:border-orange-300 group-hover:text-orange-600">
          View details
        </span>
      </article>

      {showModal ? (
        <ProgramDetailModal
          program={program}
          onClose={() => setShowModal(false)}
        />
      ) : null}
    </>
  );
}
