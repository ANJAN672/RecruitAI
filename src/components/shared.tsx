import React from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

// ── Copy Button ──────────────────────────────────────────────────────────

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
      } ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Skills List ──────────────────────────────────────────────────────────

export function SkillsList({ skills, variant = 'blue', max = 4 }: { skills: string[]; variant?: string; max?: number }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!skills.length) return null;
  const shown = expanded ? skills : skills.slice(0, max);
  const hidden = skills.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s, i) => <span key={i} className={`badge badge-${variant} text-xs`}>{s}</span>)}
      {!expanded && hidden > 0 && (
        <button onClick={() => setExpanded(true)} className="badge text-xs hover:bg-neutral-200 transition-colors cursor-pointer">
          +{hidden} more
        </button>
      )}
      {expanded && hidden > 0 && (
        <button onClick={() => setExpanded(false)} className="badge text-xs hover:bg-neutral-200 transition-colors cursor-pointer">
          show less
        </button>
      )}
    </div>
  );
}

// ── Password Rules ───────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordRules({ password }: { password: string }) {
  if (!password) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-neutral-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${ok ? 'bg-emerald-100' : 'bg-neutral-100'}`}>
              {ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 block" />}
            </div>
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(r => r.test(password));
}

// ── OAuth Icons ──────────────────────────────────────────────────────────

export function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Score Badge ──────────────────────────────────────────────────────────

export function scoreColorClass(score: number): string {
  if (score >= 80) return 'badge-green';
  if (score >= 60) return 'badge-yellow';
  return 'badge-red';
}

// ── Rank Badge ──────────────────────────────────────────────────────────

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">#1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold">#2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">#3</span>;
  if (rank <= 10) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">#{rank}</span>;
  return null;
}
