import crypto from "node:crypto";
import type { User, SessionWithMaterials } from "../shared/schema";
import type { SessionTokenRequest } from "@nuancelabs/js-sdk"; // types only, so the request shape is checked at build time
import { loyaltyBadge } from "../shared/event";

/**
 * The AI host: a live video persona from Nuance Labs (Nuance Live API).
 *
 * The API key (NUANCE_API_KEY) stays on the server. For each call the server
 * mints a single-use session token that carries the host's prompt; the page
 * only ever receives that token. Docs: https://docs.nuancelabs.ai
 */

export const HOST_NAME = "Nia";
export const HOST_MAX_SECONDS = 300; // one call lasts at most five minutes
export const HOST_CALLS_PER_HOUR = 4;
export const HOST_CALLS_PER_DAY = 10;

const API_URL = (process.env.NUANCE_API_URL || "https://api.nuancelabs.ai").replace(/\/+$/, "");
const PERSONAS = ["sam", "sonia", "mira"];

/**
 * The non-identifying code Nuance Labs receives as end_user_id for this attendee.
 * Also stored on consent records so they can be matched to Nuance's records
 * after an account is deleted.
 */
export function nuanceEndUserId(userId: number): string {
  return "pu_" + crypto.createHash("sha256").update(`powerup-connect:host:${userId}`).digest("hex").slice(0, 32);
}

export function hostEnabled(): boolean {
  return Boolean(process.env.NUANCE_API_KEY);
}

function parseList<T>(json: string | null | undefined): T[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Keeps profile text from breaking out of its sentence in the prompt.
function clean(text: string, max: number): string {
  return text.replace(/[\r\n\t]+/g, " ").replace(/[^A-Za-z0-9À-ÖØ-öø-ÿ .,'&()\-/]/g, "").trim().slice(0, max);
}

/**
 * The brief the host works from. Only her first name, what she is here for and
 * how many past conferences she attended are sent; never her email, phone,
 * company, notes or connections.
 */
export function buildHostPrompt(user: User, sessions: SessionWithMaterials[]): string {
  const firstName = clean(user.name.trim().split(/\s+/)[0] || "", 30);
  const interests = parseList<string>(user.interests).map((i) => clean(String(i), 40)).filter(Boolean);
  const years = parseList<number>(user.pastYears);
  const badge = loyaltyBadge(years);

  const about: string[] = [];
  if (firstName) about.push(`Her first name is ${firstName}.`);
  if (interests.length) about.push(`She said she is here for: ${interests.join(", ")}.`);
  if (years.length === 0) about.push("This looks like her first Power Up conference, so make her feel welcome.");
  else about.push(`She has attended ${years.length} past Power Up conference${years.length === 1 ? "" : "s"}.`);
  if (badge) about.push(`In the app she carries the "${badge.label}" badge for that. You may thank her for coming back.`);

  const sessionLines = sessions.slice(0, 12).map((s) => {
    const parts = [clean(s.title, 120)];
    if (s.track) parts.push(clean(s.track, 30).toLowerCase());
    if (s.presenter) parts.push(`presented by ${clean(s.presenter, 80)}`);
    if (s.timeLabel) parts.push(clean(s.timeLabel, 40));
    return `- ${parts.join(", ")}.`;
  });

  return [
    `You are ${HOST_NAME}, the AI host inside PowerUp Connect, the networking app for the Power Up Women's Conference. You are warm, upbeat and plain-spoken, like a friend who knows the event well. You are an AI, and you say so plainly if anyone asks.`,
    "",
    "You help attendees get the most from the conference and the app: which sessions fit what she is looking for, how the app works, and how to start a conversation with someone new. If she wants, help her practice a short introduction of herself and give her one or two friendly pointers.",
    "",
    "You do not give financial, legal, tax, medical or mental health advice, and you do not offer religious guidance or political opinions. If she asks for any of that, say kindly that a session speaker or a professional is the right person, and point her to a session if one fits. You cannot see her account, change her profile, send messages or connect her with anyone; tell her where in the app she can do it herself. For ticket, refund or account problems, send her to the conference team through the conference website.",
    "",
    "About the woman you are talking with:",
    ...about,
    "",
    "Facts you may state:",
    "- The Power Up Women's Conference is held in Leesburg, Virginia. The next conference is planned for March 2027.",
    "- The founder is Bernadette J. Carroll.",
    sessionLines.length
      ? "- Sessions announced so far:"
      : "- The session line-up has not been announced in the app yet.",
    ...sessionLines.map((l) => "  " + l),
    "- The Sessions tab in the app lists each session, and after the conference its recording and any slides, handouts or guides.",
    "- The Directory tab lists every attendee who joined the app. She can search by name, company or tag, or filter by what someone is here for.",
    "- To connect, she opens a profile and taps Ask to connect. The other woman accepts or declines, and is never told about a decline. Requests she receives appear on the Connections tab.",
    "- Only connected women can message each other. Her phone number and email stay hidden unless she turns them on in Settings, and then only her connections see them.",
    "- For each connection she can keep a private note and a follow-up date that only she can see.",
    "- The Businesses tab is a directory of Black-owned businesses across Northern Virginia, including many in Loudoun County near the conference. She can browse by kind of business or by area, save favorites, and call, get directions or open the website from each listing. You do not know the individual businesses, so send her to that tab instead of naming any.",
    "- The Resources tab is a guide for business owners to places in Northern Virginia that help her start, fund and grow a business: free advising and training, loans, certification and government contracting, chambers including Black chambers of commerce, and county programs. Point her there rather than recommending a lender or giving funding advice yourself.",
    "- Returning attendees earn a badge: Power Up All-Star for two or more past conferences, Power Legend for four or more.",
    "",
    "If you are not sure of a fact, such as the exact date, the venue, a room, a time or a price, say you do not have that yet and suggest the conference website or the Sessions tab. Never guess.",
    "",
    "Open by greeting her by first name, saying in one sentence who you are, and asking what she would like help with. Keep every reply short, two or three natural spoken sentences, with no lists, links or emoji. This call lasts about five minutes, so help her get to something useful quickly.",
  ].join("\n");
}

export type MintResult =
  | { ok: true; token: string }
  | { ok: false; status: number; code: string; message: string };

/** Asks Nuance for a single-use session token for this attendee. */
export async function mintHostToken(user: User, sessions: SessionWithMaterials[]): Promise<MintResult> {
  const key = process.env.NUANCE_API_KEY;
  if (!key) return { ok: false, status: 503, code: "not_configured", message: `${HOST_NAME} is not switched on yet.` };

  const persona = (process.env.NUANCE_PERSONA_ID || "mira").toLowerCase();
  // Nuance asks for an id that does not identify the person: a hash, never a name or email.
  const endUserId = nuanceEndUserId(user.id);

  const body: SessionTokenRequest = {
    interface: "nuance_live",
    end_user_id: endUserId,
    personality: {
      system_prompt: buildHostPrompt(user, sessions),
      ...(PERSONAS.includes(persona) && persona !== "sam" ? { persona_id: persona } : {}),
    },
    interface_setup: {
      delegation: { type: "none" }, // she answers from her brief; nothing is handed off to tools
      runtime_tools: { stay_quiet: true, end_call: true },
      video: { input: { camera: false } }, // she never looks through the attendee's camera
    },
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/session-tokens`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    console.error("[host] token request failed", err instanceof Error ? err.name : "error");
    return { ok: false, status: 502, code: "unreachable", message: `${HOST_NAME} could not be reached. Please try again in a moment.` };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok && typeof data.token === "string") return { ok: true, token: data.token };

  // Log the status and code only. Never the key, the prompt or the token.
  const code = typeof data.code === "string" ? data.code : typeof (data.detail as any)?.code === "string" ? (data.detail as any).code : "";
  // For a 422 also log which field was refused (its path and reason, not its value).
  const where = Array.isArray(data.detail)
    ? (data.detail as any[]).slice(0, 3).map((d) => `${Array.isArray(d?.loc) ? d.loc.join(".") : "?"}: ${String(d?.msg ?? "").slice(0, 120)}`).join(" | ")
    : typeof data.detail === "string" ? data.detail.slice(0, 160) : "";
  console.error(`[host] token refused status=${res.status} code=${code || "none"}${res.status === 422 && where ? ` where=${where}` : ""}`);
  const friendly: Record<number, string> = {
    401: `${HOST_NAME} is not set up correctly yet. Please tell the conference team.`,
    403: `${HOST_NAME} is paused right now. Please try again later.`,
    409: `${HOST_NAME} is busy with other attendees. Please try again in a minute.`,
    429: `${HOST_NAME} has reached her limit for now. Please try again later.`,
    503: `${HOST_NAME} is busy right now. Please try again in a minute.`,
  };
  return {
    ok: false,
    status: [401, 403, 409, 429, 503].includes(res.status) ? (res.status === 401 ? 503 : res.status) : 502,
    code: code || `http_${res.status}`,
    message: friendly[res.status] ?? `${HOST_NAME} could not start. Please try again later.`,
  };
}
