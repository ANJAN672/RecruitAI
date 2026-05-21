import React from 'react';
import { Loader2, RefreshCw, TrendingUp, DollarSign, BookOpen, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { api, safeJson } from '../lib/api';
import type { MarketIntel } from '../types';

export function MarketIntelligenceTab({ jobId }: { jobId: string }) {
  const [data, setData] = React.useState<MarketIntel | null>(null);
  const [loadingCache, setLoadingCache] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api(`/api/jobs/${jobId}/market-intelligence`)
      .then(r => r.json())
      .then(json => {
        if (json.found) {
          setData(json);
          setLoadingCache(false);
        } else if (json.stale) {
          api(`/api/jobs/${jobId}/market-intelligence`, { method: 'POST' })
            .then(r => r.json())
            .then(fresh => { if (fresh.found) setData(fresh); })
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
      const res = await api(`/api/jobs/${jobId}/market-intelligence`, { method: 'POST' });
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">Market Intelligence</h4>
          <p className="text-sm text-neutral-500 mt-1">Salary benchmarks and training resources for this role.</p>
        </div>
        <button onClick={generate} disabled={generating || loadingCache} className="btn-primary flex-shrink-0">
          {generating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : data ? <RefreshCw className="mr-2 h-4 w-4" /> : <TrendingUp className="mr-2 h-4 w-4" />}
          {generating ? 'Generating...' : data ? 'Regenerate' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>}

      {loadingCache && <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>}

      {!data && !loadingCache && !generating && (
        <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
          <TrendingUp className="mx-auto h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Generate market intelligence to see salary benchmarks and training resources.</p>
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <h5 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Salary Benchmarks
            </h5>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">India</p>
                <p className="text-xl font-semibold text-emerald-800">{data.salary?.india || '--'}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">United States</p>
                <p className="text-xl font-semibold text-blue-800">{data.salary?.us || '--'}</p>
              </div>
            </div>
            {data.salary?.global_note && (
              <p className="text-xs text-neutral-500 mt-2 px-1">{data.salary.global_note}</p>
            )}
          </div>

          {data.demand && (
            <div>
              <h5 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Market Demand
              </h5>
              <p className="text-sm text-neutral-600 leading-relaxed bg-blue-50/50 border border-blue-100/50 rounded-2xl px-4 py-3">{data.demand}</p>
            </div>
          )}

          {data.training?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" /> Academic & Professional Institutions
              </h5>
              <div className="space-y-2">
                {data.training.map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3.5 bg-white border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 leading-snug">{t.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {t.provider}
                        {t.location && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${t.location === 'India' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{t.location}</span>}
                      </p>
                    </div>
                    {t.url && (
                      <button onClick={() => window.open(t.url, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0 mt-0.5">
                        Visit <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
