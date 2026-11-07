export type NavItem = {
  label: string;
  href: `#${string}`;
};

export type FooterItem = {
  label: string;
  href: string | null;
  external?: boolean;
};

export const joinFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSciJw_Jio_KMje5xPZA6yi3SQrm07IZZzhyaS4L0sU8BrDlSg/viewform";

export type Partner = {
  id: string;
  name: string;
  logoSrc: string;
  alt: string;
  logoFormat: "wide" | "tall" | "standard";
  logoTone?: "light-on-dark";
};

export const siteConfig = {
  name: "SpeakUp",
  title: "SpeakUp — Sales, Communication & Leadership for Students",
  description:
    "The student community for sales, communication and leadership.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.speakup-project.com",
  nav: [
    { label: "Events", href: "#events" },
    { label: "About", href: "#about" },
    { label: "Partners", href: "#partners" },
  ] satisfies NavItem[],
  links: {
    join: null as string | null,
    instagram: "https://www.instagram.com/speakup_auebgenz/" as string | null,
    linkedIn:
      "https://www.linkedin.com/company/speakup-aueb-genz/home/" as string | null,
    tikTok: "https://www.tiktok.com/@speakupaueb_genz" as string | null,
    email: "mailto:speakupaueb@gmail.com" as string | null,
    privacy: null as string | null,
  },
} as const;

export const conversationStatements = [
  "Every opportunity starts with a conversation.",
  "Some people avoid them.",
  "We learn how to own them.",
] as const;

export type SpeakupStoryChapter = {
  index: string;
  label: string;
  headline: string;
  secondary?: string;
  body: readonly string[];
};

export const speakupStoryChapters = [
  {
    index: "01",
    label: "WHO ARE WE?",
    headline: "We are SpeakUp.",
    secondary: "A student-led sales organisation at AUEB",
    body: [
      "We bring together ambitious students who want to become better at selling ideas, products, communicating with confidence and creating opportunities.",
    ],
  },
  {
    index: "02",
    label: "WORKSHOPS",
    headline:
      "Our workshops put you in real sales situations and challenge you to think, communicate, and perform on the spot.",
    body: [
      "From cold calling and pitching to negotiation, objection handling, and closing the deal, you’ll learn how to start conversations, capture attention, build value, handle pressure, and turn opportunities into results.",
    ],
  },
  {
    index: "03",
    label: "SPEAKER EVENTS",
    headline: "Learn from people who are already doing it.",
    body: [
      "We bring inspiring professionals, founders, and sales leaders into the room to share the stories, lessons, and real-world experiences behind their careers.",
    ],
  },
  {
    index: "04",
    label: "NETWORKING EVENTS",
    headline: "Meet people. Start conversations. Create opportunities.",
    body: [
      "Our networking events bring ambitious students and professionals together in an environment where connections happen naturally.",
      "Whether you’re looking for your next opportunity, a new perspective, or simply the right people to learn from, this is where conversations turn into possibilities.",
    ],
  },
] as const satisfies readonly SpeakupStoryChapter[];

export const stats = [
  { value: "100K+", label: "Reach" },
  { value: "500+", label: "Students" },
  { value: "20+", label: "Events" },
] as const;

export const careerStatements = [
  "Your degree gets you noticed.",
  "Your skills get you hired.",
] as const;

export const partners = [
  {
    id: "hell",
    name: "HELL",
    logoSrc: "/partners/hell.png",
    alt: "HELL logo",
    logoFormat: "wide",
  },
  {
    id: "korpi",
    name: "Korpi",
    logoSrc: "/partners/korpi.png",
    alt: "Korpi logo",
    logoFormat: "wide",
  },
  {
    id: "everest",
    name: "Everest",
    logoSrc: "/partners/everest.png",
    alt: "Everest logo",
    logoFormat: "wide",
  },
  {
    id: "plaisio",
    name: "Πλαίσιο (Plaisio)",
    logoSrc: "/partners/plaisio.png",
    alt: "Πλαίσιο (Plaisio) logo",
    logoFormat: "wide",
  },
  {
    id: "nescafe",
    name: "Nescafé",
    logoSrc: "/partners/nescafe.png",
    alt: "Nescafé logo",
    logoFormat: "wide",
  },
  {
    id: "gregorys",
    name: "Γρηγόρης (Gregory's)",
    logoSrc: "/partners/gregorys.png",
    alt: "Γρηγόρης (Gregory's) logo",
    logoFormat: "wide",
  },
  {
    id: "maragos",
    name: "Maragos",
    logoSrc: "/partners/maragos.png",
    alt: "Maragos logo",
    logoFormat: "wide",
  },
  {
    id: "yum-tales-supply",
    name: "Yum Tales Supply",
    logoSrc: "/partners/yum-tales-supply.png",
    alt: "Yum Tales Supply logo",
    logoFormat: "tall",
  },
  {
    id: "nestle",
    name: "Nestlé",
    logoSrc: "/partners/nestle.png",
    alt: "Nestlé logo",
    logoFormat: "tall",
  },
  {
    id: "multiplo",
    name: "Multiplo",
    logoSrc: "/partners/multiplo.png",
    alt: "Multiplo logo",
    logoFormat: "wide",
  },
  {
    id: "zografos",
    name: "Zografos",
    logoSrc: "/partners/zografos.png",
    alt: "Zografos logo",
    logoFormat: "wide",
  },
  {
    id: "mastermind",
    name: "Mastermind",
    logoSrc: "/partners/mastermind.png",
    alt: "Mastermind logo",
    logoFormat: "standard",
    logoTone: "light-on-dark",
  },
  {
    id: "elements-of-sound",
    name: "Elements of Sound",
    logoSrc: "/partners/elements-of-sound.png",
    alt: "Elements of Sound logo",
    logoFormat: "wide",
  },
] as const satisfies readonly Partner[];

export const footerItems: FooterItem[] = [
  { label: "Events", href: "#events" },
  { label: "About", href: "#about" },
  { label: "Partners", href: "#partners" },
  { label: "Join", href: "#join" },
  { label: "Instagram", href: siteConfig.links.instagram, external: true },
  { label: "LinkedIn", href: siteConfig.links.linkedIn, external: true },
  { label: "Email", href: siteConfig.links.email },
  { label: "Privacy", href: siteConfig.links.privacy },
];
