import { revalidatePath } from "next/cache";

import { AddProgramModal } from "@/components/admin/AddProgramModal";
import { ProgramCard } from "@/components/admin/ProgramCard";

import { toPublicDomainError } from "@/services/errorContract";
import {
  adminListPrograms,
  createProgram,
  deleteProgram,
  updateProgram,
} from "@/services/programs";
import type { Program } from "@/services/types";

function readFile(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return undefined;
}

async function createProgramAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  try {
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const published = String(formData.get("published") ?? "false") === "true";
    const imageFile = readFile(formData, "imageFile");

    await createProgram({
      title,
      slug: slug.length ? slug : undefined,
      description,
      published,
      imageFile,
    });
    revalidatePath("/admin/programs");
    revalidatePath("/");
    revalidatePath("/programs");
    return { ok: true, message: "Program created." };
  } catch (error) {
    console.error("[createProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to create program").message;
    return { ok: false, message };
  }
}

async function updateProgramAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const published = String(formData.get("published") ?? "false") === "true";
    const removeImage = formData.get("removeImage") === "on";
    const imageFile = readFile(formData, "imageFile");

    await updateProgram(id, {
      title: title.length ? title : undefined,
      slug: slug.length ? slug : undefined,
      description: description.length ? description : undefined,
      published,
      imageFile: removeImage ? null : imageFile,
    });
    revalidatePath("/admin/programs");
    revalidatePath("/");
    revalidatePath("/programs");
    return { ok: true, message: "Program updated." };
  } catch (error) {
    console.error("[updateProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to update program").message;
    return { ok: false, message };
  }
}

async function deleteProgramAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteProgram(id);
    revalidatePath("/admin/programs");
    revalidatePath("/");
    revalidatePath("/programs");
    return { ok: true, message: "Program deleted." };
  } catch (error) {
    console.error("[deleteProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to delete program").message;
    return { ok: false, message };
  }
}


export default async function AdminProgramsPage() {
  let programs: Program[] = [];
  let hasLoadError = false;

  try {
    programs = await adminListPrograms({ includeDrafts: true });
  } catch {
    hasLoadError = true;
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
            Admin
          </p>
          <h2 className="font-manrope text-2xl font-semibold">Programs</h2>
          <p className="mt-1 text-sm text-muted">
            Create, publish, and maintain program content.
          </p>
        </div>
        <AddProgramModal action={createProgramAction} />
      </div>

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Programs are unavailable. Please confirm admin access and Appwrite
          configuration.
        </div>
      ) : null}

      {!hasLoadError && programs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2e1] text-2xl">
            *
          </div>
          <p className="text-sm text-ink">No programs yet.</p>
          <p className="mt-1 text-xs text-muted">
            Add your first program to unlock public pages.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-muted md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Add a short, clear title.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Draft before publishing.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Upload a square image if possible.
            </div>
          </div>
        </div>
      ) : null}

      {!hasLoadError && programs.length > 0 ? (
        <div className="grid gap-6">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              updateAction={updateProgramAction}
              deleteAction={deleteProgramAction}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

