'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TemplatePlaceholder } from '@/lib/types/placeholders';

type Values = Record<string, string>;

export function PlaceholdersForm({
  storyId,
  excludeKeys = [],
  initialValues,
  onChange,
}: {
  storyId: string | undefined;
  excludeKeys?: string[];
  initialValues?: Values;
  onChange?: (values: Values) => void;
}) {
  const [placeholdersRaw, setPlaceholdersRaw] = useState<TemplatePlaceholder[]>([]);
  const [values, setValues] = useState<Values>({});
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const excludeSet = useMemo(() => new Set(excludeKeys || []), [excludeKeys]);
  const placeholders = useMemo(
    () => placeholdersRaw.filter((p) => !excludeSet.has(p.key)),
    [placeholdersRaw, excludeSet]
  );
  const didInit = useRef(false);
  const fetchedFor = useRef<string | null>(null);
  const debounceTimer = useRef<any>(null);
  const lastSaved = useRef<string>('');

  useEffect(() => {
    if (!storyId) return;
    if (fetchedFor.current === storyId) return; // Already loaded for this story
    fetchedFor.current = storyId;

    // 1) Try local cache first
    try {
      const cacheKey = `placeholders_cache:${storyId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: TemplatePlaceholder[] = JSON.parse(cached);
        setPlaceholdersRaw(parsed);
        return; // Use cached copy; no fetch
      }
    } catch {}

    // 2) Fallback to server fetch once, then cache
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`/api/templates/placeholders?storyId=${encodeURIComponent(storyId)}`, { cache: 'no-store' });
        const json = await resp.json();
        const list: TemplatePlaceholder[] = json?.placeholders || [];
        if (!cancelled) {
          setPlaceholdersRaw(list);
          try { sessionStorage.setItem(`placeholders_cache:${storyId}`, JSON.stringify(list)); } catch {}
        }
      } catch (e) {
        console.warn('Failed to load placeholders', e);
      }
    })();
    return () => { cancelled = true; };
  }, [storyId]);

  useEffect(() => {
    // Initialize from defaults + provided initialValues once, or when placeholder keys change
    const keys = placeholders.map((p) => p.key).join('|');
    if (!didInit.current || Object.keys(values).length === 0) {
      const base: Values = {};
      for (const p of placeholders) {
        base[p.key] = (initialValues && initialValues[p.key]) ?? (p.default_value || '');
      }
      setValues(base);
      didInit.current = true;
    } else {
      // If new keys appear, add them with defaults
      const missing = placeholders.filter((p) => !(p.key in values));
      if (missing.length) {
        setValues((v) => {
          const copy = { ...v };
          for (const p of missing) copy[p.key] = p.default_value || '';
          return copy;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholders]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Notify parent using latest reference
      onChangeRef.current?.(values);
      // Persist to sessionStorage if changed
      try {
        const json = JSON.stringify(values || {});
        if (json !== lastSaved.current) {
          const raw = sessionStorage.getItem('placeholder_values');
          const prev = raw ? JSON.parse(raw) : {};
          sessionStorage.setItem('placeholder_values', JSON.stringify({ ...prev, ...values }));
          lastSaved.current = json;
        }
      } catch {}
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [values]);

  if (!storyId) return null;
  if (!placeholders.length) return null;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {placeholders.map((p) => {
            const value = values[p.key] || '';
            const isDedication = p.key === 'dedication';
            const wordCount = isDedication ? (value.trim() ? value.trim().split(/\s+/).length : 0) : 0;
            const DEDICATION_WORD_LIMIT = 100;
            const overLimit = isDedication && wordCount > DEDICATION_WORD_LIMIT;
            const handleTextChange = (raw: string) => {
              if (!isDedication) return raw;
              // Enforce 50-word limit by trimming input
              const words = raw.trim().split(/\s+/).filter(Boolean);
              if (words.length <= DEDICATION_WORD_LIMIT) return raw;
              return words.slice(0, DEDICATION_WORD_LIMIT).join(' ');
            };
            return (
              <div key={p.key}>
                <Label htmlFor={`ph-${p.key}`} className="text-base font-medium">
                  {p.label} {p.required ? '*' : ''}
                </Label>
                {p.input_type === 'textarea' ? (
                  <>
                    <Textarea
                      id={`ph-${p.key}`}
                      value={value}
                      onChange={(e) => setValues((v) => ({ ...v, [p.key]: handleTextChange(e.target.value) }))}
                      placeholder={p.description || p.label}
                      className={`mt-2 ${overLimit ? 'border-destructive' : ''}`}
                    />
                    {isDedication && (
                      <div className={`text-xs mt-1 ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {Math.min(wordCount, DEDICATION_WORD_LIMIT)}/{DEDICATION_WORD_LIMIT} words
                      </div>
                    )}
                  </>
                ) : (
                  <Input
                    id={`ph-${p.key}`}
                    value={value}
                    onChange={(e) => setValues((v) => ({ ...v, [p.key]: e.target.value }))}
                    placeholder={p.description || p.label}
                    className="mt-2"
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
