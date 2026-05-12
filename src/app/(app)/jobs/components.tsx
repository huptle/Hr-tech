"use client";

import { useState } from "react";
import {
  Plus,
  MoreVertical,
  Layout,
  Settings2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import {
  BtnPrimary,
  BtnSecondary,
  FormField,
  fieldInputClass,
} from "@/components/ui/primitives";
import { useRouter } from "next/navigation";
import {
  generateNewJobDraft,
  polishJobDescriptionDraft,
  replaceJobScreeningQuestionsWithAi,
} from "@/app/actions/ai";

export function CreateJobFormModal({
  action,
  geminiReady,
}: {
  action: (payload: FormData) => void;
  geminiReady: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roughNotes, setRoughNotes] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function runDraft() {
    setAiError(null);
    setAiBusy(true);
    try {
      const draft = await generateNewJobDraft(title, roughNotes);
      setDescription(draft.description);
      setQuestionsJson(JSON.stringify(draft.questions));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI draft failed");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <>
      <BtnPrimary onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" />
        Post a new job
      </BtnPrimary>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Post a new job">
        <form
          action={action}
          onSubmit={() => setTimeout(() => setIsOpen(false), 100)}
          className="space-y-4"
        >
          <input type="hidden" name="questionsJson" value={questionsJson} />

          <div className="mb-2">
            <p className="text-sm text-text-secondary">
              Saves the description and screening questions (defaults or Gemini-generated).
            </p>
          </div>

          <FormField label="Job title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Analyst"
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          {geminiReady && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
              <p className="text-xs font-medium text-text-secondary">
                Gemini: rough bullets → polished JD + 10 tailored questions (fills the form below).
              </p>
              <FormField label="Rough notes / bullets (optional)" htmlFor="roughNotes">
                <textarea
                  id="roughNotes"
                  value={roughNotes}
                  onChange={(e) => setRoughNotes(e.target.value)}
                  rows={3}
                  placeholder="Stack, level, location, must-haves…"
                  className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
                />
              </FormField>
              <BtnSecondary
                type="button"
                className="text-xs"
                disabled={aiBusy || !title.trim()}
                onClick={runDraft}
              >
                {aiBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Generate draft with Gemini
              </BtnSecondary>
              {aiError && (
                <p className="text-xs text-red-400 whitespace-pre-wrap">{aiError}</p>
              )}
            </div>
          )}

          <FormField label="Job description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste full JD or use Gemini above…"
              className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <BtnPrimary type="submit">
              <Plus className="h-4 w-4" />
              Create job
            </BtnPrimary>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function JobRowActions({ jobId }: { jobId: string }) {
  const router = useRouter();

  return (
    <Dropdown
      trigger={
        <div className="p-2 hover:bg-accent/10 rounded-lg text-text-muted transition-colors inline-flex">
          <MoreVertical className="h-4 w-4 text-text-secondary" />
        </div>
      }
      align="right"
    >
      <DropdownItem onClick={() => router.push(`/jobs/${jobId}`)}>
        <Layout className="h-4 w-4" />
        Open Workspace
      </DropdownItem>
      <DropdownItem onClick={() => router.push(`/jobs/${jobId}/shortlist`)}>
        <Settings2 className="h-4 w-4" />
        Shortlist
      </DropdownItem>
    </Dropdown>
  );
}

export function AddCandidateModal({ action }: { action: (payload: FormData) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <BtnPrimary onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" />
        Add candidate
      </BtnPrimary>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Candidate">
        <form
          action={action}
          onSubmit={() => setTimeout(() => setIsOpen(false), 100)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField label="Name" htmlFor="name" className="sm:col-span-2">
            <input
              id="name"
              name="name"
              required
              placeholder="Candidate full name"
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <FormField label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <FormField label="Phone (optional)" htmlFor="phone">
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 555 000 0000"
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <FormField label="Joining availability" htmlFor="joiningAvailability" className="sm:col-span-2">
            <input
              id="joiningAvailability"
              name="joiningAvailability"
              placeholder="e.g. 2 weeks notice"
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <FormField label="Resume summary / notes" htmlFor="resumeNotes" className="sm:col-span-2">
            <textarea
              id="resumeNotes"
              name="resumeNotes"
              rows={3}
              placeholder="Paste key bullets or parsed resume text…"
              className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
            />
          </FormField>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <BtnPrimary type="submit">
              <Plus className="h-4 w-4" />
              Add candidate
            </BtnPrimary>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function JobSettingsModal({
  job,
  action,
  geminiReady,
}: {
  job: {
    id: string;
    title: string;
    description: string;
    screeningDurationMin: number;
  };
  action: (payload: FormData) => void;
  geminiReady: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [desc, setDesc] = useState(job.description);
  const [polishBusy, setPolishBusy] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setDesc(job.description);
          setAiError(null);
        }}
        className="text-sm px-3 py-1.5 rounded-lg bg-surface border border-border/40 text-text-secondary hover:bg-accent/10 transition-colors"
      >
        Edit Details
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Job description & settings">
        <form
          action={action}
          onSubmit={() => setTimeout(() => setIsOpen(false), 100)}
          className="space-y-4"
        >
          <FormField label="Title" htmlFor="title">
            <input
              id="title"
              name="title"
              defaultValue={job.title}
              required
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <FormField label="Description (JD)" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={7}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
            />
          </FormField>

          {geminiReady && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <BtnSecondary
                type="button"
                className="text-xs"
                disabled={polishBusy || replaceBusy}
                onClick={async () => {
                  setAiError(null);
                  setPolishBusy(true);
                  try {
                    const next = await polishJobDescriptionDraft(job.id);
                    setDesc(next);
                  } catch (e) {
                    setAiError(e instanceof Error ? e.message : "Polish failed");
                  } finally {
                    setPolishBusy(false);
                  }
                }}
              >
                {polishBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Polish JD with Gemini
              </BtnSecondary>
              <BtnSecondary
                type="button"
                className="text-xs"
                disabled={polishBusy || replaceBusy}
                onClick={async () => {
                  if (
                    !confirm(
                      "Replace all voice screening questions for this job with new AI-generated ones?",
                    )
                  )
                    return;
                  setAiError(null);
                  setReplaceBusy(true);
                  try {
                    await replaceJobScreeningQuestionsWithAi(job.id);
                    router.refresh();
                  } catch (e) {
                    setAiError(e instanceof Error ? e.message : "Replace failed");
                  } finally {
                    setReplaceBusy(false);
                  }
                }}
              >
                {replaceBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Regenerate questions
              </BtnSecondary>
            </div>
          )}
          {aiError && (
            <p className="text-xs text-red-400 whitespace-pre-wrap">{aiError}</p>
          )}

          <FormField
            label="Screening call length (min)"
            htmlFor="screeningDurationMin"
          >
            <input
              id="screeningDurationMin"
              name="screeningDurationMin"
              type="number"
              min={5}
              max={120}
              defaultValue={job.screeningDurationMin}
              className={fieldInputClass.replace("mt-1 ", "")}
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <BtnPrimary type="submit">Save changes</BtnPrimary>
          </div>
        </form>
      </Modal>
    </>
  );
}
