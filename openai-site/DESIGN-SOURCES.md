# RoleRadar design sources

Interface updated on 2 November 2026. One base design system: **shadcn/ui, Radix Maia**. The landing page uses Magic UI’s MIT Bento Grid extension through the shadcn registry, reusing the same Button and theme tokens. The user explicitly chose a purple bento landing page and a clean light workspace, replacing the earlier dark-workspace direction. No paid template, bespoke visual stylesheet or emoji icons. Mail, Resizable and Magic UI primary sources were checked on 2 November.

## Screen sources

| Screen | Official template / components |
| --- | --- |
| Public landing page | [Magic UI Bento Grid demo](https://magicui.design/docs/components/bento-grid): BentoGrid, BentoCard; existing shadcn Button, Badge and Card for navigation, actions and preview content |
| Login, signup, recovery | [login-03](https://ui.shadcn.com/blocks/authentication#login-03): Card, Field, FieldGroup, Input, Button; Alert for privacy/errors |
| Workspace shell/navigation | [sidebar-07](https://ui.shadcn.com/blocks/sidebar#sidebar-07): SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarMenu, Breadcrumb, Separator |
| Opportunity browser | [Official Mail example](https://v3.shadcn.com/examples/mail), adapted from its list/detail desktop layout: ResizablePanelGroup, ResizablePanel, ResizableHandle, Input, Select, Tabs, ScrollArea, Button, Badge |
| Role list and hypothetical skill preview | MailList row structure, Badge and Button; Select for the hypothetical skill |
| Result-source details | Badge and text keep source credit, remote-only scope and eligibility reminder visible; Collapsible holds “About these results” details |
| Selected role, evidence and AI review | MailDisplay header/content structure, [Tabs](https://ui.shadcn.com/docs/components/tabs), ScrollArea, Textarea, Alert; [Dialog](https://ui.shadcn.com/docs/components/dialog) for the full review and narrow-screen interactions |
| Saved roles and notes | Card, Select, Dialog, Textarea, Button |
| Search/AI history | [Table](https://ui.shadcn.com/docs/components/table), Tabs, Button |
| Profile, settings, download | Card, Input, Label, [Switch](https://ui.shadcn.com/docs/components/switch), Button |
| Account deletion | [AlertDialog](https://ui.shadcn.com/docs/components/alert-dialog), Input, Button |
| How it works and credits | Card, Separator, Button |

The block structures are retained. Application changes implement navigation, data, forms and states. Files in `src/components/ui/` were regenerated from the official Maia registry; Lucide remains the sole icon library.

## Landing page provenance

The public root shows a purple bento landing page. Explore opportunities enters the guest browser; Sign in opens the light login-03 form. The navbar’s How it works link anchors to the bento section. A signed-in user’s private workspace remains separate from the public preview.

The four-tile composition comes from the actual free [Magic UI Bento Grid demo](https://magicui.design/docs/components/bento-grid), not a newly invented card arrangement. Its three-column grid, 22rem rows, gap-4 spacing, full-width mobile cards and desktop spans **1, 2, 2, 1** are retained. The copied source is in `src/components/magicui/bento-grid.tsx`; application content is in `src/components/landing-page.jsx`.

- [BentoGrid/BentoCard source](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/bento-grid.tsx)
- [Original four-tile demo](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/example/bento-demo.tsx)
- [Magic UI MIT license](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md)

Adaptations replace the original file/calendar/notification demo content with existing RoleRadar capabilities and source-backed previews. The component retains upstream geometry and hover behavior, with Lucide ArrowRight replacing its Radix icon, theme colors, keyboard-focus visibility and application navigation callbacks. It still reuses the project’s shadcn Button and utility layer; no second base control system is introduced.

The landing preview requests public source data with the fixed example skills **Python, SQL, Git**. It never reads or sends a visitor’s private profile. If public data is unavailable, the displayed fictional examples are explicitly labeled; they do not become real openings. Guest workspace entry retrieves the first source page, normally 20 rows, with cache/source state shown. No live count, hiring outcome, testimonial, integration or AI action is invented for the landing page.

Magic UI’s current repository shows 2026 maintenance, checked as a dated observation rather than a future support promise. Only its free public Bento component/demo is used; its Pro landing templates are not included.

## Mail template provenance

The job browser starts from the official, author-attributed [shadcn Mail example](https://v3.shadcn.com/examples/mail), rather than a new bespoke visual layout. It keeps the searchable list beside the selected item's details. Mail records and mail-only actions become opportunity records and the app's existing job actions. Current Maia components provide the controls.

The historical source is pinned to **84bd724d97005f98b54d064aed5883b79aac1fd3**, the repository state immediately before the old website was deprecated:

- [Mail layout source](https://github.com/shadcn-ui/ui/blob/84bd724d97005f98b54d064aed5883b79aac1fd3/apps/www/app/%28app%29/examples/mail/components/mail.tsx)
- [MailList source](https://github.com/shadcn-ui/ui/blob/84bd724d97005f98b54d064aed5883b79aac1fd3/apps/www/app/%28app%29/examples/mail/components/mail-list.tsx)
- [MailDisplay source](https://github.com/shadcn-ui/ui/blob/84bd724d97005f98b54d064aed5883b79aac1fd3/apps/www/app/%28app%29/examples/mail/components/mail-display.tsx)
- [Template's pinned MIT license](https://github.com/shadcn-ui/ui/blob/84bd724d97005f98b54d064aed5883b79aac1fd3/LICENSE.md)

**Maintenance distinction:** Mail is an archived v3 example, not a claim of an actively maintained app template. The application uses the current shadcn component registry and current [Resizable documentation](https://ui.shadcn.com/docs/components/radix/resizable) for its primitives. The live repository's main branch no longer contains the old Mail paths; do not replace the pinned URLs with nonexistent main-branch links.

Adaptations include application data and state, job-specific buttons, source and eligibility disclosures, responsive use of existing library components, and the current panel API. Existing React state replaces Mail's Jotai example state; native date formatting replaces its date-fns formatting. Mail-only reply, snooze and message-delivery controls are omitted. No fake inbox counts, employer logos, student testimonials or application outcomes are carried over.

Guest storage remains tab-only, and fictional demonstration roles stay clearly labeled. Source credit, remote-only coverage and eligibility limits remain visible; longer retrieval details are available without dominating the browser.

## Installation and reproduction

For the delivered project, run **`npm ci`**. The lockfile records the versions. Do not regenerate over the supplied application.

For a fresh equivalent Vite project, follow the official [Vite setup](https://ui.shadcn.com/docs/installation/vite), including the Tailwind plugin and `@/*` alias. This theme was generated with:

```powershell
npx --yes shadcn@4.23.0 init --base radix --preset maia --no-monorepo --no-reinstall --force --yes
```

Set `components.json` to `"iconLibrary": "lucide"` and Tailwind `"baseColor": "stone"` before adding components:

```powershell
npx --yes shadcn@4.23.0 add login-03 sidebar-07 --yes
npx --yes shadcn@4.23.0 add resizable --yes
npx --yes shadcn@4.23.0 add @magicui/bento-grid
npx --yes shadcn@4.23.0 add card tabs textarea table alert badge switch select scroll-area button input label separator tooltip skeleton breadcrumb collapsible dropdown-menu avatar dialog alert-dialog sheet field sidebar --yes --overwrite
npm install lucide-react@1.66.0 @fontsource-variable/figtree@5.3.0 @fontsource-variable/space-grotesk@5.3.0
```

The original block generation preceded the Maia refresh; their form/sidebar structures remain. The Magic UI command above installs the public registry component for a fresh project. The delivered adaptation is already copied locally; do not run a generator over its navigation/focus changes. The Mail template is adapted separately from its pinned source; it is not a registry block named mail. The current Resizable generator adds react-resizable-panels. Use its current orientation API and percentage size strings, rather than blindly copying the archived panel API. Adapt text, data and actions afterward. The CLI can install default icon/font packages: remove unused Hugeicons/default fonts, retaining only the pair above. This project already does so.

## Theme, fonts and licenses

- **Purple landing, light workspace:** the landing scopes dark Zinc/violet tokens to its own container. Login, signup, account screens and the Mail workspace use light Slate/white surfaces with the same violet accent. Colors use the existing [theme token mechanism](https://ui.shadcn.com/docs/theming); the recorded Stone generator base does not override these application tokens. Status remains written in text, not color alone.
- **Figtree** interface text and **Space Grotesk** headings, both Google Fonts families bundled locally through Fontsource. No requests to Google's font servers.
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) SVG icons. No extra animation dependency.
- shadcn/ui and its Mail template MIT; Magic UI Bento Grid/demo MIT; react-resizable-panels MIT; Lucide ISC; both fonts SIL OFL 1.1. Retain the full notices in `docs/licenses/` when distributing. No visible credit badge is required by these libraries. Himalayas separately requires visible source credit and original application links.

Maia is documented in the [official design-system guide](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/design-system.md). Maintenance/free availability were checked through the official [changelog](https://ui.shadcn.com/docs/changelog), [blocks](https://ui.shadcn.com/blocks) and repository activity. This dated check is not a future support promise.

The unmodified shadcn 4.23.0 stylesheet is vendored at `src/vendor/shadcn-4.23.0.css`, SHA256 `4c371f7a1ff5d219ae2f7ff28bd256b4346fd546fe46fbae22092e57db2f0fae`. The unused generator CLI is removed from dependencies; its MIT license is retained. See `THIRD-PARTY-NOTICES.md` and `docs/JOB-SOURCES.md`.
