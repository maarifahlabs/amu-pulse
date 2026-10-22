import { z } from "zod";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || isHttpUrl(v), "Enter a valid http(s) URL")
  .transform((v) => v || null);

const requiredUrl = z.string().trim().max(500).refine(isHttpUrl, "Enter a valid http(s) URL");

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);

const slug = z.string().trim().toLowerCase().max(80).regex(SLUG_RE, "Use lowercase letters, numbers and hyphens");

export const uuid = z.string().uuid();

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Reads a FormData into a plain object of strings (files are skipped). */
export function formToObject(formData: FormData) {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") obj[key] = value;
  });
  return obj;
}

export const passwordAuthSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  next: z.string().optional(),
});

export const questionSchema = z.object({
  issueId: uuid,
  question: z.string().trim().min(10, "Please write at least 10 characters").max(500),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(0, "Spam detected").optional().default(""),
});

export const claimSchema = z.object({
  candidateId: uuid,
  slug,
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  proof: z.string().trim().min(10, "Describe how we can verify your candidacy").max(1000),
});

export const profileUpdateSchema = z.object({
  bio: z.string().trim().min(20, "Bio must be at least 20 characters").max(2000),
});

export const createProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  positionId: uuid,
  bio: z.string().trim().min(20, "Bio must be at least 20 characters").max(2000),
  department: optionalText(120),
  faculty: optionalText(120),
});

export const manifestoSchema = z.object({
  content: z.string().trim().min(50, "Manifesto must be at least 50 characters").max(10000),
  sourceUrl: optionalUrl,
});

export const answerSchema = z.object({
  issueId: uuid,
  answer: z.string().trim().min(20, "Answer must be at least 20 characters").max(2000),
  sourceUrl: optionalUrl,
});

export const reviewSchema = z.object({
  id: uuid,
  decision: z.enum(["approve", "reject"]),
});

export const issueSchema = z.object({
  id: z.union([uuid, z.literal("")]).optional(),
  title: z.string().trim().min(10).max(200),
  slug,
  description: optionalText(1000),
  context: optionalText(2000),
  category: z.string().trim().min(2).max(40),
  status: z.enum(["draft", "published", "archived"]),
});

export const positionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug,
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

export const candidateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  positionId: uuid,
  department: optionalText(120),
  faculty: optionalText(120),
  officialSourceUrl: optionalUrl,
  verificationStatus: z.enum(["unverified", "verified", "rejected"]),
});

export const candidateVerificationSchema = z.object({
  id: uuid,
  verificationStatus: z.enum(["unverified", "verified", "rejected"]),
});

export const adminCandidateUpdateSchema = candidateSchema.extend({
  id: uuid,
  bio: z.string().trim().max(2000).transform((value) => value || null),
  ballotNumber: z.string().trim().superRefine((value, ctx) => {
    if (!value) return;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 999) {
      ctx.addIssue({ code: "custom", message: "Ballot number must be from 1 to 999." });
    }
  }).transform((value) => (value ? Number(value) : null)),
  manifesto: z.string().trim().max(10000),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: optionalText(1000),
  kind: z.enum(["milestone", "polling", "notice"]),
  startsAt: z.string().trim().min(1, "Date is required"),
  sourceUrl: requiredUrl,
});

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
