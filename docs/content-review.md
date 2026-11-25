# Content review

This tracks how far the tool's reference content (`js/data.js`) has been checked against primary sources.

Last updated: 25 November 2026

## Sources

| Source | Version | Checked? |
|---|---|---|
| Online Safety Act 2023, Schedules 5, 6 and 7 (legislation.gov.uk, as amended) | Retrieved 25 November 2026 (database updated 24 November 2026) | **Yes** |
| Ofcom, Risk Assessment Guidance and Risk Profiles | v2.0, 25 June 2026 | **No**: Ofcom's website blocks automated downloads |
| Ofcom, Illegal Content Codes of Practice for user-to-user services | September 2026 | **No**: as above |
| Ofcom, Illegal Content Codes of Practice for search services | Latest | **No**: as above |

## Changes made from the Act

1. **Added "Encouraging or assisting serious self-harm" as a priority harm.** It has been a priority offence since 8 January 2026 (Schedule 7, paragraph 2A, inserted by S.I. 2025/1352). Ofcom's v2.0 guidance is reported to list 18 kinds of priority illegal content, which fits this addition. The tool previously treated it as non-priority "other illegal content".
2. **Moved cyberflashing out of "other illegal content".** Sending a photograph or film of genitals (Sexual Offences Act 2003, s.66A) is a priority offence under Schedule 7, paragraph 28A ("Sexual images"). It is now described under intimate image abuse, which shares that paragraph. *Check which kind of harm Ofcom assesses it under.*
3. **Intimate image abuse** now covers creating or requesting fake intimate images of adults (s.66E and s.66F), which are also listed in paragraph 28A.
4. **Extreme pornography** now covers pornography showing strangulation or suffocation, sex between relatives, or sexual activity with a child under 16 (Criminal Justice and Immigration Act 2008, s.67A, s.67E and s.67H, Schedule 7 paragraph 29).
5. **"Other illegal content"** examples are now epilepsy trolling, false communications and threatening communications.
6. The home page and README no longer hard-code "17 kinds".

## Still to check against Ofcom's documents

These are my own summaries and have **not** been verified.

### Risk Assessment Guidance and Risk Profiles (v2.0)
- [ ] The exact names and order of the 18 kinds of priority illegal content, and whether CSEA is still assessed as grooming, image-based CSAM and CSAM URLs.
- [ ] Which kind of harm cyberflashing and fake intimate images sit under.
- [ ] **Every risk factor and the harms it is linked to** (U2U and search Risk Profiles). This is the biggest unchecked area. The links for *serious self-harm* are copied from *suicide* and are marked provisional in the code.
- [ ] Whether Ofcom separates general risk factors (for example user base and business model) from specific ones, and whether the tool should show that.
- [ ] The core and enhanced evidence inputs, and when enhanced inputs are expected.
- [ ] Risk levels and how likelihood and impact combine. The tool's 3×3 matrix is its own suggestion, not Ofcom's.
- [ ] Review triggers and record-keeping requirements.

### Codes of Practice (U2U and search)
- [ ] The definitions of "large" (currently more than 7 million monthly UK users) and "multi-risk" (currently medium or high for 2 or more kinds).
- [ ] The full list of measures with their codes (ICU A1, ICU C1 and so on), so each measure in the tool can show its reference.
- [ ] The conditions for each measure: the `when` rules in `js/data.js` are approximations. Look especially at measures with user-number or functionality conditions (for example hash matching, comment controls and recommender testing).
- [ ] Measures added since the first Codes, such as hash matching for intimate image abuse and any livestreaming, proactive technology or crisis response measures.
- [ ] Search measures (ICS codes) and their conditions.

## How to finish the check

Download these PDFs from Ofcom's website and add them to `docs/sources/` on the branch (or attach them to the conversation):

1. Risk Assessment Guidance and Risk Profiles, v2.0 (June 2026)
2. Illegal Content Codes of Practice for user-to-user services (September 2026)
3. Illegal Content Codes of Practice for search services (latest)
4. Optionally, the "Summary of our decisions" table, which shows which measures apply to which services

Each item above can then be checked line by line and updated in `js/data.js`.
