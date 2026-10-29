import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_CODES } from "@/lib/phoneUtils";
import {
  RESOURCE_CONSENT_TEXT,
  RESOURCE_PRIVACY_POLICY_PATH,
  TURNOVER_OPTIONS,
  type ResourceAccessErrors,
  type ResourceAccessValues,
} from "@/lib/resourceAccess";
import { cn } from "@/lib/utils";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

export function ResourceAccessFields({
  values,
  errors,
  onChange,
  idPrefix = "ra",
}: {
  values: ResourceAccessValues;
  errors: ResourceAccessErrors;
  onChange: (v: ResourceAccessValues) => void;
  idPrefix?: string;
}) {
  const set = <K extends keyof ResourceAccessValues>(k: K, val: ResourceAccessValues[K]) =>
    onChange({ ...values, [k]: val });
  const field = (k: keyof ResourceAccessValues) => cn("mt-1.5 h-11", errors[k] && "border-destructive");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}-first`}>First name *</Label>
          <Input id={`${idPrefix}-first`} autoComplete="given-name" maxLength={60}
            value={values.firstName} onChange={(e) => set("firstName", e.target.value)} className={field("firstName")} />
          <Err msg={errors.firstName} />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-last`}>Last name *</Label>
          <Input id={`${idPrefix}-last`} autoComplete="family-name" maxLength={60}
            value={values.lastName} onChange={(e) => set("lastName", e.target.value)} className={field("lastName")} />
          <Err msg={errors.lastName} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-company`}>Company name *</Label>
        <Input id={`${idPrefix}-company`} autoComplete="organization" maxLength={120}
          value={values.company} onChange={(e) => set("company", e.target.value)} className={field("company")} />
        <Err msg={errors.company} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-turnover`}>Annual company turnover *</Label>
        <Select value={values.turnover} onValueChange={(v) => set("turnover", v)}>
          <SelectTrigger id={`${idPrefix}-turnover`} aria-label="Annual company turnover"
            className={cn("mt-1.5 h-11", errors.turnover && "border-destructive")}>
            <SelectValue placeholder="Select annual turnover (AUD)" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px]">
            {TURNOVER_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Err msg={errors.turnover} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-mobile`}>Mobile number *</Label>
        <div className="mt-1.5 flex gap-2">
          <Select value={values.countryCode} onValueChange={(v) => set("countryCode", v)}>
            <SelectTrigger className="h-11 w-[110px] shrink-0" aria-label="Country code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              {COUNTRY_CODES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} {c.dialCode}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input id={`${idPrefix}-mobile`} type="tel" inputMode="tel" autoComplete="tel-national"
            placeholder={COUNTRY_CODES.find((c) => c.code === values.countryCode)?.placeholder}
            value={values.mobile} onChange={(e) => set("mobile", e.target.value)}
            className={cn("h-11", errors.mobile && "border-destructive")} />
        </div>
        <Err msg={errors.mobile} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-email`}>Work email *</Label>
        <Input id={`${idPrefix}-email`} type="email" autoComplete="email" placeholder="you@company.com" maxLength={255}
          value={values.email} onChange={(e) => set("email", e.target.value)} className={field("email")} />
        <Err msg={errors.email} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-consent`} className="flex cursor-pointer items-start gap-3 py-1 text-xs leading-relaxed text-muted-foreground">
          <Checkbox id={`${idPrefix}-consent`} checked={values.consent}
            onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5 h-5 w-5" />
          <span>
            {RESOURCE_CONSENT_TEXT.split("Privacy Policy")[0]}
            <Link to={RESOURCE_PRIVACY_POLICY_PATH} className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
            {RESOURCE_CONSENT_TEXT.split("Privacy Policy")[1]}
          </span>
        </label>
        <Err msg={errors.consent} />
      </div>
    </div>
  );
}
