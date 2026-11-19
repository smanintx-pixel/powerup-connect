import { storage } from "./storage";
import { hashPassword } from "./auth";

const DEMO_CODE = "POWERUP2027";

export const demoAttendees = [
  {
    name: "Amara Okafor",
    email: "amara@brightpathventures.com",
    password: "Powerup2027!",
    title: "Founder & CEO",
    company: "BrightPath Ventures",
    bio: "Building the seed fund for the next generation of women-led startups. Let's talk about your first check.",
    linkedinUrl: "https://linkedin.com/in/amaraokafor",
    tags: ["Founder", "Venture Capital", "Startups"],
  },
  {
    name: "Priya Nandakumar",
    email: "priya@lumenfinancial.com",
    password: "Powerup2027!",
    title: "VP of Marketing",
    company: "Lumen Financial",
    bio: "15 years turning brand stories into growth. Obsessed with community-led marketing and good coffee.",
    linkedinUrl: "https://linkedin.com/in/priyanandakumar",
    tags: ["Marketing", "Brand Strategy", "Financial Services"],
  },
  {
    name: "Denise Whitfield",
    email: "denise@whitfieldwealth.com",
    company: "Whitfield Wealth Partners",
    password: "Powerup2027!",
    title: "Senior Financial Advisor",
    bio: "Helping women build generational wealth, one plan at a time. Ask me about your retirement number.",
    linkedinUrl: "https://linkedin.com/in/denisewhitfield",
    tags: ["Financial Advisor", "Wealth Planning"],
  },
  {
    name: "Sofia Marquez",
    email: "sofia@risecoaching.co",
    company: "Rise Coaching Co.",
    password: "Powerup2027!",
    title: "Executive Career Coach",
    bio: "Ex-Fortune 500 HR exec now coaching women into the C-suite. Your next power move starts with clarity.",
    linkedinUrl: "https://linkedin.com/in/sofiamarquez",
    tags: ["Career Coach", "Leadership"],
  },
  {
    name: "Jordan Blake",
    email: "jordan@harborlightnonprofit.org",
    company: "Harbor Light Foundation",
    password: "Powerup2027!",
    title: "Executive Director",
    bio: "Leading a foundation that's funded over 200 scholarships for first-gen women in STEM.",
    linkedinUrl: "https://linkedin.com/in/jordanblake",
    tags: ["Nonprofit", "Education", "STEM"],
  },
  {
    name: "Keisha Alston",
    email: "keisha@alstonlawgroup.com",
    company: "Alston Law Group",
    password: "Powerup2027!",
    title: "Managing Partner",
    bio: "Employment law for founders who refuse to settle for 'good enough' culture.",
    linkedinUrl: "https://linkedin.com/in/keishaalston",
    tags: ["Legal", "Founder", "HR"],
  },
  {
    name: "Wren Castillo",
    email: "wren@northstarcreative.studio",
    company: "North Star Creative",
    password: "Powerup2027!",
    title: "Creative Director",
    bio: "Design studio for brands that want to feel as bold as their mission. Let's make something people remember.",
    linkedinUrl: "https://linkedin.com/in/wrencastillo",
    tags: ["Design", "Branding", "Creative"],
  },
  {
    name: "Talia Rosen",
    email: "talia@heronhealthtech.com",
    company: "Heron Health Tech",
    password: "Powerup2027!",
    title: "VP of Product",
    bio: "Shipping products that make women's healthcare less of a fight and more of a partnership.",
    linkedinUrl: "https://linkedin.com/in/taliarosen",
    tags: ["Product", "HealthTech", "Startups"],
  },
  {
    name: "Camille Dupree",
    email: "camille@dupreeandco.com",
    company: "Dupree & Co. Communications",
    password: "Powerup2027!",
    title: "Principal, PR & Communications",
    bio: "Helping ambitious women tell their story before someone else tells it for them.",
    linkedinUrl: "https://linkedin.com/in/camilledupree",
    tags: ["PR", "Communications", "Founder"],
  },
  {
    name: "Renata Silva",
    email: "renata@vantagepointops.com",
    company: "Vantage Point Operations",
    password: "Powerup2027!",
    title: "COO",
    bio: "Operations nerd who believes the right systems free you up to do the work that actually matters.",
    linkedinUrl: "https://linkedin.com/in/renatasilva",
    tags: ["Operations", "Leadership"],
  },
  {
    name: "Harper Nguyen",
    email: "harper@bloomretailgroup.com",
    company: "Bloom Retail Group",
    password: "Powerup2027!",
    title: "Director of E-Commerce",
    bio: "Scaled three DTC brands past 8 figures. Always up for talking retention strategy over tea.",
    linkedinUrl: "https://linkedin.com/in/harpernguyen",
    tags: ["E-Commerce", "Retail", "Growth"],
  },
  {
    name: "Odessa Kim",
    email: "odessa@paragonanalytics.io",
    company: "Paragon Analytics",
    password: "Powerup2027!",
    title: "Head of Data Science",
    bio: "Turning messy data into clear decisions. Big believer that more women belong in the room where models get built.",
    linkedinUrl: "https://linkedin.com/in/odessakim",
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

  for (const attendee of demoAttendees) {
    await storage.createUser({
      name: attendee.name,
      email: attendee.email.toLowerCase(),
      passwordHash: hashPassword(attendee.password),
      title: attendee.title,
      company: attendee.company,
      bio: attendee.bio,
      linkedinUrl: attendee.linkedinUrl,
      photoUrl: "",
      tags: JSON.stringify(attendee.tags),
      accessCode: DEMO_CODE,
      createdAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 10),
    });
  }
  console.log(`[seed] seeded ${demoAttendees.length} demo attendees`);
}
