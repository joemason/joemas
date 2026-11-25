# Online Safety Risk Assessment

A free, browser-based tool that helps organisations complete their **illegal content risk assessment** under the UK Online Safety Act 2023, following Ofcom's four-step method.

## What it does

1. **Your service**: who you are, the service type (user-to-user and/or search), UK user numbers and whether children use it.
2. **Risk factors**: Ofcom's U2U and Search Risk Profile questions (1a to 8), the three general risk factors, and the questions Ofcom's CSEA risk level tables need.
3. **Assess the risks**: for each kind of priority illegal harm (CSEA split into grooming, image-based CSAM and CSAM URLs) plus other illegal content, record likelihood, impact, evidence, existing controls and reasoning. The tool shows which of Ofcom's linked risk factors apply, what the CSEA risk level tables indicate, and suggests the higher of likelihood and impact, as Ofcom advises. The level can be overridden.
4. **Safety measures**: works out whether the service is *large* (more than 7m monthly UK users) and *multi-risk* (medium or high for 2+ harms), then shows which Codes of Practice measures (ICU and ICS codes) apply, using each measure's application conditions. Record status, owner and target date, or add your own measures.
5. **Record and review**: sign-off, next review date and review triggers.
6. **Report**: a printable written record (print or save as PDF).

Data is stored only in the browser (`localStorage`). Assessments can be exported and imported as JSON files.

## Running it

There's no build step. Serve the folder with any static web server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. It can be hosted on any static host (Cloudflare Pages, GitHub Pages, Netlify).

## Project layout

- `index.html`: page shell
- `css/styles.css`: styles, including dark mode and print styles
- `js/data.js`: reference content: harms, risk factors, evidence inputs and measures, with the rules for when each measure is recommended
- `js/app.js`: routing, state, views and the report

## Sources

The content follows Ofcom's Risk Assessment Guidance and Risk Profiles v2.0, the Illegal content Codes of Practice for user-to-user and search services (autumn 2026) and the Record-Keeping and Review Guidance v3.0. See `docs/content-review.md` for what was checked and the judgement calls made.

## Important

This tool gives guidance, not legal advice, and is not made or endorsed by Ofcom. Ofcom updates its documents, so check `docs/content-review.md` for the versions this tool follows.
