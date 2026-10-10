"use client";

import { Fragment } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Citation {
  label: string;
  target: string;
}

type Token = { kind: "text"; text: string } | { kind: "cite"; cite: Citation };

export interface BriefingSegment {
  text: string;
  sources: (Citation | "vs")[];
}

const FILE_EXT = /\.(pdf|txt|csv|json|tiff?|png|jpe?g|docx?)\b/i;
// Workflow links "[label](#target)" and seeded source lists "[File_A.pdf, File_B.pdf]".
const CITATION = /\[([^\]]+)\]\(#([^)]+)\)|\[([^\]]+)\](?!\()/g;
const SEPARATOR = /^[\s();,]*(vs\.?)?[\s();,]*$/i;

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(CITATION))) {
    const [whole, label, target, list] = m;
    if (list !== undefined && !FILE_EXT.test(list)) continue;
    if (m.index! > last) tokens.push({ kind: "text", text: text.slice(last, m.index) });
    if (target !== undefined) {
      tokens.push({ kind: "cite", cite: { label: label.trim(), target: target.trim() } });
    } else {
      list.split(/(\s+vs\.?\s+|,)/i).forEach((part: string) => {
        if (/^\s+vs/i.test(part)) tokens.push({ kind: "text", text: " vs. " });
        else if (part.trim() && part !== ",") tokens.push({ kind: "cite", cite: { label: part.trim(), target: part.trim() } });
      });
    }
    last = m.index! + whole.length;
  }
  if (last < text.length) tokens.push({ kind: "text", text: text.slice(last) });
  return tokens;
}

function tidy(text: string): string {
  return text.replace(/\(\s*$/, "").replace(/^\s*[);,.]+/, "").replace(/\s{2,}/g, " ").trim();
}

/** Splits text into statements, each followed by the sources that back it. */
export function parseSegments(text: string): BriefingSegment[] {
  const segments: BriefingSegment[] = [];
  let current: BriefingSegment = { text: "", sources: [] };
  const tokens = tokenize(text);
  tokens.forEach((token, i) => {
    if (token.kind === "cite") {
      current.sources.push(token.cite);
      return;
    }
    const between = current.sources.length > 0 && tokens[i + 1]?.kind === "cite" && SEPARATOR.test(token.text);
    if (between) {
      if (/vs/i.test(token.text)) current.sources.push("vs");
      return;
    }
    if (current.sources.length > 0) {
      segments.push({ ...current, text: tidy(current.text) });
      current = { text: "", sources: [] };
    }
    current.text += token.text;
  });
  current.text = tidy(current.text);
  if (current.text || current.sources.length) segments.push(current);
  return segments.filter((s) => s.text || s.sources.length);
}

export function stripCitations(text: string): string {
  return parseSegments(text).map((s) => s.text).join(" ").trim();
}

function docKey(name: string): string {
  return name.trim().replace(/^#/, "").replace(/^document-/i, "").replace(FILE_EXT, "").toLowerCase();
}

export function findCitedDocument<T extends { id: string; name: string }>(docs: T[], target: string): T | undefined {
  const key = docKey(target);
  return docs.find((d) => d.id.toLowerCase() === key || docKey(d.name) === key);
}

export function InlineText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

interface SourceProps {
  docs: { id: string; name: string }[];
  onOpenDocument: (docId: string) => void;
}

export function SourceChips({ sources, docs, onOpenDocument }: SourceProps & { sources: BriefingSegment["sources"] }) {
  if (!sources.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-middle ml-1">
      {sources.map((source, i) => {
        if (source === "vs") return <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">vs</span>;
        const doc = findCitedDocument(docs, source.target);
        return (
          <button
            key={i}
            type="button"
            disabled={!doc}
            onClick={() => doc && onOpenDocument(doc.id)}
            title={doc ? `Open ${doc.name}` : `${source.target} is not one of this claim's documents`}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium leading-none",
              doc ? "bg-white border-acme-teal/30 text-acme-teal hover:bg-acme-teal/5" : "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
            )}
          >
            <FileText className="w-2.5 h-2.5" />
            {source.label}
          </button>
        );
      })}
    </span>
  );
}

/** A statement with its source chips; several statements become bullet points. */
export function CitedText({ text, docs, onOpenDocument, className }: SourceProps & { text: string; className?: string }) {
  const segments = parseSegments(text);
  if (segments.length <= 1) {
    const s = segments[0] ?? { text, sources: [] };
    return (
      <p className={cn("text-sm text-gray-700 leading-relaxed", className)}>
        <InlineText text={s.text} />
        <SourceChips sources={s.sources} docs={docs} onOpenDocument={onOpenDocument} />
      </p>
    );
  }
  return (
    <ul className={cn("space-y-1.5 text-sm text-gray-700 leading-relaxed", className)}>
      {segments.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-acme-orange/70 flex-shrink-0" />
          <span>
            <InlineText text={s.text} />
            <SourceChips sources={s.sources} docs={docs} onOpenDocument={onOpenDocument} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Splits "Label: text" when the label is a short heading. */
export function splitLabel(line: string): { label?: string; body: string } {
  const m = line.match(/^\s*\**([A-Za-z][A-Za-z &/'’()-]{1,48}?)\**\s*[:—–]\s+([\s\S]*)$/);
  return m ? { label: m[1].trim(), body: m[2].trim() } : { body: line.trim() };
}

/** Workflow "-- Label: text" lines as labelled rows. */
export function LabeledLines({ text, docs, onOpenDocument }: SourceProps & { text: string }) {
  const lines = text
    .replace(/[ \t]+--[ \t]+/g, "\n-- ")
    .split("\n")
    .map((l) => l.replace(/^\s*(?:--|-|\*|•)\s*/, "").trim())
    .filter(Boolean);
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const { label, body } = splitLabel(line);
        return (
          <div key={i} className={cn(i > 0 && "pt-3 border-t border-acme-border/50")}>
            {label && <p className="text-[10px] font-bold uppercase tracking-wider text-acme-teal mb-1">{label}</p>}
            <CitedText text={body} docs={docs} onOpenDocument={onOpenDocument} />
          </div>
        );
      })}
    </div>
  );
}

/** "1. … 2. …" next steps as a numbered checklist. */
export function NumberedSteps({ text, docs, onOpenDocument }: SourceProps & { text: string }) {
  const numbered = /^\s*(?:--\s*)?1\.\s/.test(text);
  const steps = (numbered ? text.split(/(?:^|\s|--\s*)\d{1,2}\.\s+(?=[A-Z])/) : [text])
    .map((s) => s.replace(/^\s*--\s*/, "").trim())
    .filter(Boolean);
  return (
    <ol className="space-y-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
          <CitedText text={step} docs={docs} onOpenDocument={onOpenDocument} className="flex-1" />
        </li>
      ))}
    </ol>
  );
}
