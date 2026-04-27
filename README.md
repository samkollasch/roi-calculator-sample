# ROI Calculator — Code Sample

A standalone Next.js app showcasing a meaningful, stateful React component
backed by a pure-TypeScript pricing model. Extracted and adapted from a
production marketing site for an interview submission.

## What this sample demonstrates

| Area of emphasis | Where to look |
| --- | --- |
| **TypeScript** | All source files; see `src/lib/calculations/roi.types.ts` for the strongly-typed model. |
| **Meaningful React component** | `src/components/roi-calculator.tsx` — multi-stage UI, dialog confirmation, dashboard handoff. |
| **React Hooks** | `useState`, `useMemo`, `useCallback` in `roi-calculator.tsx`; `useEffect` + `useRef` driving the rAF animation in `animated-metric.tsx`. |
| **State management** | Inputs, dialog, and post-submit dashboard are coordinated via local state — no external store required. |
| **Data fetching** | Not the focus of this sample; see the companion `webinar-list-sample` for `@tanstack/react-query` + Next.js route handlers. |
| **Automated testing** | Vitest + Testing Library. Pure-TS coverage in `tests/roi.test.ts`; component coverage in `tests/roi-calculator.test.tsx`. |
| **Next.js** | App Router (`app/layout.tsx`, `app/page.tsx`). |

## Running locally

```bash
pnpm install      # or npm install / yarn
pnpm dev          # http://localhost:3000
pnpm test         # run the Vitest suite
pnpm build        # production build, ready for Vercel
```

This is a stock Next.js project, so deploying to Vercel is just `vercel` —
no additional environment variables or backend services required.

## File map

```
roi-calculator-sample/
├── app/
│   ├── layout.tsx            # Next.js root layout
│   ├── page.tsx              # Renders <ROICalculator />
│   └── globals.css           # Tailwind entry point
├── src/
│   ├── components/
│   │   ├── roi-calculator.tsx        # Main stateful component
│   │   ├── roi-dashboard.tsx         # Results view
│   │   ├── animated-metric.tsx       # rAF-driven number ticker
│   │   └── ui/                       # Minimal Button / Container / Dialog
│   └── lib/
│       └── calculations/
│           ├── roi.ts                # Pricing model (pure TS)
│           └── roi.types.ts          # Inputs, results, channel breakdown
└── tests/
    ├── setup.ts                      # jsdom dialog polyfill
    ├── roi.test.ts                   # Pure-TS unit tests
    └── roi-calculator.test.tsx       # Component tests via @testing-library
```

## Notes on adaptation from the original codebase

The component originally consumed Sanity CMS query results
(`GetFormPageQueryResult`) and submitted leads through a Marketo form.
Both integrations were stripped to keep the sample reviewable in
isolation. The calculation logic and the React state machine are
unchanged in spirit — only the surrounding wiring was simplified.
# roi-calculator-sample
