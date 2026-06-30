"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { MicIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p && setGoogleEnabled(!!p.google))
      .catch(() => {});
  }, []);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Those credentials didn't match. Try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  function skip() {
    document.cookie = "relay_guest=1; path=/; max-age=2592000; samesite=lax";
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-[13px] bg-primary">
            <MicIcon size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="m-0 text-[22px] font-bold tracking-[-.3px]">Welcome to Relay</h1>
          <p className="m-0 mt-1.5 text-[13.5px] text-slate-400">Voice notes in, polished email out.</p>
        </div>

        <div className="rounded-[16px] border border-line bg-white p-7 shadow-[0_8px_30px_rgba(16,36,43,.06)]">
          <form onSubmit={onCredentials} className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
                className="h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-11 w-full rounded-[10px] border border-line bg-white px-3.5 text-sm"
              />
            </div>
            {error && (
              <div role="alert" className="rounded-[9px] bg-warn-bg px-3 py-2 text-[13px] font-medium text-warn-ink">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-11 cursor-pointer rounded-[10px] border-none bg-primary text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[.5px] text-faint">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            onClick={() => signIn("google", { redirectTo: "/" })}
            disabled={!googleEnabled}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[10px] border border-line bg-white text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            data-tip={googleEnabled ? undefined : "Set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET to enable"}
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        <button
          onClick={skip}
          className="mx-auto mt-5 block cursor-pointer border-none bg-transparent text-[13px] font-semibold text-slate-400 hover:text-primary"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
