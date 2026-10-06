# RecruitIQ — Instructions for Claude

## Responsive Design Requirement

The entire RecruitIQ application must be fully responsive and optimized for **mobile phones, tablets,
laptops, and desktop screens**.

- Use a mobile-first responsive design approach.
- All pages, dashboards, forms, tables, cards, navigation, modals, buttons, and resume-upload
  components must work properly on small screens.
- Company and candidate dashboards must adapt their layouts based on screen width.
- Tables should become horizontally scrollable or transform into responsive cards on mobile rather
  than breaking the layout.
- Navigation should collapse into a mobile menu on smaller screens.
- Forms should use single-column layouts on mobile and multi-column layouts where appropriate on
  larger screens.
- Buttons and interactive elements must have touch-friendly sizing.
- Avoid horizontal page overflow.
- Text, spacing, images, and cards should scale appropriately across screen sizes.
- Test the UI at minimum around **320px, 375px, 768px, 1024px, and 1440px** widths.
- Do not create a separate mobile application; use the same React application with responsive
  Tailwind CSS.

The final application should provide a consistent, polished experience across mobile, tablet, laptop,
and desktop. Apply this to all new UI work and revisit existing pages/components when touching them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
