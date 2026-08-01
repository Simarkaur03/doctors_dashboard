import { clsx } from "../../utils/clsx";

/**
 * The single page frame for every content page — the three dashboards
 * (patient, doctor, admin) and the public prose pages. The vertically centred
 * card used by login / landing / 403 is the one other frame in the app.
 *
 * Before this existed, each page hand-rolled its own
 * `<main className="bg-accent p-4 md:p-6"><div className="mx-auto max-w-…">`.
 * The max widths had drifted across six different values (xl → 6xl) and the
 * vertical rhythm across three (space-y-3 / space-y-4 / gap-4). Below `md`
 * every one of those collapses to the same full-bleed column, so mobile looked
 * uniform while desktop snapped the content column between 576px and 1152px as
 * you moved between pages of the *same* dashboard. Routing every page through
 * this component is what keeps the two in step.
 *
 * Only two widths exist, and which one a page gets is a content decision, not a
 * per-page preference:
 *
 * - `default` — anything with cards, grids, lists or tabular data.
 * - `narrow`  — single-column forms and prose, where a 1024px measure would
 *               stretch inputs and hurt readability.
 *
 * Pages own no outer spacing of their own; children are stacked by `gap-4`.
 */
const WIDTHS = {
  default: "max-w-5xl",
  narrow: "max-w-2xl",
} as const;

export function PageContainer({
  width = "default",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // No min-h-screen: `body` already paints the cream canvas, so a short page
    // looks identical without making every route a full viewport tall.
    <main className="bg-accent p-4 md:p-6">
      <div className={clsx("mx-auto flex w-full flex-col gap-4", WIDTHS[width], className)}>
        {children}
      </div>
    </main>
  );
}
