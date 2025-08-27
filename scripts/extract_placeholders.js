const fs = require('fs');

function main() {
  const path = process.argv[2] || 'supabase_story_templates_seed.sql';
  const sql = fs.readFileSync(path, 'utf8');

  const results = [];
  const re = /insert into public\.story_templates \(story_id, theme, title, data\) values \('\s*([^']*?)\s*',\s*'([^']*?)',\s*'([^']*?)',\s*'([\s\S]*?)'\)/g;

  let m;
  while ((m = re.exec(sql))) {
    const story_id = m[1];
    const theme = m[2];
    const title = m[3];
    const rawJson = m[4];
    // Unescape the JSON that is embedded in a single-quoted SQL string
    const jsonStr = rawJson.replace(/\\"/g, '"');
    try {
      const data = JSON.parse(jsonStr);
      const variables = Array.isArray(data.variables) ? data.variables : [];
      results.push({ story_id, theme, title, variables });
    } catch (e) {
      results.push({ story_id, theme, title, error: 'Failed to parse JSON: ' + e.message });
    }
  }

  // Print concise list
  for (const r of results) {
    if (r.error) {
      console.log(`${r.story_id}: ERROR ${r.error}`);
    } else {
      console.log(`${r.story_id}: [${r.variables.join(', ')}]`);
    }
  }
}

main();

