import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChipSelect } from "@/components/chip-select";
import { PowerBadge } from "@/components/power-badge";
import { CONFERENCE_YEARS, INTEREST_OPTIONS } from "@shared/event";

export interface ProfileExtrasValue {
  phone: string;
  phoneVisible: boolean;
  emailVisible: boolean;
  interests: string[];
  pastYears: number[];
}

interface ProfileExtrasProps {
  value: ProfileExtrasValue;
  onChange: (next: ProfileExtrasValue) => void;
  /** Show the past-conference picker (it is asked at sign-up, so set-up skips it). */
  showPastYears?: boolean;
  /** Her sign-in email, shown next to its visibility switch. */
  email?: string;
  idPrefix: string;
}

/** Returns a message if the phone number is not usable, otherwise null. */
export function phoneProblem(phone: string): string | null {
  const v = phone.trim();
  if (!v) return null;
  if (v.length > 24) return "That phone number is too long.";
  if (!/^[0-9+().\-\s]*$/.test(v)) return "Use digits, spaces and + ( ) - . only.";
  if (v.replace(/\D/g, "").length < 7) return "Enter a full phone number.";
  return null;
}

/** "I'm here for", contact details with their visibility switches, and past conferences. */
export function ProfileExtras({ value, onChange, showPastYears, email, idPrefix }: ProfileExtrasProps) {
  const problem = phoneProblem(value.phone);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-1">I&rsquo;m here for</p>
        <p className="text-xs text-muted-foreground mb-2.5">
          Pick any that fit. This shows on your profile so others know what you&rsquo;re looking for.
        </p>
        <ChipSelect
          options={INTEREST_OPTIONS}
          value={value.interests as (typeof INTEREST_OPTIONS)[number][]}
          onChange={(interests) => onChange({ ...value, interests })}
          label="What I'm here for"
          testIdPrefix="chip-interest"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium mb-2 block">
          Phone number (optional)
        </label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(703) 555-0123"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          aria-invalid={problem ? true : undefined}
          aria-describedby={`${idPrefix}-phone-help`}
          data-testid="input-phone"
        />
        {problem && (
          <p className="text-sm text-destructive mt-1.5" role="alert" data-testid="text-phone-error">
            {problem}
          </p>
        )}
        <div className="flex items-start gap-3 mt-3">
          <Switch
            id={`${idPrefix}-phone-visible`}
            checked={value.phoneVisible}
            onCheckedChange={(phoneVisible) => onChange({ ...value, phoneVisible })}
            data-testid="switch-phone-visible"
          />
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-phone-visible`} className="text-sm font-medium block">
              Show my phone number on my profile
            </label>
            <p id={`${idPrefix}-phone-help`} className="text-xs text-muted-foreground">
              {value.phoneVisible
                ? "On. Only women you have accepted as connections can see it."
                : "Off. No one else sees your number."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <Switch
            id={`${idPrefix}-email-visible`}
            checked={value.emailVisible}
            onCheckedChange={(emailVisible) => onChange({ ...value, emailVisible })}
            aria-describedby={`${idPrefix}-email-help`}
            data-testid="switch-email-visible"
          />
          <div className="min-w-0">
            <label htmlFor={`${idPrefix}-email-visible`} className="text-sm font-medium block">
              Show my email address on my profile
            </label>
            <p id={`${idPrefix}-email-help`} className="text-xs text-muted-foreground break-words">
              {value.emailVisible
                ? `On. Only women you have accepted as connections can see ${email || "it"}.`
                : `Off. No one else sees ${email || "your email"}.`}
            </p>
          </div>
        </div>
      </div>

      {showPastYears && (
        <div>
          <p className="text-sm font-medium mb-1">Past Power Up conferences attended</p>
          <p className="text-xs text-muted-foreground mb-2.5">
            Two or more makes you a Power Up All-Star. Four or more, a Power Legend.
          </p>
          <ChipSelect
            options={CONFERENCE_YEARS}
            value={value.pastYears as (typeof CONFERENCE_YEARS)[number][]}
            onChange={(pastYears) => onChange({ ...value, pastYears })}
            label="Past Power Up conferences attended"
            testIdPrefix="chip-year"
          />
          <div className="mt-3">
            <PowerBadge pastYears={value.pastYears} />
          </div>
        </div>
      )}
    </div>
  );
}
