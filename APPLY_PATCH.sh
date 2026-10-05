#!/bin/sh
set -eu
FILE="${1:-index.html}"
python3 - "$FILE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
old="function renderExamAdminReview(exams){\n  const box=document.getElementById('examAdminReviewRows'); if(!box)return;"
new="function renderExamAdminReview(exams,targetId='examAdminReviewRows'){\n  const box=document.getElementById(targetId)||document.getElementById('examAdminReviewRows'); if(!box)return;"
if old not in s:
    raise SystemExit("Expected v126.x renderExamAdminReview signature was not found; refusing to modify the file.")
p.write_text(s.replace(old,new,1),encoding='utf-8')
print("Applied the v126.5 render target fix to", p)
PY
