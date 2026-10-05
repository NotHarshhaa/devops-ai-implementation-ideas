"""Export idea metadata to docs/data/ideas.js and docs/data/ideas.json for the static site.

Run from the repo root:  python scripts/export_ideas_js.py
Requires the generator metadata (menus.py, generate.py, ideas_*.py) — by
default in F:/tmp/idea-gen; override with GEN_DIR env var.
"""
import json
import os
import sys
from pathlib import Path

GEN_DIR = Path(os.environ.get("GEN_DIR", "F:/tmp/idea-gen"))
sys.path.insert(0, str(GEN_DIR))

from generate import load_ideas, render_diagram  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
DATA_DIR = DOCS / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

ideas = load_ideas()
by_num = {x["num"]: x for x in ideas}

FIELDS = [
    "num", "slug", "name", "area", "tldr", "complexity", "automation",
    "problem_intro", "problem", "impact", "capabilities", "solution",
    "steps", "hitl", "components", "flow", "platforms", "integrations",
    "context", "tools", "benefits", "security", "future", "related",
]

data = []
for x in ideas:
    d = {k: x.get(k) for k in FIELDS}
    d["diagram"] = render_diagram(x["stages"])
    d["related"] = [
        {"num": n, "name": by_num[n]["name"], "slug": by_num[n]["slug"]}
        for n in x.get("related", [])
    ]
    for opt in ("cost", "variations", "schema"):
        if x.get(opt):
            d[opt] = x[opt]
    data.append(d)

# Format with indent=2 for clean, human-readable, multi-line structure
formatted_json = json.dumps(data, ensure_ascii=False, indent=2)
safe_js = formatted_json.replace("</", "<\\/")  # safe to embed in a <script> block

# Write clean multi-line JS for script tag loading
ideas_js = f"window.IDEAS = {safe_js};\n"
(DATA_DIR / "ideas.js").write_text(ideas_js, encoding="utf-8")

# Write clean multi-line JSON for raw API/fetch consumption
(DATA_DIR / "ideas.json").write_text(formatted_json + "\n", encoding="utf-8")

size_js = (DATA_DIR / "ideas.js").stat().st_size // 1024
size_json = (DATA_DIR / "ideas.json").stat().st_size // 1024
print(f"exported {len(data)} ideas -> docs/data/ideas.js ({size_js} KB) and docs/data/ideas.json ({size_json} KB)")
