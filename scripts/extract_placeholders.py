import json, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'supabase_story_templates_seed.sql'
sql = open(path, 'r', encoding='utf-8').read()

needle = "insert into public.story_templates"
idx = 0
while True:
    start = sql.find(needle, idx)
    if start == -1:
        break
    # find first 8 single quotes after start (to capture 4 quoted values)
    quotes = []
    i = start
    for _ in range(8):
        i = sql.find("'", i + 1)
        if i == -1:
            break
        quotes.append(i)
    if len(quotes) < 8:
        break
    story_id = sql[quotes[0] + 1 : quotes[1]]
    theme = sql[quotes[2] + 1 : quotes[3]]
    title = sql[quotes[4] + 1 : quotes[5]]
    raw = sql[quotes[6] + 1 : quotes[7]]

    json_str = raw.replace('\\"', '"')
    try:
        data = json.loads(json_str)
        vars_ = data.get('variables', [])
        print(f"{story_id}: [{', '.join(vars_)}]")
    except Exception as e:
        print(f"{story_id}: ERROR parsing JSON: {e}")
    idx = quotes[7] + 1
