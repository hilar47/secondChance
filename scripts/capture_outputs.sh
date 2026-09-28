#!/usr/bin/env bash
# Runs the real cURL commands against your running API and saves each command + its output
# into ./evidence/<file>. Use those files (or screenshots of them) for the assignment.
#
#   BASE_URL=http://localhost:3060 bash scripts/capture_outputs.sh
#   BASE_URL=https://your-app.onrender.com bash scripts/capture_outputs.sh
set -u
BASE="${BASE_URL:-http://localhost:3060}"
OUT="${OUT_DIR:-evidence}"
mkdir -p "$OUT"

EMAIL="student$(date +%s)@example.com"
PASS="Password123"

pretty() { if command -v jq >/dev/null 2>&1; then jq .; else python3 -m json.tool 2>/dev/null || cat; fi; }

# save <file> <curl args...>   -> prints and saves "$ curl ..." followed by the output
save() {
  local file="$1"; shift
  { printf '$ curl'; printf ' %q' "$@"; printf '\n'; curl -s "$@" | pretty; } | tee "$OUT/$file"
  echo; echo "---- saved to $OUT/$file ----"; echo
}

save mainpage    "$BASE/api/secondchance/items"
save register    -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" \
                 -d "{\"name\":\"Student One\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
save login       -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
                 -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
save item_detail "$BASE/api/secondchance/items/1"
save search_item -G "$BASE/api/secondchance/search" --data-urlencode "name=chair" --data-urlencode "category=Living"

echo "Done. Files in ./$OUT: $(ls "$OUT" | tr '\n' ' ')"
