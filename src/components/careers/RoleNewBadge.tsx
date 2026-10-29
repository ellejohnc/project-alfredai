/** Role slugs that carry the "New" badge in the careers list. */
export const ROLE_NEW_SLUGS: string[] = ["senior-full-stack-ai-engineer"];

export function roleIsNew(slug: string | null): boolean {
  return !!slug && ROLE_NEW_SLUGS.includes(slug);
}

/** Small accent pill shown beside a role title when the role was just posted. */
export const RoleNewBadge = () => (
  <span className="inline-flex items-center rounded-full bg-partner-pink/10 border border-partner-pink/25 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-partner-pink align-middle">
    New
  </span>
);
