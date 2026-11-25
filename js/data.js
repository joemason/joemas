/*
 * Reference content for the illegal content risk assessment.
 *
 * Based on Ofcom's Risk Assessment Guidance and Risk Profiles, and the
 * Illegal Content Codes of Practice under the Online Safety Act 2023.
 * The mappings are a practical summary to guide users, not a copy of the
 * official documents. Check Ofcom's current publications before relying
 * on them.
 */
window.OSRA_DATA = (function () {
  // ----- The 17 kinds of priority illegal harm (CSEA split into its three
  // assessed parts, as Ofcom's guidance does), plus other illegal content.
  const harms = [
    {
      id: "terrorism",
      name: "Terrorism",
      summary:
        "Content that encourages, glorifies or supports terrorism, recruits for or invites support for proscribed organisations, or shares material useful for terrorist acts.",
    },
    {
      id: "grooming",
      name: "Child sexual exploitation and abuse: grooming",
      summary:
        "Adults contacting, building relationships with or manipulating children for sexual purposes, including sexual communication with a child.",
    },
    {
      id: "csam_image",
      name: "Child sexual exploitation and abuse: image-based CSAM",
      summary:
        "Indecent or prohibited images and videos of children, including AI-generated and pseudo-images.",
    },
    {
      id: "csam_url",
      name: "Child sexual exploitation and abuse: CSAM URLs",
      summary:
        "Links (URLs) to websites or files that contain child sexual abuse material.",
    },
    {
      id: "hate",
      name: "Hate",
      summary:
        "Content stirring up hatred on grounds of race, religion or sexual orientation, and racially or religiously aggravated public order offences.",
    },
    {
      id: "harassment",
      name: "Harassment, stalking, threats and abuse",
      summary:
        "Harassment, stalking, threats to kill, threatening or abusive behaviour, and other abusive communications.",
    },
    {
      id: "coercive",
      name: "Controlling or coercive behaviour",
      summary:
        "Repeated or continuous controlling or coercive behaviour towards a partner or family member, carried out or facilitated online.",
    },
    {
      id: "iia",
      name: "Intimate image abuse",
      summary:
        "Sharing, or threatening to share, intimate images or videos without consent, including deepfakes.",
    },
    {
      id: "extreme_porn",
      name: "Extreme pornography",
      summary:
        "Extreme pornographic images, for example those depicting acts that threaten life or cause serious injury, necrophilia or bestiality.",
    },
    {
      id: "sexual_exploitation",
      name: "Sexual exploitation of adults",
      summary:
        "Causing, inciting or controlling prostitution for gain, and paying for the sexual services of a person subjected to force.",
    },
    {
      id: "trafficking",
      name: "Human trafficking",
      summary:
        "Arranging or facilitating the travel of a person for exploitation, including recruiting victims, advertising and logistics.",
    },
    {
      id: "immigration",
      name: "Unlawful immigration",
      summary:
        "Assisting unlawful immigration, for example advertising small-boat crossings or fake documents.",
    },
    {
      id: "fraud",
      name: "Fraud and financial offences",
      summary:
        "Fraud by false representation, articles for use in fraud, investment scams, romance scams, and other financial services offences.",
    },
    {
      id: "proceeds",
      name: "Proceeds of crime",
      summary:
        "Money laundering and dealing in criminal property, including recruiting 'money mules'.",
    },
    {
      id: "drugs",
      name: "Drugs and psychoactive substances",
      summary:
        "Supplying, or offering to supply, controlled drugs and psychoactive substances.",
    },
    {
      id: "weapons",
      name: "Firearms, knives and other weapons",
      summary:
        "Selling or offering prohibited firearms, ammunition, knives and other offensive weapons, including 3D-printed weapons.",
    },
    {
      id: "suicide",
      name: "Encouraging or assisting suicide",
      summary:
        "Content that encourages or assists suicide or an attempt at suicide, or serious self-harm.",
    },
    {
      id: "foreign_interference",
      name: "Foreign interference",
      summary:
        "Disinformation and other conduct on behalf of a foreign power intended to interfere with UK political, legal or democratic processes.",
    },
    {
      id: "animal_cruelty",
      name: "Animal cruelty",
      summary:
        "Content that causes, encourages or assists unnecessary suffering of animals.",
    },
    {
      id: "other",
      name: "Other illegal content (non-priority offences)",
      summary:
        "Other relevant offences that are not priority offences, for example cyberflashing, epilepsy trolling, false communications and encouraging serious self-harm. Assess any your service is aware of.",
    },
  ];

  // ----- Risk factors. Each one, if present on the service, raises the
  // risk of the harms listed in `raises`. "all" means every harm.
  const ALL = "all";
  const factorGroups = [
    {
      id: "type",
      name: "Service type",
      hint: "Tick every type that describes your service, even partly.",
      services: ["u2u"],
      factors: [
        { id: "t_social", name: "Social media service", raises: ["terrorism", "grooming", "csam_image", "hate", "harassment", "coercive", "iia", "fraud", "drugs", "suicide", "foreign_interference", "animal_cruelty"] },
        { id: "t_messaging", name: "Messaging service", raises: ["terrorism", "grooming", "csam_image", "csam_url", "harassment", "coercive", "iia", "fraud", "drugs", "trafficking"] },
        { id: "t_gaming", name: "Gaming service", raises: ["terrorism", "grooming", "hate", "harassment", "fraud"] },
        { id: "t_adult", name: "Adult service (pornography or sexual content)", raises: ["csam_image", "csam_url", "iia", "extreme_porn", "sexual_exploitation", "trafficking"] },
        { id: "t_forum", name: "Discussion forum or chat room", raises: ["terrorism", "csam_image", "csam_url", "hate", "harassment", "drugs", "suicide", "foreign_interference"] },
        { id: "t_dating", name: "Dating service", raises: ["harassment", "iia", "fraud", "sexual_exploitation", "trafficking"] },
        { id: "t_marketplace", name: "Marketplace or listings service", raises: ["fraud", "proceeds", "drugs", "weapons", "trafficking", "immigration", "sexual_exploitation", "animal_cruelty"] },
        { id: "t_filesharing", name: "File-storage or file-sharing service", raises: ["terrorism", "csam_image", "csam_url", "iia", "extreme_porn"] },
        { id: "t_video", name: "Video-sharing service", raises: ["terrorism", "csam_image", "hate", "suicide", "extreme_porn", "animal_cruelty", "iia"] },
      ],
    },
    {
      id: "search_type",
      name: "Search service type",
      hint: "Tick the option that describes your search service.",
      services: ["search"],
      factors: [
        { id: "s_general", name: "General search service (searches the whole web)", raises: [ALL] },
        { id: "s_vertical", name: "Vertical search service (searches a specific sector, such as flights or financial products)", raises: ["fraud"] },
        { id: "s_predictive", name: "Predictive search (autocomplete) suggestions", raises: ["csam_url", "suicide", "drugs", "fraud", "terrorism"] },
        { id: "s_image", name: "Image or reverse-image search", raises: ["csam_image", "iia", "extreme_porn"] },
      ],
    },
    {
      id: "users",
      name: "User base",
      hint: "Who uses your service.",
      services: ["u2u", "search"],
      factors: [
        { id: "u_children", name: "Children (under 18) use the service, or are likely to", raises: ["grooming", "csam_image", "harassment", "suicide"] },
        { id: "u_vulnerable", name: "Users who may be particularly vulnerable (for example people in crisis, recent migrants or people in financial difficulty)", raises: ["fraud", "suicide", "trafficking", "immigration", "sexual_exploitation", "coercive"] },
        { id: "u_large", name: "Large user base (lots of UK users, so content can reach many people)", raises: [ALL] },
      ],
    },
    {
      id: "identity",
      name: "Accounts and identity",
      hint: "How people sign up and appear to others.",
      services: ["u2u"],
      factors: [
        { id: "f_profiles", name: "Users can create profiles that others can see", raises: ["grooming", "harassment", "fraud", "foreign_interference", "sexual_exploitation", "hate"] },
        { id: "f_anonymous", name: "Users can be anonymous or use accounts not linked to their identity", raises: ["terrorism", "csam_image", "hate", "harassment", "fraud", "drugs", "iia", "foreign_interference"] },
        { id: "f_multiple", name: "Users can easily create multiple or fake accounts", raises: ["fraud", "foreign_interference", "harassment", "grooming"] },
        { id: "f_verification", name: "Users can get a verified, notable or paid-for status badge", raises: ["fraud", "foreign_interference"] },
      ],
    },
    {
      id: "networking",
      name: "Connecting users",
      hint: "How people find and connect with each other.",
      services: ["u2u"],
      factors: [
        { id: "f_connections", name: "Users can connect with, follow or friend each other", raises: ["grooming", "harassment", "coercive", "foreign_interference"] },
        { id: "f_suggestions", name: "The service suggests people to connect with (network expansion prompts)", raises: ["grooming", "harassment"] },
        { id: "f_groups", name: "Users can form or join groups, channels or chat rooms", raises: ["terrorism", "csam_image", "csam_url", "hate", "drugs", "suicide", "fraud"] },
        { id: "f_location", name: "Users can share their location, or it can be inferred", raises: ["harassment", "coercive", "grooming", "trafficking"] },
      ],
    },
    {
      id: "communication",
      name: "Communicating",
      hint: "How people talk to each other.",
      services: ["u2u"],
      factors: [
        { id: "f_dm", name: "Direct or private messaging between users", raises: ["grooming", "csam_image", "harassment", "coercive", "iia", "fraud", "drugs", "sexual_exploitation", "trafficking"] },
        { id: "f_encrypted", name: "End-to-end encrypted messaging", raises: ["grooming", "csam_image", "csam_url", "terrorism", "drugs", "fraud"] },
        { id: "f_ephemeral", name: "Disappearing or ephemeral messages or posts", raises: ["grooming", "iia", "harassment", "drugs"] },
        { id: "f_livestream", name: "Livestreaming", raises: ["grooming", "csam_image", "terrorism", "suicide", "harassment", "animal_cruelty"] },
        { id: "f_voice", name: "Voice or video calls", raises: ["grooming", "harassment", "coercive"] },
        { id: "f_comments", name: "Commenting on, or reacting to, content", raises: ["grooming", "hate", "harassment", "suicide"] },
      ],
    },
    {
      id: "content",
      name: "Posting and finding content",
      hint: "What kind of content users can share, and how it spreads.",
      services: ["u2u"],
      factors: [
        { id: "f_images", name: "Users can post or send images or videos", raises: ["csam_image", "iia", "extreme_porn", "terrorism", "hate", "animal_cruelty", "suicide"] },
        { id: "f_links", name: "Users can post hyperlinks", raises: ["csam_url", "terrorism", "fraud", "drugs", "foreign_interference"] },
        { id: "f_reposting", name: "Users can re-post or forward content", raises: ["terrorism", "hate", "iia", "foreign_interference", "suicide"] },
        { id: "f_search", name: "Users can search for content or other users", raises: ["csam_image", "csam_url", "terrorism", "drugs", "suicide", "grooming"] },
        { id: "f_recommender", name: "A recommender system or algorithmic feed decides what users see", raises: ["terrorism", "hate", "harassment", "suicide", "foreign_interference"] },
        { id: "f_genai", name: "Users can create content with generative AI tools on the service", raises: ["csam_image", "iia", "fraud", "foreign_interference", "extreme_porn"] },
        { id: "f_storage", name: "Users can store or share files or large collections of content", raises: ["csam_image", "terrorism", "extreme_porn", "iia"] },
      ],
    },
    {
      id: "transactions",
      name: "Transactions",
      hint: "Buying, selling and moving money.",
      services: ["u2u"],
      factors: [
        { id: "f_sale", name: "Users can post goods or services for sale", raises: ["drugs", "weapons", "fraud", "trafficking", "immigration", "sexual_exploitation", "animal_cruelty", "proceeds"] },
        { id: "f_payments", name: "Users can pay, tip or send money or gifts to each other", raises: ["fraud", "proceeds", "sexual_exploitation", "grooming", "csam_image"] },
      ],
    },
    {
      id: "business",
      name: "Business model and capacity",
      hint: "How the service makes money and how much it can invest in safety.",
      services: ["u2u", "search"],
      factors: [
        { id: "b_ads", name: "Revenue from advertising, including user-generated or paid-for promotion", raises: ["fraud", "foreign_interference"] },
        { id: "b_subscription", name: "Users can earn money from their content (subscriptions, creator payouts)", raises: ["csam_image", "iia", "extreme_porn", "sexual_exploitation", "trafficking"] },
        { id: "b_early", name: "Early-stage, fast-growing or low-capacity service (few staff working on safety)", raises: [ALL] },
      ],
    },
  ];

  // ----- Evidence inputs (Ofcom's core and enhanced inputs).
  const evidence = {
    core: [
      { id: "e_profile", name: "Ofcom's Risk Profiles" },
      { id: "e_complaints", name: "User reports and complaints" },
      { id: "e_userdata", name: "User data (for example age and user numbers)" },
      { id: "e_incidents", name: "Past incidents of illegal content on the service" },
      { id: "e_guidance", name: "Relevant sector or Ofcom guidance (for example the Register of Risks)" },
    ],
    enhanced: [
      { id: "e_moderation", name: "Results of content moderation" },
      { id: "e_research", name: "Commissioned or internal research" },
      { id: "e_testing", name: "Product testing, including safety-by-design testing" },
      { id: "e_experts", name: "Consultation with experts" },
      { id: "e_users", name: "Views of users, including children" },
      { id: "e_audit", name: "Independent audit or review" },
      { id: "e_metrics", name: "Engagement and algorithm data" },
    ],
  };

  // ----- Measures, loosely following Ofcom's Illegal Content Codes of
  // Practice. `when` decides whether a measure is recommended:
  //   all            every service
  //   largeOrMulti   large services, or services that are multi-risk
  //   largeAndMulti  large services that are also multi-risk
  //   harm           medium or high risk for any of `harms`
  //   largeOrHarm    large services, or medium or high for any of `harms`
  //   largeAndHarm   large services with medium or high risk for any of `harms`
  //   highHarm       high risk for any of `harms`
  const measures = [
    // Governance
    { id: "gov_named", group: "Governance and accountability", services: ["u2u", "search"], when: "all", name: "Name a person accountable for illegal content safety", desc: "A named person is accountable to the most senior governance body for complying with the illegal content safety duties and the reporting and complaints duties." },
    { id: "gov_review", group: "Governance and accountability", services: ["u2u", "search"], when: "largeOrMulti", name: "Annual review of risk management by senior governance body", desc: "The most senior governance body reviews and records how the service manages risk from illegal harm at least once a year." },
    { id: "gov_statements", group: "Governance and accountability", services: ["u2u", "search"], when: "largeOrMulti", name: "Written statements of responsibilities", desc: "Senior managers who make decisions about managing illegal content risk have written statements of their responsibilities." },
    { id: "gov_assurance", group: "Governance and accountability", services: ["u2u", "search"], when: "largeAndMulti", name: "Internal monitoring and assurance function", desc: "An independent internal function assesses how well risk management measures work and reports to the governance body or audit committee." },
    { id: "gov_tracking", group: "Governance and accountability", services: ["u2u", "search"], when: "largeOrMulti", name: "Track new and increasing illegal harm", desc: "The service tracks evidence of new kinds of illegal content, and unusual increases in particular kinds, and reports it to senior management." },
    { id: "gov_conduct", group: "Governance and accountability", services: ["u2u", "search"], when: "largeOrMulti", name: "Code of conduct for staff", desc: "A code of conduct sets standards for staff on protecting users from illegal harm." },
    { id: "gov_training", group: "Governance and accountability", services: ["u2u", "search"], when: "largeOrMulti", name: "Compliance training for staff", desc: "Staff involved in designing and running the service get training on the service's approach to the illegal content duties." },

    // Content moderation
    { id: "cm_function", group: "Content moderation", services: ["u2u"], when: "all", name: "Content moderation function to review suspected illegal content", desc: "A function that reviews content suspected to be illegal and decides whether it is illegal or breaks the terms of service." },
    { id: "cm_takedown", group: "Content moderation", services: ["u2u"], when: "all", name: "Swiftly take down illegal content", desc: "When the service becomes aware of illegal content, it is taken down quickly (unless that is not technically feasible)." },
    { id: "cm_policies", group: "Content moderation", services: ["u2u"], when: "largeOrMulti", name: "Internal content policies", desc: "Written internal policies explain how content is moderated, including what counts as illegal content." },
    { id: "cm_targets", group: "Content moderation", services: ["u2u"], when: "largeOrMulti", name: "Performance targets for moderation", desc: "Targets for how quickly and accurately suspected illegal content is dealt with, and monitoring against them." },
    { id: "cm_prioritise", group: "Content moderation", services: ["u2u"], when: "largeOrMulti", name: "Prioritise content for review", desc: "A policy for prioritising which content is reviewed first, considering virality, potential severity and whether it was flagged by a trusted flagger." },
    { id: "cm_resource", group: "Content moderation", services: ["u2u"], when: "largeOrMulti", name: "Resource moderation adequately", desc: "Enough moderators, with the right language skills, to meet the performance targets, including at times of increased demand." },
    { id: "cm_moderator_training", group: "Content moderation", services: ["u2u"], when: "largeOrMulti", name: "Training and materials for moderators", desc: "Moderators get training and materials to identify and act on illegal content." },
    { id: "cm_hash", group: "Content moderation", services: ["u2u"], when: "largeOrHarm", harms: ["csam_image"], name: "Hash matching to detect known CSAM", desc: "Use perceptual hash matching against a database of known child sexual abuse material to detect and remove it, especially where images can be shared publicly or via file-sharing." },
    { id: "cm_url", group: "Content moderation", services: ["u2u"], when: "largeOrHarm", harms: ["csam_url"], name: "Detect and remove CSAM URLs", desc: "Use a list of URLs known to host CSAM, maintained by an expert organisation, to detect and remove those links." },
    { id: "cm_terror_hash", group: "Content moderation", services: ["u2u"], when: "highHarm", harms: ["terrorism"], name: "Detect known terrorist content", desc: "Use hash matching or other automated tools to detect known terrorist content where the risk is high." },
    { id: "cm_fraud_kw", group: "Content moderation", services: ["u2u"], when: "largeAndHarm", harms: ["fraud"], name: "Keyword detection for articles for use in fraud", desc: "Use keyword detection to find and review content offering stolen credentials, card details and other articles for use in fraud." },

    // Reporting and complaints
    { id: "rc_system", group: "Reporting and complaints", services: ["u2u", "search"], when: "all", name: "Easy to find and use reporting and complaints system", desc: "Users and affected people can easily find, access and use a way to report illegal content and make complaints." },
    { id: "rc_ack", group: "Reporting and complaints", services: ["u2u", "search"], when: "all", name: "Acknowledge complaints and give timeframes", desc: "Complaints are acknowledged, with an indicative timeframe for dealing with them." },
    { id: "rc_appeals", group: "Reporting and complaints", services: ["u2u", "search"], when: "all", name: "Handle appeals properly", desc: "Appeals against moderation decisions are handled with clear timeframes, and content or accounts are restored if a decision was wrong." },
    { id: "rc_fraud_channel", group: "Reporting and complaints", services: ["u2u", "search"], when: "largeAndHarm", harms: ["fraud"], name: "Dedicated reporting channel for trusted flaggers on fraud", desc: "A dedicated channel for trusted flaggers (such as police and regulators) to report fraud." },

    // Terms of service
    { id: "tos_clear", group: "Terms of service", services: ["u2u", "search"], when: "all", name: "Clear and accessible terms of service", desc: "Terms of service (or a publicly available statement for search) explain how users are protected from illegal content and how complaints are handled, in clear and accessible language." },

    // User controls and default settings
    { id: "uc_block", group: "User controls and default settings", services: ["u2u"], when: "largeOrHarm", harms: ["harassment", "hate", "grooming", "coercive"], name: "Let users block and mute other accounts", desc: "Users can block or mute other accounts, including all non-connected users." },
    { id: "uc_comments", group: "User controls and default settings", services: ["u2u"], when: "largeOrHarm", harms: ["harassment", "hate", "grooming"], name: "Let users turn off comments", desc: "Users can disable comments on their own posts." },
    { id: "dc_children", group: "User controls and default settings", services: ["u2u"], when: "harm", harms: ["grooming"], name: "Safer default settings for child users", desc: "By default, child users are not suggested to others in network expansion prompts, are not shown in other users' connection lists, and cannot be messaged by users they are not connected to." },
    { id: "dc_support", group: "User controls and default settings", services: ["u2u"], when: "harm", harms: ["grooming"], name: "Supportive information for child users", desc: "Show child users supportive information at key moments, for example when they turn off a default setting or receive a message from someone they don't know." },
    { id: "uc_verified", group: "User controls and default settings", services: ["u2u"], when: "largeAndHarm", harms: ["fraud", "foreign_interference"], name: "Policies for verified and notable user schemes", desc: "If the service labels some accounts as verified or notable, it has public policies on how this works and explains to users what the labels mean." },

    // Recommender systems
    { id: "rec_testing", group: "Recommender systems", services: ["u2u"], when: "harm", harms: ["terrorism", "hate", "harassment", "suicide", "foreign_interference", "csam_image", "grooming"], name: "Collect safety metrics when testing recommender changes", desc: "When making changes to recommender systems, collect and analyse safety metrics to check whether the change increases exposure to illegal content." },
    { id: "rec_crisis", group: "Recommender systems", services: ["u2u"], when: "largeAndHarm", harms: ["terrorism", "hate", "foreign_interference"], name: "Crisis response protocol", desc: "A protocol for responding to crisis events (such as terrorist attacks or riots), including how recommendations and moderation will change." },

    // User access
    { id: "ua_proscribed", group: "User access", services: ["u2u"], when: "all", name: "Remove accounts of proscribed organisations", desc: "Remove accounts operated by, or on behalf of, proscribed terrorist organisations." },
    { id: "ua_csam_block", group: "User access", services: ["u2u"], when: "harm", harms: ["csam_image", "csam_url", "grooming"], name: "Block users who share CSAM", desc: "Block accounts that share child sexual abuse material and stop them returning." },

    // Search-specific
    { id: "s_deindex", group: "Search services", services: ["search"], when: "all", name: "Deindex or downrank illegal content", desc: "Take appropriate moderation action, such as deindexing or downranking, on search content the service is aware is illegal." },
    { id: "s_predictive", group: "Search services", services: ["search"], when: "largeOrHarm", harms: ["csam_url", "suicide", "drugs", "fraud"], name: "Let users report predictive search suggestions", desc: "Users can easily report predictive search suggestions that direct them to illegal content, and those suggestions are reviewed and removed." },
    { id: "s_csam_warnings", group: "Search services", services: ["search"], when: "largeOrHarm", harms: ["csam_image", "csam_url"], name: "CSAM warnings and removal of CSAM URLs", desc: "Show warnings, with information about support, to users searching for CSAM, and remove known CSAM URLs from search results." },
    { id: "s_image_hash", group: "Search services", services: ["search"], when: "largeOrHarm", harms: ["csam_image"], name: "Hash matching for image search results", desc: "Use hash matching to detect and remove known CSAM from image search results." },

    // Support
    { id: "sup_suicide", group: "Support for users", services: ["u2u", "search"], when: "harm", harms: ["suicide"], name: "Signpost crisis support", desc: "Show crisis prevention information and support (such as helplines) to users who search for, or engage with, content about suicide." },
  ];

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

  return { harms, factorGroups, evidence, measures, statuses, levels, ALL };
})();
