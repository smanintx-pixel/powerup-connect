// Turns data/black-owned-businesses-nova.md into shared/businesses.json.
// Run after editing the list:  node scripts/import-businesses.mjs
import fs from "node:fs";

const src = fs.readFileSync(new URL("../data/black-owned-businesses-nova.md", import.meta.url), "utf8");

const AREAS = ["Alexandria", "Arlington", "Fairfax County", "Loudoun County", "Prince William County"];

// First match wins, so the order matters ("Culinary Events" is food, "Beauty Supply" is a shop).
const CATEGORIES = [
  ["Eat & Drink", /restaurant|caf[eé]|coffee|bakery|food|dessert|cake|bbq|winery|wine|culinary|cooking/i],
  ["Shops & Gifts", /supply|boutique|bookstore|stationery|retail|florist|bridal|engraving|golf|gallery/i],
  ["Events & Travel", /event|venue|tour|travel|resort/i],
  ["Beauty & Barber", /salon|barber|beauty|brow|skincare/i],
  ["Wellness & Fitness", /gym|yoga|fitness|wellness|physical therapy|dental/i],
  ["Home & Trades", /hvac|moving|cleaning|construction|fencing/i],
  ["Professional Services", /./],
];

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const out = [];
const seen = new Set();
let section = "";
let cur = null;
const push = () => { if (cur) out.push(cur); cur = null; };

for (const raw of src.split(/\r?\n/)) {
  const line = raw.trim();
  let m;
  if ((m = line.match(/^## (.+)$/))) { push(); section = m[1]; continue; }
  if ((m = line.match(/^### (.+)$/))) {
    push();
    let slug = slugify(m[1]);
    while (seen.has(slug)) slug += "-2";
    seen.add(slug);
    cur = { slug, name: m[1], section };
    continue;
  }
  if (cur && (m = line.match(/^- \*\*([A-Za-z]+):\*\* (.+)$/))) cur[m[1].toLowerCase()] = m[2].trim();
}
push();

const businesses = out.map((b) => {
  const type = b.type || "Business";
  const category = CATEGORIES.find(([, re]) => re.test(type))[0];
  const area = AREAS.includes(b.section) ? b.section : "";

  // "123 Main St, Leesburg, VA 20175 (by appointment only)" -> street + note
  let address = b.address || "";
  let addressNote = "";
  const note = address.match(/\s*\(([^)]+)\)\s*$/);
  if (note) { addressNote = note[1]; address = address.slice(0, note.index).trim(); }
  const cityInAddress = address.match(/,\s*([A-Za-z .'-]+),\s*VA\b/);
  const city = b.city || (cityInAddress ? cityInAddress[1].trim() : "");

  let website = b.website || "";
  if (website && !/^https?:\/\//i.test(website)) website = "https://" + website;
  website = website.replace(/^http:\/\//i, "https://");

  const digits = (b.phone || "").replace(/\D/g, "");
  const phone = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : b.phone || "";

  return {
    slug: b.slug,
    name: b.name,
    type,
    category,
    area,
    city,
    specialty: b.specialty || "",
    owner: b.owner || "",
    address,
    addressNote,
    phone,
    email: b.email || "",
    website,
    // Flagged in the source list as needing a check (possibly closed, moved or
    // unconfirmed). Hidden in the app until someone confirms it.
    needsCheck: b.verify || "",
  };
});

fs.writeFileSync(new URL("../shared/businesses.json", import.meta.url), JSON.stringify(businesses, null, 1) + "\n");
const count = (key) => businesses.reduce((acc, b) => ((acc[b[key] || "(none)"] = (acc[b[key] || "(none)"] || 0) + 1), acc), {});
console.log(businesses.length, "businesses;", businesses.filter((b) => b.needsCheck).length, "flagged");
console.log(count("category"));
console.log(count("area"));
