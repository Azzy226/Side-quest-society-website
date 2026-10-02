# Side Quest Society website

Owner: Trey Smith. All content lives in `content/*.json` and is edited at `/admin` (Decap CMS).
Sections with no content hide themselves, so a blank site stays clean.

## One-time setup (developer)
1. Push this folder to a GitHub repo and deploy it on Netlify (or Cloudflare Pages / GitHub Pages).
2. In `admin/config.yml` replace the CHANGE-ME values (repo, site URL).
3. Enable GitHub login for the CMS: on Netlify, Site settings > Access control > OAuth > GitHub. Elsewhere, run an OAuth proxy and set `base_url`.
4. Give Trey's GitHub account write access to the repo.
5. Optional: create free Formspree forms and paste their URLs into the email signup / contact form fields.

## Trey's routine
Go to `yourwebsite.com/admin`, log in, edit, click Publish. The site updates in about a minute.

## Local preview
`npx serve .` for the site; `npx decap-server` alongside it for `/admin/`.
[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/azzy226/side-quest-society-website?utm_source=readme&utm_medium=badge)
