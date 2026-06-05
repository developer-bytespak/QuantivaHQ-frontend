"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  affiliateSendCode,
  affiliateSignup,
  affiliateVerifyCode,
  setAffiliateTokens,
  type AffiliateChannel,
} from "@/lib/api/affiliate";
import {
  AFFILIATE_CHANNEL_LABELS,
  AFFILIATE_CHANNELS,
  affiliateSignupSchema,
} from "@/lib/validation/affiliate";
import { getCountries, type CountryOption } from "@/lib/utils/countries";

interface ChannelRow {
  type: AffiliateChannel;
  url: string;
  customName: string;
}

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    fullName: "",
    country: "",
    taxResidency: "",
    audienceSize: "",
    pitch: "",
    termsAccepted: false,
  });
  const [channels, setChannels] = useState<ChannelRow[]>([
    { type: "YOUTUBE", url: "", customName: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Email verification (required before submit) ──
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);

  const emailNormalized = form.email.trim().toLowerCase();
  const emailVerified =
    verifiedEmail !== null && verifiedEmail === emailNormalized;
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized);

  useEffect(() => {
    getCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const onEmailChange = (value: string) => {
    update("email", value);
    // Any edit invalidates a previously-sent/verified code.
    setCodeSent(false);
    setCode("");
    setVerifiedEmail(null);
    setCodeNotice(null);
  };

  const handleSendCode = async () => {
    setError(null);
    setCodeNotice(null);
    if (!emailLooksValid) {
      setError("Enter a valid email before requesting a code");
      return;
    }
    setSendingCode(true);
    try {
      await affiliateSendCode(emailNormalized);
      setCodeSent(true);
      setCodeNotice("We sent a 6-digit code to your email. It expires in 10 minutes.");
    } catch (err: unknown) {
      setError(extractMessage(err, "Could not send verification code"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setCodeNotice(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setVerifyingCode(true);
    try {
      await affiliateVerifyCode(emailNormalized, code.trim());
      setVerifiedEmail(emailNormalized);
      setCodeNotice("Email verified — you can finish your application.");
    } catch (err: unknown) {
      setError(extractMessage(err, "Invalid or expired code"));
    } finally {
      setVerifyingCode(false);
    }
  };

  const updateChannel = (
    i: number,
    patch: Partial<ChannelRow>,
  ) =>
    setChannels((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );

  const addChannel = () =>
    setChannels((prev) =>
      prev.length >= 10
        ? prev
        : [...prev, { type: "YOUTUBE", url: "", customName: "" }],
    );

  const removeChannel = (i: number) =>
    setChannels((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i),
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailVerified) {
      setError("Please verify your email before submitting");
      return;
    }

    if (channels.length === 0) {
      setError("Add at least one channel");
      return;
    }

    const [primary, ...rest] = channels;
    const audienceNum = form.audienceSize
      ? Number(form.audienceSize)
      : undefined;

    const parsed = affiliateSignupSchema.safeParse({
      ...form,
      primaryChannel: primary.type,
      primaryChannelCustomName: primary.customName || undefined,
      channelUrl: primary.url || undefined,
      additionalChannels: rest.map((c) => ({
        type: c.type,
        url: c.url || undefined,
        customName: c.customName || undefined,
      })),
      audienceSize:
        audienceNum != null && !Number.isNaN(audienceNum)
          ? audienceNum
          : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const res = await affiliateSignup({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.displayName,
        fullName: parsed.data.fullName,
        country: parsed.data.country || undefined,
        taxResidency: parsed.data.taxResidency || undefined,
        primaryChannel: parsed.data.primaryChannel,
        primaryChannelCustomName:
          parsed.data.primaryChannelCustomName || undefined,
        channelUrl: parsed.data.channelUrl || undefined,
        additionalChannels:
          parsed.data.additionalChannels.length > 0
            ? parsed.data.additionalChannels.map((c) => ({
                type: c.type,
                url: c.url || undefined,
                customName: c.customName || undefined,
              }))
            : undefined,
        audienceSize: parsed.data.audienceSize ?? undefined,
        pitch: parsed.data.pitch,
      });
      setAffiliateTokens(res.accessToken, res.refreshToken);
      router.replace("/affiliate/pending");
    } catch (err: unknown) {
      setError(extractMessage(err, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#050a12] px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white">
            Apply to the Affiliate Program
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tell us about you and your audience. A team member will review your
            application; you&apos;ll be able to track its status here.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Email">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      className={inputCls}
                      placeholder="you@example.com"
                      disabled={emailVerified}
                    />
                    {emailVerified ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!emailLooksValid || sendingCode}
                        className="shrink-0 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-[#fc4f02] hover:text-[#fc4f02] disabled:opacity-40"
                      >
                        {sendingCode
                          ? "Sending…"
                          : codeSent
                            ? "Resend code"
                            : "Send code"}
                      </button>
                    )}
                  </div>
                </Field>

                {codeSent && !emailVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className={inputCls}
                      placeholder="6-digit code"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={code.trim().length !== 6 || verifyingCode}
                      className="shrink-0 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {verifyingCode ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                )}

                {codeNotice && (
                  <p className="mt-2 text-xs text-emerald-300/90">{codeNotice}</p>
                )}
              </div>
              <Field label="Display name">
                <input
                  value={form.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  className={inputCls}
                  placeholder="alexcrypto"
                />
              </Field>
              <Field label="Full legal name">
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={inputCls}
                  placeholder="Alex Doe"
                />
              </Field>
              <Field label="Country">
                <select
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tax residency">
                <select
                  value={form.taxResidency}
                  onChange={(e) => update("taxResidency", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select tax residency</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Audience size (approx.)">
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.audienceSize}
                  onChange={(e) => update("audienceSize", e.target.value)}
                  className={inputCls}
                  placeholder="50000"
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={inputCls}
                  placeholder="At least 8 characters"
                />
              </Field>
              <Field label="Confirm password">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Channels */}
            <div className="rounded-lg border border-slate-800/80 bg-[#070d17] p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Channels you&apos;ll promote on
                  </p>
                  <p className="text-xs text-slate-500">
                    The first is your primary. Add up to 10.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addChannel}
                  disabled={channels.length >= 10}
                  className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-[#fc4f02] hover:text-[#fc4f02] disabled:opacity-40"
                >
                  + Add channel
                </button>
              </div>

              <div className="space-y-3">
                {channels.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-slate-800/80 bg-[#0b1220] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500">
                        {i === 0 ? "Primary channel" : `Channel ${i + 1}`}
                      </span>
                      {channels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChannel(i)}
                          className="text-xs text-slate-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Type">
                        <select
                          value={c.type}
                          onChange={(e) =>
                            updateChannel(i, {
                              type: e.target.value as AffiliateChannel,
                              // Wipe customName when leaving OTHER, so it doesn't
                              // submit stale text the user can no longer see.
                              customName:
                                e.target.value === "OTHER" ? c.customName : "",
                            })
                          }
                          className={inputCls}
                        >
                          {AFFILIATE_CHANNELS.map((t) => (
                            <option key={t} value={t}>
                              {AFFILIATE_CHANNEL_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="URL (optional)">
                        <input
                          value={c.url}
                          onChange={(e) =>
                            updateChannel(i, { url: e.target.value })
                          }
                          className={inputCls}
                          placeholder="https://…"
                        />
                      </Field>
                      {c.type === "OTHER" && (
                        <div className="sm:col-span-2">
                          <Field label="Channel name">
                            <input
                              value={c.customName}
                              onChange={(e) =>
                                updateChannel(i, {
                                  customName: e.target.value,
                                })
                              }
                              className={inputCls}
                              placeholder="e.g. Mighty Networks community"
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Field label="How will you promote QuantivaHQ? (max 250 chars)">
              <textarea
                value={form.pitch}
                onChange={(e) => update("pitch", e.target.value)}
                rows={3}
                maxLength={250}
                className={inputCls}
                placeholder="A short pitch on your content style, audience, and how you'd introduce QuantivaHQ..."
              />
              <div className="mt-1 text-right text-[11px] text-slate-500">
                {form.pitch.length} / 250
              </div>
            </Field>

            <label className="flex items-start gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => update("termsAccepted", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-600 bg-[#070d17] text-[#fc4f02] focus:ring-[#fc4f02]"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-[#fc4f02] hover:underline"
                  target="_blank"
                >
                  Affiliate Terms
                </Link>{" "}
                and confirm the information above is accurate.
              </span>
            </label>

            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !emailVerified}
              className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : emailVerified
                  ? "Submit application"
                  : "Verify your email to submit"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already applied?{" "}
            <Link
              href="/affiliate/login"
              className="font-semibold text-[#fc4f02] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  const message =
    (err as { response?: { data?: { message?: string } }; message?: string })
      ?.response?.data?.message ??
    (err as { message?: string })?.message ??
    fallback;
  return Array.isArray(message) ? message.join(", ") : String(message);
}

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-[#070d17] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
