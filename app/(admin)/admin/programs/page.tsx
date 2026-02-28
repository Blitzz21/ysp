import { revalidatePath } from "next/cache";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { toPublicDomainError } from "@/services/errorContract";
import {
  adminListPrograms,
  createProgram,
  deleteProgram,
  updateProgram,
} from "@/services/programs";
import type { Program } from "@/services/types";
import { type SearchParams, readParam, createRedirectBuilder } from "@/lib/pageHelpers";

const buildRedirect = createRedirectBuilder("/admin/programs");

function readFile(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return undefined;
}

async function createProgramAction(formData: FormData): Promise<void> {
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
  } catch (error) {
    console.error("[createProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to create program").message;
    buildRedirect("error", message);
  }

  revalidatePath("/admin/programs");
  revalidatePath("/");
  revalidatePath("/programs");
  buildRedirect("success", "Program created.");
}

async function updateProgramAction(formData: FormData): Promise<void> {
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
  } catch (error) {
    console.error("[updateProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to update program").message;
    buildRedirect("error", message);
  }

  revalidatePath("/admin/programs");
  revalidatePath("/");
  revalidatePath("/programs");
  buildRedirect("success", "Program updated.");
}

async function deleteProgramAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteProgram(id);
  } catch (error) {
    console.error("[deleteProgramAction] failed:", error);
    const message = toPublicDomainError(error, "Failed to delete program").message;
    buildRedirect("error", message);
  }
  revalidatePath("/admin/programs");
  revalidatePath("/");
  revalidatePath("/programs");
  buildRedirect("success", "Program deleted.");
}

function ProgramCard({ program }: { program: Program }) {
  return (
    <details className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-manrope text-lg font-semibold">{program.title}</h3>
          <p className="text-xs text-muted">Slug: {program.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${program.published
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-muted"
              }`}
          >
            {program.published ? "Published" : "Draft"}
          </span>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-ink transition group-open:border-orange-300 group-open:text-orange-600">
            Edit
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Core details
          </h4>
          <form
            action={updateProgramAction}
            className="space-y-3"
          >
            <input type="hidden" name="id" value={program.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-ink">
                Title
                <CountedInput
                  name="title"
                  defaultValue={program.title}
                  maxLength={128}
                  hint="Max 128 characters."
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Slug
                <CountedInput
                  name="slug"
                  defaultValue={program.slug}
                  maxLength={128}
                  hint="Lowercase, numbers, hyphens."
                />
              </label>
            </div>
            <label className="text-xs font-semibold text-ink">
              Description
              <CountedTextarea
                name="description"
                defaultValue={program.description}
                maxLength={1024}
                hint="Max 1024 characters."
                rows={3}
              />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-ink">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  name="published"
                  defaultValue={program.published ? "true" : "false"}
                >
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-ink">
                Replace image
                <input
                  className="mt-1 w-full text-sm"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                />
                <span className="mt-1 block text-[11px] text-muted">
                  Allowed: jpg, png, svg, gif.
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                <input className="h-4 w-4" type="checkbox" name="removeImage" />
                Remove image
              </label>
            </div>
            <button
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
              type="submit"
            >
              Save changes
            </button>
          </form>
        </div>

        <aside className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Quick guidance</p>
          <ul className="mt-2 space-y-2">
            <li>Use short, action-oriented titles.</li>
            <li>Draft status hides programs from public pages.</li>
            <li>Image uploads use file ID for public display.</li>
          </ul>
          <form action={deleteProgramAction} className="mt-4">
            <input type="hidden" name="id" value={program.id} />
            <button
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
              type="submit"
            >
              Delete program
            </button>
          </form>
        </aside>
      </div>
    </details>
  );
}

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const message = readParam(params, "message");
  const status = readParam(params, "status");

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
          <p className="mt-2 text-sm text-muted">
            Create, publish, and maintain program content. Upload images that
            will render on public pages.
          </p>
        </div>
      </div>

      <StatusBanner status={status} message={message} className="mb-6" />

      <form
        action={createProgramAction}
        className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-manrope text-lg font-semibold">New program</h3>
            <p className="mt-1 text-xs text-muted">
              Slug will auto-generate if you leave it blank.
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
            Required fields marked
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Title{" "}
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
              Required
            </span>
            <CountedInput
              name="title"
              required
              placeholder="Youth Action Labs"
              maxLength={128}
              hint="Max 128 characters."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Slug (optional)
            <CountedInput
              name="slug"
              placeholder="youth-action-labs"
              maxLength={128}
              hint="Leave empty to auto-generate."
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-ink">
          Description{" "}
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
            Required
          </span>
          <CountedTextarea
            name="description"
            rows={3}
            required
            placeholder="Describe the program objectives, cadence, and outcomes."
            maxLength={1024}
            hint="Max 1024 characters."
          />
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-ink">
            Status
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="published"
              defaultValue="false"
            >
              <option value="false">Draft</option>
              <option value="true">Published</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Image upload
            <input
              className="mt-1 w-full text-sm"
              name="imageFile"
              type="file"
              accept="image/*"
            />
            <span className="mt-1 block text-[11px] text-muted">
              Allowed: jpg, png, svg, gif. WebP is not enabled yet.
            </span>
          </label>
        </div>
        <button
          className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-glow"
          type="submit"
        >
          Create program
        </button>
      </form>

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
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

