import type { ReactNode } from "react";
import { Link } from "wouter";
import { LEGAL_CONTACT_EMAIL, NUANCE_PRIVACY_URL, HOST_RESTRICTED_REGIONS } from "@shared/legal";

/**
 * The Terms of Service and Privacy Policy shown in the app. The owners' working
 * drafts (with notes for their attorney) are Claude Docs:
 *   Terms:   https://claude.ai/artifact/J5tAqjEtn1kg5Q6z6FQjir
 *   Privacy: https://claude.ai/artifact/1G91mVm2LWSzHuCubu9hUD
 * Keep this text in step with them. When the agreed text changes, bump
 * TERMS_VERSION in shared/legal.ts so everyone is asked to agree again.
 */

export const LEGAL_STATUS = "Beta draft, November 19, 2026. Under review and may change before launch.";
const OPERATOR = "HigherMark Consulting, LLC, PO Box 2257, Ashburn, VA 20147";
const NUANCE_TERMS_URL = "https://app.nuancelabs.ai/developer-terms";

function Email() {
  return LEGAL_CONTACT_EMAIL ? (
    <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-primary underline">
      {LEGAL_CONTACT_EMAIL}
    </a>
  ) : (
    <span className="font-semibold">the conference team (email address to be added)</span>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {children}
    </a>
  );
}

const H2 = ({ children }: { children: ReactNode }) => <h2 className="text-lg font-extrabold mt-8 mb-2">{children}</h2>;
const H3 = ({ children }: { children: ReactNode }) => <h3 className="text-base font-bold mt-5 mb-1.5">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="mb-3">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>;

const regions = `${HOST_RESTRICTED_REGIONS.slice(0, -2).join(", ")}, ${HOST_RESTRICTED_REGIONS.at(-2)} or the province of ${HOST_RESTRICTED_REGIONS.at(-1)}`;

export function TermsContent() {
  return (
    <>
      <H2>1. About these terms</H2>
      <P>
        PowerUp Connect ("the app") is the networking app of the Power Up Women's Conference. It is operated by {OPERATOR}, for the
        Power Up Women's Conference. In these Terms, "we" and "us" mean HigherMark Consulting, LLC and the Power Up Women's
        Conference. By creating an account or using the app, you agree to these Terms and to our{" "}
        <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. If you do not agree, do not use the app.
      </P>
      <H3>Who can use the app</H3>
      <UL>
        <li>You must be 18 or older.</li>
        <li>You need a valid access code from your Power Up Women's Conference registration.</li>
        <li>One account per person. Do not share your account, your password or your access code.</li>
        <li>
          Nia, the app's AI host, is not available to residents of {regions}, because our AI provider does not offer its service
          there. Do not use a VPN or other tool to hide where you are.
        </li>
      </UL>

      <H2>2. Your account and profile</H2>
      <UL>
        <li>Give accurate information about yourself and use your real name. Do not pretend to be another person, or to represent a business or group you do not represent.</li>
        <li>Keep your password private. You are responsible for what happens under your account. Tell <Email /> if you think someone else has used it.</li>
        <li><strong>What other attendees see:</strong> your photo, name, title, company, bio, tags, what you are here for, the past Power Up conferences you attended and your LinkedIn link.</li>
        <li><strong>What only your connections see:</strong> your phone number and email address, and only if you turn them on in Settings. Both are off until you do.</li>
        <li><strong>What only you see:</strong> your private notes, follow-up dates and saved businesses and resources.</li>
      </UL>

      <H2>3. Community rules</H2>
      <P>PowerUp Connect is a place for women to meet and help each other. Treat everyone with respect.</P>
      <H3>Connections and messages</H3>
      <UL>
        <li>To connect with someone, you send a request. She can accept or decline, and she is not told when someone's request is declined. Do not use another account or another channel to get around her answer.</li>
        <li>Only connected attendees can message each other. Either of you can remove the connection at any time.</li>
        <li>You can send up to 40 new connection requests a day.</li>
      </UL>
      <H3>You agree not to</H3>
      <UL>
        <li>harass, threaten, bully, stalk or demean anyone, including because of race, color, religion, national origin, sex, sexual orientation, gender identity, age or disability</li>
        <li>send spam or bulk promotion, or keep pressing someone to buy, invest or join something after she has said no</li>
        <li>share another attendee's contact details, messages or photos outside the app without her permission</li>
        <li>post sexual, violent, hateful or illegal content, or content that breaks someone else's rights, such as copyright</li>
        <li>collect information about other attendees, use bots or scrapers, or try to get around the app's privacy settings or security</li>
        <li>upload harmful code or interfere with how the app works</li>
        <li>use the app for anything illegal</li>
      </UL>
      <H3>Reporting a problem</H3>
      <P>
        Use Report on an attendee's profile or in a conversation, or write to <Email />. To look into a report, we may review the
        accounts and messages involved. We may warn, restrict, suspend or remove an account that breaks these rules, with or
        without notice.
      </P>

      <H2>4. What you share</H2>
      <UL>
        <li><strong>You own your content:</strong> your photo, profile text, messages and notes.</li>
        <li><strong>Our permission to show it:</strong> you give us a non-exclusive, royalty-free licence to store, copy, display and send your content, only to run the app. For example, we show your profile to other attendees and deliver your messages. The licence ends when you delete the content or your account, except for backup copies kept for a short time.</li>
        <li><strong>Only share what you have the right to share.</strong> Your profile photo must be of you.</li>
        <li><strong>We may remove content</strong> that breaks these Terms.</li>
        <li><strong>Ideas you send us:</strong> if you send feedback or suggestions, we may use them without owing you anything.</li>
        <li><strong>Our content:</strong> the app, its design and the Power Up name and logo belong to us or the people who licensed them to us. You may use the app only for your own networking around the conference, not to copy, resell or build something from it.</li>
      </UL>

      <H2>5. Features with extra terms</H2>
      <H3>Nia, the AI host</H3>
      <UL>
        <li><strong>Nia is an artificial intelligence, not a person.</strong> Her face, voice and conversation come from <Ext href={NUANCE_TERMS_URL}>Nuance Labs</Ext>, an independent company.</li>
        <li><strong>She can be wrong.</strong> What she says may be inaccurate, incomplete or misleading. Check anything important, and do not rely on her for decisions about money, credit, jobs, housing, insurance, health or legal matters.</li>
        <li><strong>She is not a medical, mental health, legal, tax or financial service.</strong> In an emergency, call 911. If you are thinking about harming yourself, call or text 988.</li>
        <li><strong>Your calls are recorded by Nuance Labs.</strong> Your camera stays off, but Nuance Labs may record, log, store and use what you say, including your voice, to run and improve its service and to train its AI models. Before your first call, you are asked to agree to this and to <Ext href={NUANCE_PRIVACY_URL}>Nuance Labs' privacy policy</Ext>. If you do not agree, do not use Nia; the rest of the app still works.</li>
        <li><strong>Do not share sensitive information with her,</strong> such as financial, medical or government ID details, other people's personal information, or anything about a person under 18.</li>
        <li><strong>Limits:</strong> calls last up to 5 minutes, with up to 4 calls an hour and 10 a day. Nuance Labs may end a call that breaks its rules.</li>
        <li><strong>Do not misuse her:</strong> do not try to copy her image or voice, make her say harmful things, or get around her limits.</li>
        <li>These rules, and the disclaimers and limits in sections 7 and 8, also protect Nuance Labs. We may change or switch off Nia at any time.</li>
      </UL>
      <H3>Sessions, recordings and materials</H3>
      <P>
        Recordings, slides, handouts and guides belong to the speakers or to us. They are for your own use. Do not share, post,
        sell or republish them without permission. Recordings hosted on YouTube also play under YouTube's terms.
      </P>
      <H3>Business directory and resource guide</H3>
      <UL>
        <li>Listings were compiled from public information in November 2026. We do not endorse, check or guarantee any business or organization, or its products, services, prices, hours or ownership. Anything you arrange with them is between you and them.</li>
        <li>The resource guide is a list of places to ask for help, not financial, legal or tax advice. Loans cost money, so compare terms before you borrow.</li>
        <li>A business or organization can ask to be added, corrected or removed by writing to <Email />.</li>
      </UL>
      <H3>Businesses and services we mention or link to</H3>
      <UL>
        <li>The app lists, links to or uses businesses, organizations and services that we do not own or control. These include the businesses in the directory, the organizations in the resource guide, Nuance Labs (Nia), YouTube, LinkedIn, Google Maps, and the conference's speakers, sponsors and exhibitors.</li>
        <li>Listing or linking to them is not an endorsement, recommendation, partnership or guarantee. They do not act or speak for us.</li>
        <li>We are not responsible for their products, services, advice, content, prices, availability, conduct, privacy practices or terms, or for any loss or harm that comes from dealing with them. Read their terms and policies before you rely on them.</li>
        <li>Any purchase, loan, contract, appointment or other arrangement you make with them is only between you and them. To the fullest extent the law allows, you release HigherMark Consulting, LLC, the Power Up Women's Conference, and their owners, organizers, volunteers and service providers from claims that arise from those dealings.</li>
      </UL>

      <H2>6. Ending your account</H2>
      <UL>
        <li>You can stop using the app at any time, and delete your account in Settings. Our Privacy Policy says what is deleted and when.</li>
        <li>We may suspend or close an account that breaks these Terms. We may also change or close the app, and will give notice where we reasonably can.</li>
      </UL>

      <H2>7. Disclaimers</H2>
      <P>
        <strong>The app is provided "as is" and "as available", without warranties of any kind, to the fullest extent the law allows.</strong>{" "}
        We do not promise that the app will always be available or free of errors, or that information in it is accurate. That
        includes information from other attendees, from Nia and in the directory and guide.
      </P>
      <P>We are not responsible for what other attendees do, in the app or when you meet them. Use good judgment, and meet new contacts in public places.</P>

      <H2>8. Limit of liability</H2>
      <P>
        To the fullest extent the law allows, HigherMark Consulting, LLC, the Power Up Women's Conference, and their owners,
        organizers, volunteers and service providers (including Nuance Labs) are not liable for anything a third-party business,
        organization or service does or fails to do, or for indirect, incidental, special, consequential or punitive damages, or
        for lost profits, data or goodwill. Our total liability for any claim about the app is limited to $100.
      </P>

      <H2>9. Your responsibility to us</H2>
      <P>
        You agree to defend and indemnify HigherMark Consulting, LLC, the Power Up Women's Conference, their owners, organizers and
        volunteers, and our service providers including Nuance Labs, against claims that arise from your content, your use of the
        app, your breaking these Terms, or your dealings with any business, organization or service listed in or linked from the app.
      </P>

      <H2>10. Governing law and disputes</H2>
      <P>
        Virginia law governs these Terms. If a dispute comes up, contact us first so we can try to settle it informally. If that
        fails, it will be decided in the state or federal courts for Loudoun County, Virginia.
      </P>

      <H2>11. Changes to these terms</H2>
      <P>
        We may update these Terms. For an important change, we will tell you in the app or by email at least 14 days before it
        takes effect, and ask you to agree again.
      </P>

      <H2>12. Contact us</H2>
      <P>{OPERATOR}, for the Power Up Women's Conference. Email: <Email />.</P>
    </>
  );
}

export function PrivacyContent() {
  const rows: [string, string, string][] = [
    ["Name, email address, password (stored only in scrambled, hashed form), conference access code", "To create your account, sign you in and confirm you are registered", "Name: all attendees. Email: only connections, and only if you turn it on. Access code: no other attendee"],
    ["Photo, title, company, bio, tags, LinkedIn link, what you are here for, past Power Up conferences", "To build your profile so others can find you", "All signed-in attendees"],
    ["Phone number", "So connections can reach you", "Only connections, and only if you turn it on"],
    ["Connection requests and connections", "To run the connection system", "You and the other person. A sender is not told when her request is declined"],
    ["Messages", "To deliver them", "You and the person you message"],
    ["Private notes, follow-up dates, saved businesses and resources", "To help you follow up", "Only you"],
    ["Reports you send about another attendee", "To review them and keep the community safe", "The owners. The person reported is not told who reported her"],
    ["When you agreed to these terms and to the AI host's terms", "To keep the records the law and our AI provider require", "No other attendee"],
    ["Number and time of your calls with Nia", "To apply the call limits", "No other attendee"],
    ["Sign-in session records", "To keep you signed in for up to 30 days", "No other attendee"],
    ["Technical logs: the page or action requested, when, whether it worked, and your IP address as recorded by our host", "To keep the app running and secure", "No other attendee"],
  ];
  const providers: [string, string, string][] = [
    ["Netlify", "Hosts the app's pages and server, in the United States", "Every request to the app, including your IP address"],
    ["Supabase", "Stores the app's database, in the United States (US East)", "Everything in the table above"],
    ["Nuance Labs", "Runs Nia, the AI host", "What is described under Nia below, only when you start a call"],
    ["YouTube (Google)", "Plays session recordings hosted on YouTube", "What YouTube collects when you press play, under Google's privacy policy"],
  ];
  const Table = ({ head, body }: { head: [string, string, string]; body: [string, string, string][] }) => (
    <div className="overflow-x-auto mb-4 -mx-1">
      <table className="w-full min-w-[560px] text-sm border-collapse">
        <thead>
          <tr>{head.map((h) => <th key={h} className="text-left font-bold border-b-2 border-border px-2 py-2 align-bottom">{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i} className="border-b border-border px-2 py-2 align-top">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <>
      <H2>Who we are and the short version</H2>
      <P>
        PowerUp Connect is the networking app of the Power Up Women's Conference. It is operated by {OPERATOR}, for the Power Up
        Women's Conference ("we" or "us"). This policy explains what the app collects, who can see it and what you can do about it.
      </P>
      <UL>
        <li>We collect what you give us to build your profile and connect with other attendees, and what the app needs to run.</li>
        <li>We do not sell your information, show ads, or use tracking or advertising cookies.</li>
        <li>Your phone number and email address stay hidden unless you turn them on, and then only your accepted connections see them.</li>
        <li>Your private notes are for you alone.</li>
        <li>If you talk with Nia, the AI host, the call goes to Nuance Labs, which records it and may use it to train its AI. Nia is optional.</li>
      </UL>

      <H2>What we collect and who can see it</H2>
      <Table head={["Information", "Why we use it", "Who can see it"]} body={rows} />
      <P>We do not ask for, and you should not share in the app, financial account numbers, government ID numbers or health information.</P>
      <P>
        <strong>Our own team.</strong> A small number of people who run the app can reach the database. We look at messages, notes
        or accounts only to investigate a report, fix a problem, protect someone's safety or follow the law.
      </P>

      <H2>Who we share it with</H2>
      <P>We share information only as described here. We do not sell or rent it.</P>
      <Table head={["Company", "What it does for the app", "What it receives"]} body={providers} />
      <UL>
        <li><strong>Links to other sites.</strong> Business websites, LinkedIn, Google Maps and resource websites open outside the app. What they collect is covered by their own policies, not this one.</li>
        <li><strong>When the law requires it,</strong> or to protect someone's safety, or to investigate fraud, abuse or a breach of our Terms.</li>
        <li><strong>If the app changes hands,</strong> for example if it moves to another organization running the Power Up Women's Conference, your information would move with it under this policy, and we would tell you first.</li>
      </UL>

      <H2>Nia and Nuance Labs</H2>
      <P>Nia is optional. If you never start a call, nothing about you goes to Nuance Labs.</P>
      <P>
        <strong>What we send when you start a call:</strong> your first name, what you said you are here for, how many past Power Up
        conferences you attended, the conference's published session list, and a scrambled code that stands for your account without
        revealing who you are. We never send your email, phone number, company, messages, notes or connections.
      </P>
      <P><strong>What Nuance Labs receives during the call:</strong> your voice and what you say. Your camera stays off, so it does not see you.</P>
      <P>
        <strong>What Nuance Labs does with it:</strong> under its <Ext href={NUANCE_TERMS_URL}>developer terms</Ext>, Nuance Labs may
        record, log, store and use your conversations to run and improve its service and to train its AI models, including analysis of
        voice features such as tone and pitch. Nuance Labs decides how it uses this information on its own, under its{" "}
        <Ext href={NUANCE_PRIVACY_URL}>privacy policy</Ext>. We cannot delete recordings it holds. To ask Nuance Labs about your data,
        email <a href="mailto:privacy@nuancelabs.ai" className="text-primary underline">privacy@nuancelabs.ai</a>.
      </P>
      <P>
        <strong>Your agreement:</strong> before your first call, the app asks you to agree to this and to Nuance Labs' privacy policy,
        and keeps a record that you agreed. Each call screen repeats the notice. You can withdraw in Settings at any time; we then stop
        offering you calls and tell Nuance Labs.
      </P>

      <H2>Cookies and browser storage</H2>
      <P>
        The app does not use cookies for tracking or advertising, and has no analytics. To keep you signed in, it stores a sign-in key
        in your browser's local storage. Signing out removes it. Playing a YouTube recording lets YouTube set its own cookies.
      </P>

      <H2>Security</H2>
      <UL>
        <li>Passwords are stored only in hashed form, so no one can read them, including us.</li>
        <li>The app uses an encrypted connection (HTTPS), and the database blocks direct public access.</li>
        <li>Profile photos are served from a long, random web address. Anyone who has that address can see the photo, but it cannot be guessed from your name or account.</li>
      </UL>
      <P>No system is perfectly secure. If we learn of a breach that affects your information, we will tell you as the law requires.</P>

      <H2>Keeping and deleting your information</H2>
      <UL>
        <li>We keep your account information while your account is open.</li>
        <li>You can delete your account in Settings. Your profile, photo, connections, requests, notes, saved items, call records and the messages you sent and received are deleted straight away, from both sides of each conversation.</li>
        <li>We keep the record of what you agreed to, without your name, because our AI provider requires it. We keep reports you sent or that name you, without the account link, so we can deal with safety problems.</li>
        <li>Backups and server logs may keep copies for up to 30 days before they are overwritten.</li>
      </UL>

      <H2>Your choices</H2>
      <UL>
        <li>Edit or remove your profile details and photo in Settings at any time.</li>
        <li>Turn your phone number and email address on or off.</li>
        <li>Decline requests, and remove connections.</li>
        <li>Withdraw your agreement for Nia in Settings.</li>
        <li>Ask <Email /> for a copy of your information, or to correct it. We will answer within 45 days.</li>
      </UL>

      <H2>Age</H2>
      <P>The app is for people 18 and older. We do not knowingly collect information from anyone younger. If we learn that someone under 18 has an account, we will delete it.</P>

      <H2>Changes to this policy</H2>
      <P>We will post any change here with a new effective date. For an important change, we will tell you in the app or by email before it takes effect.</P>

      <H2>Contact us</H2>
      <P>{OPERATOR}, for the Power Up Women's Conference. Email: <Email />.</P>
    </>
  );
}
