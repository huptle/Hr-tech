import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Mail, FileCode, FileText, Layout, Trash2, Plus } from "lucide-react";
import { createTemplate, deleteTemplate } from "@/app/actions/templates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Templates · Huptle HR" };

const CATEGORIES = ["Interview", "Offer", "Rejection", "Onboarding", "Other"];
const TYPES = ["Email", "Job Description", "Document"];

function iconForType(type: string) {
  if (type === "Email") return Mail;
  if (type === "Job Description") return FileCode;
  return FileText;
}

export default async function TemplatesPage() {
  await requireUser();
  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Library</div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Templates</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            Standardize emails, offer letters, and job descriptions for your team.
          </p>
        </div>
      </div>

      <details className="bg-surface border border-border rounded-2xl overflow-hidden">
        <summary className="cursor-pointer list-none flex items-center gap-3 px-6 py-4 hover:bg-surface-2 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Plus size={16} />
          </div>
          <span className="text-sm font-bold text-text-primary">Create new template</span>
        </summary>
        <form action={createTemplate} className="p-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Title</label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Round 1 — HR Screening"
              className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="type" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Type</label>
            <select
              id="type"
              name="type"
              defaultValue="Email"
              className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Category</label>
            <select
              id="category"
              name="category"
              defaultValue="Interview"
              className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="body" className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Body</label>
            <textarea
              id="body"
              name="body"
              rows={6}
              placeholder="Hi [Candidate Name], …"
              className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent transition-colors resize-y leading-relaxed"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all"
            >
              <Plus size={16} /> Create template
            </button>
          </div>
        </form>
      </details>

      {templates.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted opacity-60">
            <Layout size={32} />
          </div>
          <h3 className="text-base font-bold text-text-primary">No templates yet</h3>
          <p className="text-sm text-text-muted mt-1">Create your first template above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => {
            const Icon = iconForType(t.type);
            return (
              <div key={t.id} className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/40 transition-all flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Icon size={18} />
                  </div>
                  <form action={deleteTemplate.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 flex items-center justify-center transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary truncate">{t.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t.type}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-[10px] font-bold text-accent">{t.category}</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted line-clamp-3 leading-relaxed font-medium whitespace-pre-wrap">
                  {t.body || "—"}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-text-muted font-medium">
                  <span>{t.author?.name ?? "—"}</span>
                  <span>
                    Updated{" "}
                    {t.updatedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
