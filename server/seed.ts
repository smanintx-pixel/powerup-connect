import { storage } from "./storage";
import { hashPassword } from "./auth";

const DEMO_CODE = "POWERUP2027";

// Invented people. Portraits in client/public/demo are AI-generated, not real attendees.
// Sign-in emails are unchanged from the first prototype, so some no longer match the names.
export const demoAttendees = [
  {
    name: "Denise Carter",
    photoUrl: "/demo/denise-carter.jpg",
    email: "amara@brightpathventures.com",
    password: "Powerup2027!",
    title: "Founder & CEO",
    company: "BrightPath Ventures",
    bio: "Building the seed fund for the next generation of women-led startups. Let's talk about your first check.",
    linkedinUrl: "",
    tags: ["Founder", "Venture Capital", "Startups"],
  },
  {
    name: "Monique Harris",
    photoUrl: "/demo/monique-harris.jpg",
    email: "priya@lumenfinancial.com",
    password: "Powerup2027!",
    title: "VP of Marketing",
    company: "Lumen Financial",
    bio: "15 years turning brand stories into growth. Obsessed with community-led marketing and good coffee.",
    linkedinUrl: "",
    tags: ["Marketing", "Brand Strategy", "Financial Services"],
  },
  {
    name: "Cheryl Washington",
    photoUrl: "/demo/cheryl-washington.jpg",
    email: "denise@whitfieldwealth.com",
    company: "Whitfield Wealth Partners",
    password: "Powerup2027!",
    title: "Senior Financial Advisor",
    bio: "Helping women build generational wealth, one plan at a time. Ask me about your retirement number.",
    linkedinUrl: "",
    tags: ["Financial Advisor", "Wealth Planning"],
  },
  {
    name: "Tamika Brooks",
    photoUrl: "/demo/tamika-brooks.jpg",
    email: "sofia@risecoaching.co",
    company: "Rise Coaching Co.",
    password: "Powerup2027!",
    title: "Executive Career Coach",
    bio: "Ex-Fortune 500 HR exec now coaching women into the C-suite. Your next power move starts with clarity.",
    linkedinUrl: "",
    tags: ["Career Coach", "Leadership"],
  },
  {
    name: "Jordan Blake",
    photoUrl: "/demo/jordan-blake.jpg",
    email: "jordan@harborlightnonprofit.org",
    company: "Harbor Light Foundation",
    password: "Powerup2027!",
    title: "Executive Director",
    bio: "Leading a foundation that's funded over 200 scholarships for first-gen women in STEM.",
    linkedinUrl: "",
    tags: ["Nonprofit", "Education", "STEM"],
  },
  {
    name: "Keisha Alston",
    photoUrl: "/demo/keisha-alston.jpg",
    email: "keisha@alstonlawgroup.com",
    company: "Alston Law Group",
    password: "Powerup2027!",
    title: "Managing Partner",
    bio: "Employment law for founders who refuse to settle for 'good enough' culture.",
    linkedinUrl: "",
    tags: ["Legal", "Founder", "HR"],
  },
  {
    name: "Renee Coleman",
    photoUrl: "/demo/renee-coleman.jpg",
    email: "wren@northstarcreative.studio",
    company: "North Star Creative",
    password: "Powerup2027!",
    title: "Creative Director",
    bio: "Design studio for brands that want to feel as bold as their mission. Let's make something people remember.",
    linkedinUrl: "",
    tags: ["Design", "Branding", "Creative"],
  },
  {
    name: "Lauren Mitchell",
    photoUrl: "/demo/lauren-mitchell.jpg",
    email: "talia@heronhealthtech.com",
    company: "Heron Health Tech",
    password: "Powerup2027!",
    title: "VP of Product",
    bio: "Shipping products that make women's healthcare less of a fight and more of a partnership.",
    linkedinUrl: "",
    tags: ["Product", "HealthTech", "Startups"],
  },
  {
    name: "Camille Dupree",
    photoUrl: "/demo/camille-dupree.jpg",
    email: "camille@dupreeandco.com",
    company: "Dupree & Co. Communications",
    password: "Powerup2027!",
    title: "Principal, PR & Communications",
    bio: "Helping ambitious women tell their story before someone else tells it for them.",
    linkedinUrl: "",
    tags: ["PR", "Communications", "Founder"],
  },
  {
    name: "Yolanda Banks",
    photoUrl: "/demo/yolanda-banks.jpg",
    email: "renata@vantagepointops.com",
    company: "Vantage Point Operations",
    password: "Powerup2027!",
    title: "COO",
    bio: "Operations nerd who believes the right systems free you up to do the work that actually matters.",
    linkedinUrl: "",
    tags: ["Operations", "Leadership"],
  },
  {
    name: "Erica Jefferson",
    photoUrl: "/demo/erica-jefferson.jpg",
    email: "harper@bloomretailgroup.com",
    company: "Bloom Retail Group",
    password: "Powerup2027!",
    title: "Director of E-Commerce",
    bio: "Scaled three DTC brands past 8 figures. Always up for talking retention strategy over tea.",
    linkedinUrl: "",
    tags: ["E-Commerce", "Retail", "Growth"],
  },
  {
    name: "Odessa Freeman",
    photoUrl: "/demo/odessa-freeman.jpg",
    email: "odessa@paragonanalytics.io",
    company: "Paragon Analytics",
    password: "Powerup2027!",
    title: "Head of Data Science",
    bio: "Turning messy data into clear decisions. Big believer that more women belong in the room where models get built.",
    linkedinUrl: "",
    tags: ["Data Science", "Technology"],
  },
];

export async function seedDemoData() {
  const existingCode = await storage.getAccessCodeByCode(DEMO_CODE);
  if (!existingCode) {
    await storage.createAccessCode({
      code: DEMO_CODE,
      label: "PUWC 2027 General Admission",
      maxUses: 5000,
    });
    console.log(`[seed] created access code ${DEMO_CODE}`);
  }

  const existingUsers = await storage.listUsers();
  if (existingUsers.length > 0) {
    console.log(`[seed] ${existingUsers.length} users already present, skipping attendee seed`);
    return;
  }

  // Give the demo attendees a spread of past conferences and interests so the
  // badges and the directory filter have something to show.
  const demoYears = [[2019, 2022, 2023, 2025, 2026], [2025, 2026], [], [2018, 2019, 2020, 2024], [2026], [2023, 2024, 2026]];
  const demoInterests = [["Networking", "Business Opportunities"], ["Networking", "Social"], ["Employment"], ["Community Engagement", "Networking"], ["Business Opportunities"], ["Social", "Community Engagement"]];

  for (let i = 0; i < demoAttendees.length; i++) {
    const attendee = demoAttendees[i];
    await storage.createUser({
      name: attendee.name,
      email: attendee.email.toLowerCase(),
      passwordHash: hashPassword(attendee.password),
      title: attendee.title,
      company: attendee.company,
      bio: attendee.bio,
      linkedinUrl: attendee.linkedinUrl,
      photoUrl: attendee.photoUrl,
      tags: JSON.stringify(attendee.tags),
      phone: "",
      phoneVisible: false,
      emailVisible: false,
      interests: JSON.stringify(demoInterests[i % demoInterests.length]),
      pastYears: JSON.stringify(demoYears[i % demoYears.length]),
      accessCode: DEMO_CODE,
      termsVersion: "", // demo accounts are asked to agree on first sign-in
      termsAcceptedAt: null,
      createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 10),
    });
  }
  console.log(`[seed] seeded ${demoAttendees.length} demo attendees`);
}
