import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { extractPolicyId } from "./tokenize";
import type { PolicyChunk, PolicyDocument } from "./types";

const HEADER_RE = /^\*\*([A-Za-z /]+):\*\*\s*(.+)$/;

const POLICIES_DIR = join(process.cwd(), "policies");

function resolvePoliciesDir(): string {
  if (!existsSync(POLICIES_DIR)) {
    throw new Error(
      `Unable to locate policies/*.md at ${POLICIES_DIR}. Expected a policies/ directory at the repo root.`,
    );
  }
  return POLICIES_DIR;
}

function parseFrontMatter(raw: string, fileName: string): PolicyDocument {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const titleLine = lines.find((line) => line.startsWith("# ")) ?? fileName;
  const title = titleLine.replace(/^#\s+/, "").trim();
  const id = extractPolicyId(title) ?? extractPolicyId(fileName);
  if (!id) {
    throw new Error(`Policy file ${fileName} is missing a POL-XXX-000 identifier`);
  }

  let severity = "UNSET";
  let framework = "UNSET";
  let domain = "UNSET";
  for (const line of lines) {
    const match = line.match(HEADER_RE);
    if (!match) continue;
    const label = match[1].toLowerCase();
    if (label === "severity") severity = match[2].trim();
    if (label === "framework") framework = match[2].trim();
    if (label === "domain") domain = match[2].trim();
  }

  return {
    id,
    title,
    severity,
    framework,
    domain,
    fileName,
    text: raw.trim(),
  };
}

export function loadPolicies(dir = resolvePoliciesDir()): PolicyDocument[] {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No policy markdown files found in ${dir}`);
  }
  return files.map((fileName) =>
    parseFrontMatter(readFileSync(join(dir, fileName), "utf8"), fileName),
  );
}

export function chunkPolicies(documents: PolicyDocument[]): PolicyChunk[] {
  const chunks: PolicyChunk[] = [];

  for (const doc of documents) {
    const sections = splitSections(doc.text);
    sections.forEach((section, index) => {
      chunks.push({
        chunkId: `${doc.id}#${index + 1}`,
        policyId: doc.id,
        title: doc.title,
        heading: section.heading,
        text: section.body,
        sourceFile: doc.fileName,
      });
    });
  }

  return chunks;
}

function splitSections(text: string): { heading: string; body: string }[] {
  const parts = text.split(/^## /m);
  if (parts.length === 1) {
    return [{ heading: "full", body: text.trim() }];
  }

  const preamble = parts[0].trim();
  const sections: { heading: string; body: string }[] = [];
  if (preamble) {
    sections.push({ heading: "header", body: preamble });
  }

  for (const part of parts.slice(1)) {
    const [heading, ...rest] = part.split("\n");
    const body = rest.join("\n").trim();
    if (body) {
      sections.push({ heading: heading.trim(), body: `## ${heading.trim()}\n${body}` });
    }
  }

  return sections;
}
