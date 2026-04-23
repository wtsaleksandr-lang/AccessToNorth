import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePageMeta } from "@/hooks/use-page-meta";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "radio" | "number" | "date";
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: { value: string; label: string }[];
}
interface FormSection {
  heading: string;
  body?: string;
  fields: FormField[];
}
interface FormSchema {
  serviceKey: string;
  title: string;
  intro: string;
  sections: FormSection[];
}
interface OnboardingData {
  submissionId: string;
  serviceKey: string;
  serviceName: string;
  status: string;
  submittedAt: string | null;
  responses: Record<string, any>;
  form: FormSchema;
}

export default function OnboardingIntake() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<OnboardingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  usePageMeta({
    title: "Service Intake | AccessToNorth.com",
    description: "Complete your post-purchase intake form.",
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/onboarding/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((d: OnboardingData) => {
        setData(d);
        setResponses(d.responses ?? {});
        setSubmitted(d.status === "submitted" || d.status === "processed");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const missing = useMemo(() => {
    if (!data) return [];
    const missingKeys: string[] = [];
    for (const section of data.form.sections) {
      for (const field of section.fields) {
        if (field.required && !responses[field.key]) missingKeys.push(field.label);
      }
    }
    return missingKeys;
  }, [data, responses]);

  async function save(finalize: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, finalize }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      if (finalize) setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  if (error && !data) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Can't open this intake link</h2>
              <p className="text-sm text-slate-600">{error}</p>
              <p className="text-xs text-slate-500 mt-4">
                If this link was sent to you in an email, it may have expired. Contact operations@accesstonorth.com.
              </p>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  if (submitted) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto">
          <Card className="border-emerald-200">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Thank you — intake received</h2>
              <p className="text-sm text-slate-600 mb-4">
                We've recorded your responses for <strong>{data.serviceName}</strong>. Next step: we'll send
                the authorization form (e.g. CRA RC59-B) for e-signature within one business day, then begin
                preparing your filing.
              </p>
              <p className="text-xs text-slate-500">
                You can track progress any time in your <a href="/portal" className="underline text-primary">client portal</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          Service intake
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 mb-2">
          {data.form.title}
        </h1>
        <p className="text-sm text-slate-600 mb-6">{data.form.intro}</p>

        <Card className="border-blue-100 bg-blue-50/40 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700">
              <strong>Confidential.</strong> Your responses are stored encrypted and used only to prepare
              your engagement. You can save progress and return to this page with the original email link.
            </p>
          </CardContent>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
          className="space-y-8"
        >
          {data.form.sections.map((section) => (
            <Card key={section.heading}>
              <CardContent className="p-6">
                <h2 className="text-base font-bold text-slate-900 mb-1">{section.heading}</h2>
                {section.body && <p className="text-sm text-slate-500 mb-4">{section.body}</p>}
                <div className="space-y-4 mt-4">
                  {section.fields.map((field) => (
                    <Field
                      key={field.key}
                      field={field}
                      value={responses[field.key] ?? ""}
                      onChange={(v) => setResponses((r) => ({ ...r, [field.key]: v }))}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {missing.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              <strong>Required fields:</strong> {missing.join(", ")}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => save(false)}
              disabled={saving}
              data-testid="button-save-progress"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save progress
            </Button>
            <Button
              type="submit"
              disabled={saving || missing.length > 0}
              data-testid="button-submit-intake"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit intake
            </Button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            By submitting, you confirm the information is accurate to the best of your knowledge. We may
            follow up by email if anything needs clarification.
          </p>
        </form>
      </div>
    </Shell>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: any;
  onChange: (v: any) => void;
}) {
  const reqMark = field.required ? <span className="text-red-500">*</span> : null;

  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        <Label htmlFor={field.key}>{field.label} {reqMark}</Label>
        <Textarea
          id={field.key}
          rows={3}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`field-${field.key}`}
        />
        {field.helper && <p className="text-xs text-slate-500">{field.helper}</p>}
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label htmlFor={field.key}>{field.label} {reqMark}</Label>
        <select
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid={`field-${field.key}`}
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {field.helper && <p className="text-xs text-slate-500">{field.helper}</p>}
      </div>
    );
  }
  if (field.type === "radio") {
    return (
      <div className="space-y-1">
        <Label>{field.label} {reqMark}</Label>
        <div className="space-y-1.5">
          {(field.options ?? []).map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={field.key}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                data-testid={`field-${field.key}-${opt.value}`}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {field.helper && <p className="text-xs text-slate-500">{field.helper}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label htmlFor={field.key}>{field.label} {reqMark}</Label>
      <Input
        id={field.key}
        type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "date" ? "date" : "text"}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`field-${field.key}`}
      />
      {field.helper && <p className="text-xs text-slate-500">{field.helper}</p>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
