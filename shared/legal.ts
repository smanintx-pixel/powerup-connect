// Versions of what attendees agree to. Bump a version when the text changes in a
// way people must agree to again; the app then asks everyone to agree afresh.
export const TERMS_VERSION = "2026-11-19-beta";
export const HOST_CONSENT_VERSION = "2026-11-19";

// Nuance Labs does not offer its service to residents of these places
// (Nuance API Developer Agreement, section 2.3(a)(xix)).
export const HOST_RESTRICTED_REGIONS = ["Colorado", "Connecticut", "Illinois", "Texas", "Quebec"] as const;

export const NUANCE_PRIVACY_URL = "https://app.nuancelabs.ai/privacy";

// Where attendees write to us. Empty until the owners choose an address.
export const LEGAL_CONTACT_EMAIL = "";

export const REPORT_REASONS = [
  "Harassment or threats",
  "Spam or unwanted selling",
  "Fake account or impersonation",
  "Inappropriate content",
  "Something else",
] as const;
