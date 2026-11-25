/*
 * Reference content for the illegal content risk assessment.
 *
 * Sources (checked 25 November 2026; see docs/content-review.md):
 *  [RAG]  Ofcom, Risk Assessment Guidance and Risk Profiles, v2.0 (25 June 2026)
 *  [ICU]  Ofcom, Illegal content Codes of Practice for user-to-user services
 *         (amendments issued 12 October 2026, in force 2 November 2026)
 *  [ICS]  Ofcom, Illegal content Codes of Practice for search services
 *         (amendments issued 9 September 2026)
 *  [RKR]  Ofcom, Record-Keeping and Review Guidance, v3.0 (25 June 2026)
 *  Online Safety Act 2023, Schedules 5 to 7 (legislation.gov.uk, as amended)
 *
 * The descriptions are plain-English summaries. The lists of harms, risk
 * factors, links between them, evidence inputs and measure conditions follow
 * the documents above.
 */
window.OSRA_DATA = (function () {
  const SOURCES = {
    rag: "Ofcom Risk Assessment Guidance and Risk Profiles v2.0 (25 June 2026)",
    icu: "Ofcom Illegal content Codes of Practice for user-to-user services (in force 2 November 2026)",
    ics: "Ofcom Illegal content Codes of Practice for search services (amendments issued 9 September 2026)",
    rkr: "Ofcom Record-Keeping and Review Guidance v3.0 (25 June 2026)",
  };

  // ----- The 18 kinds of priority illegal content [RAG Table 1], with CSEA
  // split into the three parts that U2U services assess separately
  // [RAG 3.4, 3.7], plus other illegal content.
  //   codes: false  -> not a kind of illegal harm in the Codes' Table C, so it
  //                    does not count towards "multi-risk" [ICU 5.6]
  //   csea: true    -> one of the CSEA parts; together they count as one kind
  const harms = [
    { id: "terrorism", name: "Terrorism", summary: "Content that encourages, glorifies or supports terrorism, invites support for proscribed organisations, or shares material useful for terrorist acts." },
    { id: "grooming", csea: true, name: "CSEA: grooming", summary: "Adults contacting, building relationships with or manipulating children for sexual purposes, including sexual communication with a child." },
    { id: "csam_image", csea: true, name: "CSEA: child sexual abuse material (imagery)", summary: "Indecent or prohibited images and videos of children, including pseudo-photographs, drawings and AI-generated images." },
    { id: "csam_url", csea: true, name: "CSEA: child sexual abuse material (URLs)", summary: "Links or text URLs to locations where child sexual abuse material is present, or to domains dedicated to it." },
    { id: "hate", name: "Hate", summary: "Content stirring up hatred on grounds of race, religion or sexual orientation, and racially or religiously aggravated public order offences and harassment." },
    { id: "harassment", name: "Harassment, stalking, threats and abuse", summary: "Harassment, stalking, threats to kill, and threatening or abusive behaviour." },
    { id: "coercive", name: "Controlling or coercive behaviour", summary: "Repeated or continuous controlling or coercive behaviour towards a partner or family member, carried out or facilitated online." },
    { id: "iia", name: "Intimate image abuse", summary: "Sharing, or threatening to share, intimate images or videos without consent, including fake (for example AI-generated) intimate images." },
    { id: "extreme_porn", name: "Extreme pornography", summary: "Extreme pornographic images, including pornography showing strangulation or suffocation." },
    { id: "sexual_exploitation", name: "Sexual exploitation of adults", summary: "Causing, inciting or controlling prostitution for gain, and paying for the sexual services of a person subjected to force." },
    { id: "trafficking", name: "Human trafficking", summary: "Arranging or facilitating the travel of a person for exploitation, including recruiting victims and advertising." },
    { id: "immigration", name: "Unlawful immigration", summary: "Assisting unlawful immigration, for example advertising illegal crossings or false documents." },
    { id: "fraud", name: "Fraud and financial offences", summary: "Fraud by false representation, articles for use in fraud, investment and romance scams, and financial services offences." },
    { id: "proceeds", name: "Proceeds of crime", summary: "Money laundering and dealing in criminal property, including recruiting 'money mules'." },
    { id: "drugs", name: "Drugs and psychoactive substances", summary: "Supplying, or offering to supply, controlled drugs and psychoactive substances." },
    { id: "weapons", name: "Firearms, knives and other weapons", summary: "Selling or offering prohibited firearms, ammunition, knives and other offensive weapons." },
    { id: "suicide", name: "Encouraging or assisting suicide and serious self-harm", summary: "Content that encourages or assists suicide, attempted suicide or serious self-harm, for example by sharing methods." },
    { id: "foreign_interference", name: "Foreign interference", summary: "Disinformation and other conduct on behalf of a foreign power intended to interfere with UK political, legal or democratic processes." },
    { id: "animal_cruelty", name: "Animal cruelty", summary: "Content that causes, encourages or assists unnecessary suffering of animals." },
    { id: "cyberflashing", codes: false, name: "Cyberflashing", summary: "Sending an unsolicited photograph or film of genitals to cause alarm, distress or humiliation, or for sexual gratification." },
    { id: "other", codes: false, other: true, name: "Other illegal content (including non-priority offences)", summary: "Other kinds of illegal content you have evidence or reason to believe may occur on your service, for example false communications, threatening communications or epilepsy trolling. Assess any that are relevant." },
  ];

  // ----- U2U Risk Profile specific risk factors [RAG Figure 1 and Table 9].
  // Ofcom's question numbers are kept as `ref`.
  const factorGroups = [
    {
      id: "type", name: "Service type", hint: "Tick every type that describes your service.", services: ["u2u"],
      factors: [
        { id: "1a", ref: "1a", name: "Social media service", hint: "Connects users and lets them build communities around common interests or connections." },
        { id: "1b", ref: "1b", name: "Messaging service", hint: "Centred on sending messages that only a specific recipient or group can read." },
        { id: "1c", ref: "1c", name: "Gaming service", hint: "Users interact in partially or fully simulated virtual environments." },
        { id: "1d", ref: "1d", name: "Adult service", hint: "Mainly used to share user-generated adult content." },
        { id: "1e", ref: "1e", name: "Discussion forum or chat room", hint: "Users post messages that the public or an open group can read." },
        { id: "1f", ref: "1f", name: "Marketplace or listing service", hint: "Users buy and sell goods or services." },
        { id: "1g", ref: "1g", name: "File-storage or file-sharing service", hint: "Mainly lets users store content and share access to it through links." },
      ],
    },
    {
      id: "users", name: "User base", services: ["u2u", "search"],
      factors: [{ id: "2", ref: "2", name: "Child users (under 18) access some or all of the service", hint: "For grooming, consider children anywhere in the world, not only in the UK." }],
    },
    {
      id: "identity", name: "How users identify themselves", services: ["u2u"],
      factors: [
        { id: "3a", ref: "3a", name: "Users can display identifying information in a profile others can see", hint: "For example images, usernames or age. Ofcom links this to the risks of both user profiles and fake profiles." },
        { id: "3b", ref: "3b", name: "Users can share content anonymously", hint: "For example anonymous profiles, or access without an account." },
      ],
    },
    {
      id: "networking", name: "How users network", services: ["u2u"],
      factors: [
        { id: "4a", ref: "4a", name: "Users can connect with other users", hint: "For example friending or following." },
        { id: "4b", ref: "4b", name: "Users can form closed groups or send group messages" },
      ],
    },
    {
      id: "communication", name: "How users communicate", services: ["u2u"],
      factors: [
        { id: "5a", ref: "5a", name: "Livestreaming", hint: "Open or closed channels." },
        { id: "5b", ref: "5b", name: "Direct messaging", hint: "Including ephemeral (disappearing) direct messages." },
        { id: "5c", ref: "5c", name: "Encrypted messaging" },
        { id: "5d", ref: "5d", name: "Commenting on content" },
        { id: "5e", ref: "5e", name: "Posting or sending images or videos", hint: "Open or closed channels." },
        { id: "5f", ref: "5f", name: "Posting or sending location information" },
        { id: "5g", ref: "5g", name: "Re-posting or forwarding content" },
      ],
    },
    {
      id: "transactions", name: "Transactions", services: ["u2u"],
      factors: [{ id: "6", ref: "6", name: "Users can post goods or services for sale" }],
    },
    {
      id: "exploring", name: "Finding content", services: ["u2u"],
      factors: [
        { id: "7a", ref: "7a", name: "Users can search for user-generated content" },
        { id: "7b", ref: "7b", name: "Hyperlinking", hint: "Users can post links, including plain-text URLs." },
      ],
    },
    {
      id: "recommender", name: "Recommender systems", services: ["u2u"],
      factors: [
        { id: "8c", ref: "8", name: "Content recommender system", hint: "Algorithms rank or suggest content to users." },
        { id: "8n", ref: "8", name: "Network recommender system", hint: "Algorithms suggest users or groups to connect with." },
      ],
    },
    // Search Risk Profile [RAG Figure 2 and Table 9.2]. Ofcom does not link
    // search risk factors to specific harms; use the Register of Risks.
    {
      id: "search_type", name: "Search service type", services: ["search"],
      factors: [
        { id: "s1a", ref: "1a", name: "General search service (including downstream general search)", hint: "Gives access to webpages from across the web." },
        { id: "s1b", ref: "1b", name: "Vertical search service", hint: "Searches specific topics, products or services from pre-arranged websites or databases. May be less likely to present illegal content." },
      ],
    },
    {
      id: "search_func", name: "Search functionalities", services: ["search"],
      factors: [
        { id: "s3a", ref: "3a", name: "Search predictions or suggestions", hint: "Ofcom's evidence links these to suicide and self-harm methods, hateful queries and fraud." },
        { id: "s3b", ref: "3b", name: "Image or video search, or reverse image search", hint: "Ofcom's evidence links these to finding CSAM, illegal drugs and non-consensual intimate images." },
      ],
    },
  ];

  // ----- Which specific risk factors Ofcom links to each kind of harm,
  // transcribed from [RAG Table 9.1]. "3a" covers both user profiles and
  // fake user profiles; "4b" covers both user groups and group messaging.
  const CSAM_BOTH = ["1a", "1b", "1e", "2", "3b", "4b", "5b", "5c"]; // row 2B
  const profileLinks = {
    terrorism: ["1a", "1b", "1c", "1e", "1f", "1g", "3b", "4a", "4b", "5a", "5b", "5c", "5d", "5e", "7a", "7b", "8c", "8n"],
    grooming: ["1a", "1b", "1c", "1e", "2", "3a", "4a", "4b", "5a", "5b", "5c", "5d", "5f", "8n"],
    csam_image: CSAM_BOTH.concat(["1d", "1g", "5a", "5e"]), // rows 2B + 2B(i)
    csam_url: CSAM_BOTH.concat(["7b"]), // rows 2B + 2B(ii)
    suicide: ["1a", "1b", "1e", "3b", "4b", "5a", "5b", "5d", "5e", "5g", "7b", "8c"],
    hate: ["1a", "1b", "1c", "3a", "3b", "4b", "5a", "5b", "5d", "5e", "8c"],
    harassment: ["1a", "1b", "1c", "3a", "3b", "4a", "5a", "5b", "5d", "5e", "5f", "5g"],
    coercive: ["1a", "1b", "3a", "4a", "4b", "5b", "5e", "5f"],
    drugs: ["1a", "1b", "1f", "3a", "3b", "4a", "4b", "5b", "5c", "5e", "6", "7a", "7b", "8n"],
    weapons: ["1a", "1b", "1f", "1g", "3b", "5c", "6", "7a"],
    trafficking: ["1a", "1b", "1f", "3a", "4b", "5b", "5c", "5e", "5f", "6"],
    immigration: ["1a", "1b", "3a", "4b", "5b", "5c", "5e"],
    sexual_exploitation: ["1a", "1b", "1f", "3a", "5c", "6"],
    extreme_porn: ["1a", "1d", "5e", "7a"],
    iia: ["1a", "1d", "1e", "1g", "4b", "5b", "5e", "5g"],
    proceeds: ["1a", "1b", "3a", "5b", "7a"],
    fraud: ["1a", "1b", "1f", "3a", "4a", "4b", "5b", "5c", "5d", "6", "7a", "7b"],
    foreign_interference: ["1a", "1b", "1e", "3a", "3b", "4a", "4b", "5c", "5e", "5g", "7b", "8c"],
    animal_cruelty: ["1a", "1b", "4b", "5a", "5d", "5e"],
    cyberflashing: ["1a", "1b", "3a", "3b", "4a", "5b", "5e"],
  };
  // Attach the reverse mapping to each factor for display.
  factorGroups.forEach((g) =>
    g.factors.forEach((f) => {
      f.raises = Object.keys(profileLinks).filter((h) => profileLinks[h].includes(f.id));
    })
  );

  // ----- General risk factors that every service must consider [RAG Table 9/9.2].
  const generalFactors = [
    { id: "demographics", name: "User base demographics", hint: "Protected characteristics, media literacy, mental health and vulnerability. For example, women and girls are disproportionately affected by grooming, CSAM, harassment, controlling or coercive behaviour, cyberflashing and intimate image abuse." },
    { id: "business", name: "Business model (revenue model and growth strategy)", hint: "How designing for engagement or revenue could increase risk, and how features such as boosted posts, ad targeting or subscriptions could be misused." },
    { id: "commercial", name: "Commercial profile", hint: "Whether you are low-capacity, early-stage or fast-growing, which can limit how well you manage risk." },
  ];

  // ----- Extra questions needed for the CSEA Risk Level Tables [RAG Tables
  // 13.1 to 13.3] and for the conditions of some Codes measures.
  const questions = [
    { id: "q_images_noaccount", services: ["u2u"], label: "Users can share images or videos without creating an account", why: "Image-based CSAM Risk Level Table" },
    { id: "q_text_noaccount", services: ["u2u"], label: "Users can share text or links without creating an account", why: "CSAM URLs Risk Level Table: normally high risk" },
    { id: "q_nep_children", services: ["u2u"], label: "Child users can appear in network expansion prompts (for example 'people you may know')", why: "Grooming Risk Level Table: normally high risk" },
    { id: "q_connection_lists", services: ["u2u"], label: "Child users can be seen in lists of other users' connections", why: "Grooming Risk Level Table: normally high risk" },
    { id: "q_profiles_reveal", services: ["u2u"], label: "User profiles or groups may let others work out that a user is likely to be a child", why: "Grooming Risk Level Table: normally high risk" },
    { id: "q_age_means", services: ["u2u"], label: "We have an existing way to determine the age or age range of a user", why: "Condition for Codes measures ICU F1 and F2" },
    { id: "q_rec_testing", services: ["u2u"], label: "We test changes to content recommender systems on the platform (for example A/B tests)", why: "Condition for Codes measure ICU E1" },
    { id: "q_notable", services: ["u2u"], label: "We label user profiles under a notable user scheme or a paid-for (monetised) scheme", why: "Condition for Codes measure ICU J3" },
  ];

  // ----- Evidence inputs [RAG Tables 10 and 12].
  const evidence = {
    core: [
      { id: "e_profile", name: "Risk Profile (and relevant parts of Ofcom's Register of Risks)" },
      { id: "e_complaints", name: "User complaints, including user reports" },
      { id: "e_userdata", name: "User data, including age where relevant" },
      { id: "e_incidents", name: "Retrospective analysis of incidents of harm" },
      { id: "e_other", name: "Other relevant information you hold (for example past risk assessments, product data)" },
    ],
    enhanced: [
      { id: "e_testing", name: "Results of product testing" },
      { id: "e_moderation", name: "Results of content moderation systems" },
      { id: "e_internal_experts", name: "Consultation with internal experts on risks and safety measures" },
      { id: "e_external_experts", name: "Views of independent experts" },
      { id: "e_research", name: "Internal and external commissioned research" },
      { id: "e_audit", name: "Outcomes of external audit or other risk assurance processes" },
      { id: "e_users", name: "Consultation with users and user research" },
      { id: "e_groups", name: "Engaging with relevant representative groups" },
    ],
  };

  // ----- Codes of Practice measures. `applies(c)` follows each measure's
  // "Application" paragraph; `rule` is Ofcom's wording, shown to users.
  // The context `c` is built in app.js.
  const TCHHF = ["terrorism", "hate", "harassment", "foreign_interference"];
  const u2u = [
    // A. Governance and accountability
    { code: "ICU A1", group: "Governance and accountability", name: "Annual review of risk management activities", rule: "Large services", applies: (c) => c.large },
    { code: "ICU A2", group: "Governance and accountability", name: "Individual accountable for illegal content safety duties and reporting and complaints duties", rule: "All services", applies: () => true },
    { code: "ICU A3", group: "Governance and accountability", name: "Written statements of responsibilities", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU A4", group: "Governance and accountability", name: "Internal monitoring and assurance", rule: "Large services that are multi-risk", applies: (c) => c.large && c.multi },
    { code: "ICU A5", group: "Governance and accountability", name: "Tracking evidence of new and increasing illegal harm", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU A6", group: "Governance and accountability", name: "Code of conduct regarding protection of users from illegal harm", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU A7", group: "Governance and accountability", name: "Compliance training", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    // C. Content moderation
    { code: "ICU C1", group: "Content moderation", name: "Content moderation function to review and assess suspected illegal content", rule: "All services", applies: () => true },
    { code: "ICU C2", group: "Content moderation", name: "Content moderation function that allows for the swift take down of illegal content", rule: "All services", applies: () => true },
    { code: "ICU C3", group: "Content moderation", name: "Setting internal content policies", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C4", group: "Content moderation", name: "Performance targets", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C5", group: "Content moderation", name: "Prioritisation", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C6", group: "Content moderation", name: "Resourcing", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C7", group: "Content moderation", name: "Training and materials for content moderators (non-volunteers)", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C8", group: "Content moderation", name: "Materials for volunteer moderators", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU C9", group: "Content moderation", name: "Using hash matching to detect and remove CSAM", rule: "Large services at medium or high risk of image-based CSAM; or services at high risk of image-based CSAM that have more than 700,000 monthly UK users or are file-storage and file-sharing services", applies: (c) => (c.large && c.medHigh("csam_image")) || (c.high("csam_image") && (c.over700k || c.f["1g"])) },
    { code: "ICU C10", group: "Content moderation", name: "Detecting and removing content matching listed CSAM URLs", rule: "Large services at medium or high risk of CSAM URLs; or services with more than 700,000 monthly UK users at high risk of CSAM URLs", applies: (c) => (c.large && c.medHigh("csam_url")) || (c.over700k && c.high("csam_url")) },
    { code: "ICU C14", group: "Content moderation", name: "Using hash matching to detect intimate image abuse content", rule: "Services where images or videos can be shared that are at high risk of intimate image abuse and are mainly for pornography, have more than 700,000 monthly UK users, or are file-storage and file-sharing services; or large services at medium or high risk of intimate image abuse", applies: (c) => (c.images && c.high("iia") && (c.f["1d"] || c.over700k || c.f["1g"])) || (c.large && c.medHigh("iia")) },
    { code: "ICU C15", group: "Content moderation", name: "Crisis response", rule: "Large services at medium risk of terrorism, hate, harassment or foreign interference; or services at high risk of any of these", applies: (c) => (c.large && c.medium(TCHHF)) || c.high(TCHHF) },
    { code: "ICU C16", group: "Content moderation", name: "Crisis response (dedicated channel for law enforcement)", rule: "Large services at medium or high risk of terrorism, hate, harassment or foreign interference", applies: (c) => c.large && c.medHigh(TCHHF) },
    // D. Reporting and complaints
    { code: "ICU D1", group: "Reporting and complaints", name: "Enabling complaints", rule: "All services", applies: () => true },
    { code: "ICU D2", group: "Reporting and complaints", name: "Easy to find, easy to access and easy to use complaints systems and processes", rule: "All services", applies: () => true },
    { code: "ICU D3", group: "Reporting and complaints", name: "Information before a complaint is submitted", rule: "Services likely to be accessed by children that are large or at medium or high risk of any kind of illegal harm", applies: (c) => c.likelyChildren && (c.large || c.anyMedHigh) },
    { code: "ICU D4", group: "Reporting and complaints", name: "Sending indicative timeframes", rule: "Services that are large or at medium or high risk of any kind of illegal harm", applies: (c) => c.large || c.anyMedHigh },
    { code: "ICU D5", group: "Reporting and complaints", name: "Sending further information about how the complaint will be handled", rule: "Services likely to be accessed by children that are large or at medium or high risk of any kind of illegal harm", applies: (c) => c.likelyChildren && (c.large || c.anyMedHigh) },
    { code: "ICU D6", group: "Reporting and complaints", name: "Opt-out from communications following a complaint", rule: "Services that are large or at medium or high risk of any kind of illegal harm", applies: (c) => c.large || c.anyMedHigh },
    { code: "ICU D7", group: "Reporting and complaints", name: "Appropriate action for complaints about suspected illegal content", rule: "All services", applies: () => true },
    { code: "ICU D8", group: "Reporting and complaints", name: "Appeals: determination (large or multi-risk services)", rule: "Large or multi-risk services", applies: (c) => c.large || c.multi },
    { code: "ICU D9", group: "Reporting and complaints", name: "Appeals: determination (other services)", rule: "Services that are neither large nor multi-risk", applies: (c) => !c.large && !c.multi },
    { code: "ICU D10", group: "Reporting and complaints", name: "Appeals: action following determination", rule: "All services", applies: () => true },
    { code: "ICU D11", group: "Reporting and complaints", name: "Complaints about proactive technology that are not appeals", rule: "All services", applies: () => true },
    { code: "ICU D12", group: "Reporting and complaints", name: "Appropriate action for all other relevant complaints", rule: "All services", applies: () => true },
    { code: "ICU D13", group: "Reporting and complaints", name: "Exception: manifestly unfounded complaints", rule: "All services", applies: () => true },
    { code: "ICU D14", group: "Reporting and complaints", name: "Dedicated reporting channel for trusted flaggers to report fraud", rule: "Large services at medium or high risk of fraud", applies: (c) => c.large && c.medHigh("fraud") },
    // E. Recommender systems
    { code: "ICU E1", group: "Recommender systems", name: "Collecting safety metrics during on-platform testing of content recommender systems", rule: "Services that test content recommender systems on the platform and are at medium or high risk of two or more of: terrorism, CSAM (imagery or URLs), suicide, hate, harassment, drugs, extreme pornography, intimate image abuse, foreign interference", applies: (c) => c.q.q_rec_testing && c.countMedHigh([["terrorism"], ["csam_image", "csam_url"], ["suicide"], ["hate"], ["harassment"], ["drugs"], ["extreme_porn"], ["iia"], ["foreign_interference"]]) >= 2 },
    // F. Settings, functionalities and user support
    { code: "ICU F1", group: "Settings, functionalities and user support", name: "Safety defaults for child users", rule: "Services with an existing way to determine users' age that have network expansion prompts, connection lists or direct messaging, and are at high risk of grooming (or large and at medium risk)", applies: (c) => c.q.q_age_means && (c.f["5b"] || c.f["4a"] || c.f["8n"]) && (c.high("grooming") || (c.large && c.medium("grooming"))) },
    { code: "ICU F2", group: "Settings, functionalities and user support", name: "Support for child users", rule: "As ICU F1", applies: (c) => c.q.q_age_means && (c.f["5b"] || c.f["4a"] || c.f["8n"]) && (c.high("grooming") || (c.large && c.medium("grooming"))) },
    // G. Terms of service
    { code: "ICU G1", group: "Terms of service", name: "Terms of service: substance", rule: "All services", applies: () => true },
    { code: "ICU G2", group: "Terms of service", name: "Terms of service: substance (Category 1 services)", rule: "Category 1 services", applies: (c) => c.category === "1" },
    { code: "ICU G3", group: "Terms of service", name: "Terms of service: clarity and accessibility", rule: "All services", applies: () => true },
    // H. User access
    { code: "ICU H1", group: "User access", name: "Removing accounts of proscribed organisations", rule: "All services", applies: () => true },
    // J. User controls
    { code: "ICU J1", group: "User controls", name: "User blocking and muting", rule: "Large services at medium or high risk of grooming, suicide, hate, harassment or controlling or coercive behaviour, with user profiles and connections, posting or communication functions", applies: (c) => c.large && c.medHigh(["grooming", "suicide", "hate", "harassment", "coercive"]) && c.f["3a"] && (c.f["4a"] || c.f["5e"] || c.f["5b"] || c.f["5d"] || c.f["1a"] || c.f["1e"]) },
    { code: "ICU J2", group: "User controls", name: "Disabling comments", rule: "Large services at medium or high risk of grooming, suicide, hate or harassment that let users comment on content", applies: (c) => c.large && c.medHigh(["grooming", "suicide", "hate", "harassment"]) && c.f["5d"] },
    { code: "ICU J3", group: "User controls", name: "Notable user and monetised labelling schemes", rule: "Large services at medium or high risk of fraud or foreign interference that label profiles under a notable user or monetised scheme", applies: (c) => c.large && c.medHigh(["fraud", "foreign_interference"]) && c.q.q_notable },
  ];
  const search = [
    { code: "ICS A1", group: "Governance and accountability", name: "Annual review of risk management activities", rule: "Large general search services", applies: (c) => c.largeGeneral },
    { code: "ICS A2", group: "Governance and accountability", name: "Individual accountable for illegal content safety duties and reporting and complaints duties", rule: "All services", applies: () => true },
    { code: "ICS A3", group: "Governance and accountability", name: "Written statements of responsibilities", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS A4", group: "Governance and accountability", name: "Internal monitoring and assurance", rule: "Large services that are multi-risk", applies: (c) => c.large && c.multi },
    { code: "ICS A5", group: "Governance and accountability", name: "Tracking evidence of new and increasing illegal harm", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS A6", group: "Governance and accountability", name: "Code of conduct regarding protection of users from illegal harm", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS A7", group: "Governance and accountability", name: "Compliance training", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C1", group: "Search moderation", name: "Search moderation function designed to action illegal content", rule: "All services", applies: () => true },
    { code: "ICS C2", group: "Search moderation", name: "Setting internal content policies", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C3", group: "Search moderation", name: "Performance targets", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C4", group: "Search moderation", name: "Prioritisation", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C5", group: "Search moderation", name: "Resourcing", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C6", group: "Search moderation", name: "Training and materials for search moderators (non-volunteers)", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS C7", group: "Search moderation", name: "Removing listed CSAM URLs from search results", rule: "All general search services", applies: (c) => c.f.s1a },
    { code: "ICS C8", group: "Search moderation", name: "Using hash matching to detect intimate image abuse content", rule: "Large general search services", applies: (c) => c.largeGeneral },
    { code: "ICS D1", group: "Reporting and complaints", name: "Enabling complaints", rule: "All services", applies: () => true },
    { code: "ICS D2", group: "Reporting and complaints", name: "Easy to find, easy to access and easy to use complaints systems and processes", rule: "All services", applies: () => true },
    { code: "ICS D3", group: "Reporting and complaints", name: "Sending indicative timeframes", rule: "Large general search services or services at medium or high risk of any kind of illegal harm", applies: (c) => c.largeGeneral || c.anyMedHigh },
    { code: "ICS D4", group: "Reporting and complaints", name: "Sending further information about how the complaint will be handled", rule: "Large general search services or services at medium or high risk of any kind of illegal harm, that are likely to be accessed by children", applies: (c) => c.likelyChildren && (c.largeGeneral || c.anyMedHigh) },
    { code: "ICS D5", group: "Reporting and complaints", name: "Opt-out from communications following a complaint", rule: "Large general search services or services at medium or high risk of any kind of illegal harm", applies: (c) => c.largeGeneral || c.anyMedHigh },
    { code: "ICS D6", group: "Reporting and complaints", name: "Appropriate action for complaints about suspected illegal content", rule: "All services", applies: () => true },
    { code: "ICS D7", group: "Reporting and complaints", name: "Appeals: determination (large general or multi-risk services)", rule: "Large general search services or multi-risk services", applies: (c) => c.largeGeneral || c.multi },
    { code: "ICS D8", group: "Reporting and complaints", name: "Appeals: determination (other services)", rule: "Services that are neither large general search services nor multi-risk", applies: (c) => !c.largeGeneral && !c.multi },
    { code: "ICS D9", group: "Reporting and complaints", name: "Appeals: action following determination", rule: "All services", applies: () => true },
    { code: "ICS D10", group: "Reporting and complaints", name: "Complaints about proactive technology that are not appeals", rule: "All services", applies: () => true },
    { code: "ICS D11", group: "Reporting and complaints", name: "Appropriate action for all other relevant complaints", rule: "All services", applies: () => true },
    { code: "ICS D12", group: "Reporting and complaints", name: "Exception: manifestly unfounded complaints", rule: "All services", applies: () => true },
    { code: "ICS D13", group: "Reporting and complaints", name: "Dedicated reporting channel for trusted flaggers to report fraud", rule: "Large general search services at medium or high risk of fraud", applies: (c) => c.largeGeneral && c.medHigh("fraud") },
    { code: "ICS F1", group: "Settings, functionalities and user support", name: "Reporting and removal of predictive search suggestions", rule: "Large general search services that use predictive search", applies: (c) => c.largeGeneral && c.f.s3a },
    { code: "ICS F2", group: "Settings, functionalities and user support", name: "Provision of CSAM content warnings", rule: "Large general search services", applies: (c) => c.largeGeneral },
    { code: "ICS F3", group: "Settings, functionalities and user support", name: "Provision of suicide crisis prevention information", rule: "Large general search services", applies: (c) => c.largeGeneral },
    { code: "ICS G1", group: "Publicly available statements", name: "Publicly available statements: substance", rule: "All services", applies: () => true },
    { code: "ICS G2", group: "Publicly available statements", name: "Publicly available statements: substance (Category 2A services)", rule: "Category 2A services", applies: (c) => c.category === "2A" },
    { code: "ICS G3", group: "Publicly available statements", name: "Publicly available statements: clarity and accessibility", rule: "All services", applies: () => true },
  ];
  const measures = u2u.map((m) => Object.assign({ id: m.code.replace(/\s/g, "_"), service: "u2u" }, m))
    .concat(search.map((m) => Object.assign({ id: m.code.replace(/\s/g, "_"), service: "search" }, m)));

  // ----- Risk level guidance [RAG Table 13], condensed.
  const levelGuide = {
    likelihood: [
      { id: "low", name: "Low", hint: "No evidence of this harm and no or few of the linked risk factors, or comprehensive controls that your evidence shows are very effective." },
      { id: "medium", name: "Medium", hint: "Evidence it occurs or is likely, or several linked risk factors without controls you can show are effective." },
      { id: "high", name: "High", hint: "Significant evidence it occurs or is very likely, or many linked risk factors and no effective controls." },
    ],
    impact: [
      { id: "low", name: "Low", hint: "Limited potential for harm: very few people affected and low severity." },
      { id: "medium", name: "Medium", hint: "A moderate amount of this content or moderate harm, or some scope to affect many people (for example 700,000 to 7 million monthly UK users)." },
      { id: "high", name: "High", hint: "A substantial amount of this content or harm to many people, a severe impact even on a few, or broad reach (for example over 7 million monthly UK users)." },
    ],
  };

  const statuses = [
    { id: "implemented", name: "Implemented" },
    { id: "planned", name: "Planned" },
    { id: "alternative", name: "Alternative measure in place" },
    { id: "not_adopted", name: "Not adopted" },
  ];

  const levels = [
    { id: "negligible", name: "Negligible" },
    { id: "low", name: "Low" },
    { id: "medium", name: "Medium" },
    { id: "high", name: "High" },
  ];

  return { SOURCES, harms, factorGroups, profileLinks, generalFactors, questions, evidence, measures, levelGuide, statuses, levels };
})();
