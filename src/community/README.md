# Learn Quran Community (`/community`)

A front-end-only community section: circles, members, stories, gatherings, resources,
guidelines and an application form. There is no backend. Everything in this folder is
self-contained so that it can later move to its own subdomain.

| Route | Screen |
| --- | --- |
| `/community` | Home: why a community, what is inside, the circles, how to join |
| `/community/circles` | The ten circles and how a circle works |
| `/community/members` | Member directory with filters |
| `/community/stories` | Member stories |
| `/community/gatherings` | Session formats, the weekly session, city meetups, questions |
| `/community/resources` | Links to the Learn Quran tools, grouped by purpose |
| `/community/guidelines` | Community guidelines |
| `/community/join` | Application form |

Dark mode follows the site theme (`html.dark`).

## Where things are

```
src/community/              the module: move this folder as it is
  config.ts                 base path, main-site URL, WhatsApp number, PREVIEW switch, social links
  community.module.css      all styles and design tokens (light and dark)
  components/               Shell (header, menu, footer), one component per page, shared ui
  data/                     all copy and content: circles, people, gatherings, resources, guidelines
  lib/applications.ts       the application form's storage and delivery

src/app/community/          the routes: thin wrappers that set metadata and render a page component
  layout.tsx                loads the fonts and wraps every page in Shell
  host.css                  removes the main site's padding around the community pages
```

To change any text, edit the files in `data/`. Page headings and section intros are in the page
components.

## What is real and what is an example

* The members and stories in `data/people.ts` are examples. Each one has `example: true`, shows an
  "Example" tag, and the pages carry a note saying so. This is controlled by `PREVIEW` in
  `config.ts`. Set it to `false` once real members exist. Replace the entries with real ones and
  remove `example: true` from them.
* Numbers on the home page (10 circles, 5 formats) are counted from the data files. No member
  counts or statistics are invented.
* The hadith on the home page (Sahih al-Bukhari 5027) and the ayah on the guidelines page
  (Quran 5:2, Saheeh International) are the only religious texts. Do not add any without a
  verified source.
* `data/resources.ts` links only to pages that exist on the main site.

## Applications without a backend

The join form validates the answers, saves them in the visitor's browser
(`localStorage`, key `lq-community:application:v1`) and opens WhatsApp with the application
written out as a message to `WHATSAPP_NUMBER` in `config.ts`. Nothing is sent until the applicant
presses send in WhatsApp. A returning applicant sees what they sent and can edit or remove it.

To connect a backend, implement the `ApplicationRepository` interface in `lib/applications.ts`
(`load`, `save`, `clear`) against your API and export it as `applications`. The form and the
members page use only that interface. If applications should no longer go through WhatsApp,
replace the `window.open(whatsappUrl(...))` call in `components/JoinPage.tsx`.

## Moving to a subdomain

1. Create a Next.js app for `community.learnquran.app` and copy `src/community/` into it.
2. Copy the route files from `src/app/community/` to the root of the new app's `app/` folder
   (`app/page.tsx`, `app/circles/page.tsx`, and so on). Merge `layout.tsx` into the new root
   layout: keep the font variables and `<Shell>`. `host.css` is not needed there.
3. Copy the font export `manropeCommunity` (`--cm-font`) from `src/fonts/manrope.ts`, with its
   font files. Headlines and body both use it.
4. Set the environment variables:

   ```
   NEXT_PUBLIC_COMMUNITY_BASE=""
   NEXT_PUBLIC_MAIN_SITE="https://learnquran.app"
   ```

   Every link goes through `to()` (community pages) or `site()` (main-site pages) in `config.ts`,
   so no component needs editing.
5. Dark mode expects a `dark` class on `<html>`. Keep the main site's theme script or add your own.
6. On the main site, redirect `/community/*` to the subdomain and remove the pieces listed below.

## What the main site does for this section

These exist only because the community is mounted inside the main site. Remove them after the move.

* `Navbar.tsx`, `Footer.tsx` and `GlobalSidebar.tsx` return nothing on paths that start with
  `/community`, because the community has its own header and footer.
* `src/app/community/host.css` removes the app shell's top padding and the padding on `main`.
* `src/app/sitemap.ts` lists the community routes.

## Notes for styling

* All class names are in `community.module.css` under `.root`, which also holds the design tokens.
  The dark values are under `:global(html.dark) .root`.
* The main site has global rules for `a:hover`, `input`, `textarea` and `:focus-visible`. Link and
  field classes in this module set those states themselves, so a new link class needs its own
  `:hover` colour.
* The main site sets `overflow-x: hidden` on `html` and `body`, which disables `position: sticky`.
  The header is therefore `position: fixed`. The guidelines contents list and the join page's side
  panel are written as sticky and will stick once the module runs on its own site.
