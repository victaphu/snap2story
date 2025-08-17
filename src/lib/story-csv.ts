import fs from 'fs';
import path from 'path';

export type CsvRow = {
  age_group: string;
  theme: string;
  length: number;
  page_number: number;
  story_text: string;
  image_prompt: string;
  moral: string;
  variables: string[];
  mode_min_inputs: string[];
  mode_opt_inputs: string[];
};

// Split CSV line on commas not enclosed in quotes
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // handle doubled quotes inside quoted field
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim().replace(/^"|"$/g, ''));
}

export function loadStoryTemplatesCsv(): CsvRow[] {
  const filePath = path.join(process.cwd(), 'master_story_templates.csv');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows: CsvRow[] = [];
  const header = lines.shift();
  if (!header) return rows;

  for (const line of lines) {
    const cols = splitCsvLine(line);
    if (cols.length < 10) continue;
    const [ageGroup, theme, lengthStr, pageStr, storyText, imagePrompt, moral, variables, minInputs, optInputs] = cols;
    rows.push({
      age_group: ageGroup,
      theme,
      length: Number(lengthStr),
      page_number: Number(pageStr),
      story_text: storyText,
      image_prompt: imagePrompt,
      moral,
      variables: variables ? variables.split(/\s*,\s*/).map((s) => s.trim()) : [],
      mode_min_inputs: minInputs ? minInputs.split(/\s*,\s*/).map((s) => s.trim()) : [],
      mode_opt_inputs: optInputs ? optInputs.split(/\s*,\s*/).map((s) => s.trim()) : [],
    });
  }
  return rows;
}

export function getTemplatesFor(ageGroup: string, theme: string, length: number): CsvRow[] {
  const rows = loadStoryTemplatesCsv();
  return rows.filter((r) => r.age_group === ageGroup && r.theme === theme && r.length === length);
}

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => (vars[key] ?? `{${key}}`));
}

// Try to derive a cover scene from the CSV's first page image prompt
export function deriveCoverSceneFromCsv(
  ageGroup: string,
  themeName: string,
  length: number,
  vars: Record<string, string>
): string | null {
  const rows = getTemplatesFor(ageGroup, themeName, length);
  if (!rows.length) return null;
  const first = rows.find((r) => r.page_number === 1) || rows[0];
  if (!first?.image_prompt) return null;
  const raw = fillTemplate(first.image_prompt, vars);
  // Normalize a bit for cover usage
  return raw
    .replace(/^Illustration of/i, 'Front cover scene featuring')
    .replace(/\s+bright whimsical storybook style.*$/i, '') // remove trailing fixed style if present
    .trim();
}
