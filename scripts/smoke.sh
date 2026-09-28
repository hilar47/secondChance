#!/usr/bin/env bash
# Smoke test used by CI: expects the API on $BASE_URL with the 16 seed items imported.
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3060}"
fail() { echo "FAIL: $*"; exit 1; }
count() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).length))'; }
field() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)[process.argv[1]]||""))' "$1"; }

echo "1) health";          curl -sf "$BASE/health" >/dev/null || fail "health"
echo "2) list items = 16"; [ "$(curl -sf "$BASE/api/secondchance/items" | count)" = "16" ] || fail "expected 16 items"
echo "3) item detail";     curl -sf "$BASE/api/secondchance/items/1" | grep -q '"id": *"1"' || fail "item 1"
echo "4) unknown item 404"; [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/secondchance/items/9999")" = "404" ] || fail "404"
echo "5) category filter"; [ "$(curl -sf "$BASE/api/secondchance/search?category=Kitchen" | count)" = "3" ] || fail "kitchen != 3"
echo "6) operator injection is rejected/ignored"
[ "$(curl -s -o /dev/null -w '%{http_code}' -g "$BASE/api/secondchance/search?category[\$ne]=Kitchen")" = "200" ] || fail "injection"
[ "$(curl -sf -g "$BASE/api/secondchance/search?category[\$ne]=Kitchen" | count)" = "16" ] || fail "operator was honoured"

EMAIL="ci$(date +%s)@example.com"
echo "7) register";        TOKEN=$(curl -sf -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
                              -d "{\"name\":\"CI User\",\"email\":\"$EMAIL\",\"password\":\"Password123\"}" | field authtoken); [ -n "$TOKEN" ] || fail "register"
echo "8) duplicate register -> 409"; [ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
                              -d "{\"name\":\"CI User\",\"email\":\"$EMAIL\",\"password\":\"Password123\"}")" = "409" ] || fail "duplicate"
echo "9) login";           curl -sf -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
                              -d "{\"email\":\"$EMAIL\",\"password\":\"Password123\"}" | grep -q authtoken || fail "login"
echo "10) bad login -> 401"; [ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
                              -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-password\"}")" = "401" ] || fail "bad login"
echo "11) update user";    curl -sf -X PUT "$BASE/api/auth/update" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
                              -d '{"name":"CI Renamed"}' | grep -q 'CI Renamed' || fail "update"
echo "12) create item (multipart upload)"
ID=$(curl -sf -X POST "$BASE/api/secondchance/items" -H "Authorization: Bearer $TOKEN" \
      -F name="CI test lamp" -F category=Living -F condition=Good -F age_years=1 -F description=test | field id); [ -n "$ID" ] || fail "create"
echo "13) create requires auth"; [ "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/secondchance/items" -F name=x)" = "401" ] || fail "auth on POST"
echo "14) delete item";    curl -sf -X DELETE "$BASE/api/secondchance/items/$ID" -H "Authorization: Bearer $TOKEN" | grep -q '"deleted": *true' || fail "delete"
echo "ALL SMOKE TESTS PASSED"
