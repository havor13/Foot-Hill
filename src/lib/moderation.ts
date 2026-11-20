/** Reasons a student can give when reporting something. Shared by the forms and the server. */
export const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or ads" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "INAPPROPRIATE", label: "Inappropriate or unsafe" },
  { value: "OTHER", label: "Something else" },
] as const;

export type ReportReasonValue = (typeof REPORT_REASONS)[number]["value"];

export const isReportReason = (v: unknown): v is ReportReasonValue =>
  REPORT_REASONS.some((r) => r.value === v);

export const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;
