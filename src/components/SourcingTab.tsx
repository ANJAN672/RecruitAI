import React from 'react';
import {
  Search, Loader2, RefreshCw, ExternalLink, Linkedin,
  Globe, Briefcase, Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { api, safeJson } from '../lib/api';
import { CopyButton } from './shared';
import type { SearchQueries } from '../types';

export function SourcingTab({ jobId }: { jobId: string }) {
  const [queries, setQueries] = React.useState<SearchQueries | null>(null);
  const [loadingCache, setLoadingCache] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [xrayTab, setXrayTab] = React.useState('LinkedIn');

  React.useEffect(() => {
    api(`/api/jobs/${jobId}/boolean-search`)
      .then(r => r.json())
      .then(data => {
        if (data.found) {
          setQueries(data);
          setLoadingCache(false);
        } else if (data.stale) {
          api(`/api/jobs/${jobId}/boolean-search`, { method: 'POST' })
            .then(r => r.json())
            .then(fresh => { if (fresh.found) setQueries(fresh); })
            .catch(() => {})
            .finally(() => setLoadingCache(false));
        } else {
          setLoadingCache(false);
        }
      })
      .catch(() => setLoadingCache(false));
  }, [jobId]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api(`/api/jobs/${jobId}/boolean-search`, { method: 'POST' });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setQueries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const platforms = [
    {
      label: 'LinkedIn', query: queries?.linkedin_boolean ?? '',
      icon: <Linkedin className="w-4 h-4 text-blue-600" />, textColor: 'text-emerald-400',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      btnLabel: 'Search LinkedIn',
      onSearch: () => window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(queries?.linkedin_boolean ?? '')}`, '_blank', 'noopener,noreferrer'),
      hint: null,
    },
    {
      label: 'Naukri', query: queries?.naukri_keywords ?? '',
      icon: <Globe className="w-4 h-4 text-orange-500" />, textColor: 'text-orange-300',
      btnClass: 'bg-orange-500 hover:bg-orange-600 text-white',
      btnLabel: 'Search Naukri',
      onSearch: () => { navigator.clipboard.writeText(queries?.naukri_keywords ?? '').catch(() => {}); window.open('https://resdex.naukri.com/', '_blank', 'noopener,noreferrer'); },
      hint: 'Keywords copied to clipboard — paste in ResdEx search bar.',
    },
    {
      label: 'Indeed', query: queries?.indeed_boolean ?? '',
      icon: <Search className="w-4 h-4 text-indigo-500" />, textColor: 'text-indigo-400',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      btnLabel: 'Search Indeed',
      onSearch: () => window.open(`https://www.indeed.com/jobs?q=${encodeURIComponent(queries?.indeed_boolean ?? '')}`, '_blank', 'noopener,noreferrer'),
      hint: null,
    },
    {
      label: 'Dice', query: queries?.dice_boolean ?? '',
      icon: <Globe className="w-4 h-4 text-red-500" />, textColor: 'text-red-400',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
      btnLabel: 'Search Dice',
      onSearch: () => window.open(`https://www.dice.com/jobs?q=${encodeURIComponent(queries?.dice_boolean ?? '')}`, '_blank', 'noopener,noreferrer'),
      hint: null,
    },
    {
      label: 'CareerBuilder', query: queries?.careerbuilder_boolean ?? '',
      icon: <Briefcase className="w-4 h-4 text-green-600" />, textColor: 'text-emerald-400',
      btnClass: 'bg-green-700 hover:bg-green-800 text-white',
      btnLabel: 'Search CareerBuilder',
      onSearch: () => window.open(`https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(queries?.careerbuilder_boolean ?? '')}`, '_blank', 'noopener,noreferrer'),
      hint: null,
    },
    {
      label: 'Monster', query: queries?.monster_boolean ?? '',
      icon: <Users className="w-4 h-4 text-purple-500" />, textColor: 'text-purple-400',
      btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      btnLabel: 'Search Monster',
      onSearch: () => window.open(`https://www.monster.com/jobs/search/?q=${encodeURIComponent(queries?.monster_boolean ?? '')}`, '_blank', 'noopener,noreferrer'),
      hint: null,
    },
  ];

  const xrayPlatforms = [
    { label: 'LinkedIn', query: queries?.xray_linkedin ?? '', textColor: 'text-blue-400' },
    { label: 'Naukri', query: queries?.xray_naukri ?? '', textColor: 'text-orange-300' },
    { label: 'Indeed', query: queries?.xray_indeed ?? '', textColor: 'text-indigo-400' },
    { label: 'Dice', query: queries?.xray_dice ?? '', textColor: 'text-red-400' },
    { label: 'CareerBuilder', query: queries?.xray_careerbuilder ?? '', textColor: 'text-emerald-400' },
    { label: 'Monster', query: queries?.xray_monster ?? '', textColor: 'text-purple-400' },
  ];

  const activeXray = xrayPlatforms.find(p => p.label === xrayTab) || xrayPlatforms[0];

  return (
    <div className="glass-card p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">Sourcing Toolkit</h4>
          <p className="text-sm text-neutral-500 mt-1">Boolean searches for LinkedIn, Naukri, Indeed, Dice, CareerBuilder, Monster + Google X-ray.</p>
        </div>
        <button onClick={generate} disabled={generating || loadingCache} className="btn-primary">
          {generating
            ? <Loader2 className="animate-spin mr-2 h-4 w-4" />
            : queries ? <RefreshCw className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
          {generating ? 'Generating...' : queries ? 'Regenerate' : 'Generate Queries'}
        </button>
      </div>

      {error && <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>}

      {loadingCache && <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>}

      {!queries && !loadingCache && (
        <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
          <Search className="mx-auto h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Click generate to build optimized search queries.</p>
        </div>
      )}

      {queries && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Direct Platform Searches</p>

          {platforms.map(({ label, query, icon, textColor, btnClass, btnLabel, onSearch, hint }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-sm font-medium text-neutral-800">{label}{label === 'Naukri' ? ' Keywords' : ' Boolean'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={query} />
                  <button
                    onClick={onSearch}
                    disabled={!query}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 ${btnClass}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {btnLabel}
                  </button>
                </div>
              </div>
              {hint && <p className="text-xs text-neutral-400 mb-2">{hint}</p>}
              <div className="bg-neutral-900 rounded-2xl p-4 overflow-x-auto">
                <code className={`${textColor} text-sm font-mono leading-relaxed whitespace-pre-wrap break-words`}>
                  {query || 'Regenerate to get query'}
                </code>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Google X-ray Searches</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {xrayPlatforms.map(p => (
                <button
                  key={p.label}
                  onClick={() => setXrayTab(p.label)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${xrayTab === p.label ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="bg-neutral-900 rounded-2xl p-4 overflow-x-auto mb-2">
              <code className={`${activeXray.textColor} text-sm font-mono leading-relaxed whitespace-pre-wrap break-words`}>
                {activeXray.query || 'Regenerate to get query'}
              </code>
            </div>
            <div className="flex justify-end gap-2">
              {activeXray.query && <CopyButton text={activeXray.query} />}
              <button
                onClick={() => activeXray.query && window.open(`https://www.google.com/search?q=${encodeURIComponent(activeXray.query)}`, '_blank', 'noopener,noreferrer')}
                disabled={!activeXray.query}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-40"
              >
                <ExternalLink className="w-3 h-3" />
                Search Google
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
