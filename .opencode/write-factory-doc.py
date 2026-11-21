import sys
from pathlib import Path


project = Path(__file__).resolve().parent.parent
docs = project / "docs"

if len(sys.argv) != 2:
    raise SystemExit("Usage: write-factory-doc.py docs/<page>.md")

path = Path(sys.argv[1])
target = project / path
if path.parent != Path("docs") or path.suffix != ".md" or target.resolve() != target:
    raise SystemExit("Choose a regular Markdown path directly under docs/")

target.write_text(sys.stdin.read(), encoding="utf-8")
