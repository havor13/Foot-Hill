/** Student sign-up emails: byu.edu, student.byu.edu, byupathway.edu and student.byupathway.edu. */
export const STUDENT_EMAIL = /^[^\s@]+@(student\.)?(byu|byupathway)\.edu$/i;

export const INDUSTRIES = ["Tech", "Health", "Business", "Education", "Creative", "Engineering"] as const;

export const OPEN_TO = [
  "Mentoring",
  "Coffee chat",
  "Resume review",
  "Interview prep",
  "Referrals",
  "Portfolio review",
  "Career advice",
] as const;