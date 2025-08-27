"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

export type TemplatePage = {
  pageNumber: number;
  text: string;
  imageDescription: string;
  isTitle?: boolean;
  isDedication?: boolean;
  raw?: any;
};

export function parseAgeToLowerBound(age: string | number | null | undefined, fallback = 5): number {
  if (typeof age === 'number' && Number.isFinite(age)) return age;
  const m = String(age ?? '').match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function useTemplatePages(params: { seriesKey?: string | null; pageCount?: number | null; age?: string | number | null; storyId?: string | null }) {
  const { seriesKey, pageCount, age, storyId } = params;
  const [pages, setPages] = useState<TemplatePage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ageNum = useMemo(() => parseAgeToLowerBound(age), [age]);

  useEffect(() => {
    if (!seriesKey && !storyId) {
      setPages([]);
      setError(null);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ includePages: 'true', age: String(ageNum) });
        if (storyId) qs.set('storyId', String(storyId));
        if (!storyId && seriesKey) qs.set('seriesKey', String(seriesKey));
        if (!storyId && Number.isFinite(pageCount as number) && (pageCount as number)!) {
          qs.set('pageCount', String(pageCount));
        }
        const resp = await fetch(`/api/templates/by-series?${qs.toString()}`, { signal: ctl.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        console.log('loaded with pages3', json);
        const arr: TemplatePage[] = Array.isArray(json?.pages)
          ? json.pages.map((r: any) => ({
              pageNumber: Number(r.pageNumber),
              text: String(r.text || ''),
              imageDescription: String(r.imageDescription || ''),
              isTitle: Boolean(r.isTitle || r.is_title_page),
              isDedication: Boolean(r.isDedication || r.is_dedication),
              raw: r,
            }))
          : [];
        setPages(arr.filter((p) => Number.isFinite(p.pageNumber)));
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to fetch pages');
        setPages([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctl.abort();
  }, [seriesKey, pageCount, ageNum, storyId]);

  return { pages, loading, error };
}
