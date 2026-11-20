import { Check } from "lucide-react";

interface ChipSelectProps<T extends string | number> {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  /** Accessible name for the group, e.g. "Conferences attended". */
  label: string;
  testIdPrefix: string;
}

/** A row of toggle chips for picking any number of options. */
export function ChipSelect<T extends string | number>({ options, value, onChange, label, testIdPrefix }: ChipSelectProps<T>) {
  function toggle(option: T) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(option)}
            data-testid={`${testIdPrefix}-${String(option).toLowerCase().replace(/\s+/g, "-")}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 min-h-[40px] text-sm font-semibold hover-elevate active-elevate-2 ${
              on ? "pu-purple text-white border-transparent shadow-sm" : "border-border bg-card text-foreground"
            }`}
          >
            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
