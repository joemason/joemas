# Content review

This records how the tool's reference content (`js/data.js`) was checked against primary sources.

Last checked: 25 November 2026

## Sources

| Source | Version | Checked? |
|---|---|---|
| Ofcom, Risk Assessment Guidance and Risk Profiles [RAG] | v2.0, 25 June 2026 | **Yes** |
| Ofcom, Illegal content Codes of Practice for user-to-user services [ICU] | Amendments issued 12 October 2026, in force 2 November 2026 | **Yes** |
| Ofcom, Illegal content Codes of Practice for search services [ICS] | Amendments issued 9 September 2026 | **Yes** |
| Ofcom, Record-Keeping and Review Guidance [RKR] | v3.0, 25 June 2026 | **Yes** |
| Ofcom, Register of Risks | Supplied, 473 pages | Not used directly: the tool points users to it |
| Online Safety Act 2023, Schedules 5 to 7 (legislation.gov.uk, as amended) | Retrieved 25 November 2026 | **Yes** |

## What changed

### Kinds of illegal harm (RAG Table 1)
- There are **18 kinds** of priority illegal content. The tool now lists them as Ofcom does:
  - **Encouraging or assisting suicide and serious self-harm** is one kind. My earlier change had split self-harm out as a separate kind, which was wrong.
  - **Cyberflashing** is its own kind (18). My earlier change had put it under intimate image abuse, which was also wrong.
- CSEA is still assessed in three parts for U2U services: grooming, CSAM imagery and CSAM URLs (RAG 3.4, 3.7).

### Risk factors (RAG Figure 1, Table 9, Table 9.1)
- The U2U risk factors are now exactly Ofcom's questions 1a to 8, with Ofcom's numbering shown.
- **Removed factors that aren't in the Risk Profile:** video-sharing service, vulnerable users, large user base, verified badges, ephemeral messaging (now part of 5b), voice calls, generative AI, file storage as a feature, payments, advertising revenue and creator payouts.
- **The links between factors and harms are transcribed from Table 9.1** and stored harm by harm (`profileLinks`), so each row can be checked against the table. "3a" covers both user profiles and fake user profiles, and "4b" covers both user groups and group messaging. Question 8 is split into content and network recommender systems, as in Table 9.
- **Added the three general risk factors** every service must consider (user base demographics, business model and commercial profile), with free-text answers.
- **Search Risk Profile** (Table 9.2): general search, vertical search, child users, predictive search and image/reverse image search. Ofcom doesn't link search risk factors to particular harms, and the tool now says so.

### Evidence inputs (RAG Tables 10 and 12)
- The core and enhanced inputs now use Ofcom's names. The tool says large services are generally expected to use enhanced inputs (RAG 2.16).

### Risk levels (RAG Section 3, Tables 13 to 13.3)
- **Removed the tool's own 3×3 matrix.** Ofcom says the tables inform judgement rather than being applied mechanically, and that providers should choose the higher level when evidence is inconclusive (RAG 3.3, 3.6). The tool now suggests the higher of likelihood and impact.
- The descriptions for likelihood and impact are condensed from the General Risk Level Table, including the 700,000 and 7 million user reference points.
- **Added the CSEA Risk Level Tables** (image-based CSAM, CSAM URLs and grooming). The tool asks the questions those tables need and shows the level each table indicates. The suggested level is raised to match where the table is higher.
- "Negligible" now uses Ofcom's test: not possible, or extremely unlikely.

### Codes measures (ICU and ICS)
- **Replaced the measure list** with every measure in both Codes indexes, using official codes (ICU A1 to J3, ICS A1 to G3) and names.
- **Each measure's conditions follow its "Application" paragraph**, including the 700,000 user thresholds (ICU C9, C10, C14), the specific harms for C15, C16, E1, J1 and J2, and functionality conditions (F1, F2, J1, J2, J3).
- **Multi-risk** is now medium or high for 2+ kinds in the Codes' Table C, with CSEA counted once (ICU 5.6). **Cyberflashing doesn't count**, because it isn't in Table C.
- **Large** is more than 7 million monthly active UK users, averaged over six months (ICU 5.7 to 5.10). **Large general search service** applies to search.
- Added the questions some measures depend on: whether you can determine users' ages, test recommender systems on the platform, or label profiles under notable user or monetised schemes. Also added categorised service status (ICU G2, ICS G2).

### Record and review (RKR 3.6, 3.7; RAG 2.45)
- The record now includes the named person responsible, the completion date, confirmation that the Risk Profiles were consulted, the general risk factors, the CSEA sub-levels, confirmation of reporting through governance, and the policy for keeping the assessment up to date.
- Review triggers now reflect the duty to carry out a new assessment **before** a significant change, and Ofcom's recommendation to review **at least every 12 months**.

## Judgement calls (worth a second opinion)

1. **"Several" and "a lot" in the CSEA tables.** Ofcom deliberately doesn't give numbers. The tool treats 2 or more as "several" and, where the table has a "lot" condition, 5 of 9 (CSAM imagery) or 4 of 6 (grooming) as "a lot". It always shows the count and Ofcom's caveat.
2. **When users can "share text or hyperlinks"** (CSAM URLs table). The tool infers this from the service type and communication factors, or from the "without an account" question.
3. **Suicide in the Codes.** Codes Table C row 3 and measures J1 and J2 refer to "encouraging or assisting suicide (or attempted suicide)", while the guidance combines it with serious self-harm. The tool treats the combined kind as that row.
4. **ICU J1 "posting content functionality".** The tool treats social media, forums, connections, image posting, direct messaging and commenting as meeting the condition.
5. **Large services in search.** ICS A4 refers to "large services that are multi-risk". The tool uses the 7 million threshold for any search service.

## Not covered

- Children's access assessments and children's risk assessments.
- The illustrative examples in RAG Appendix B, and the significant change scenarios in RAG Table 14 (the tool only links to the duty).
- Category 1 and 2A extra duties, beyond flagging ICU G2 and ICS G2.

## Earlier saves

Assessments saved before this update are migrated automatically: old risk factor IDs map to Ofcom's numbering, and any separate self-harm entry merges into suicide and self-harm. Measure statuses recorded against the old measure list can't be carried over and need recording again.
