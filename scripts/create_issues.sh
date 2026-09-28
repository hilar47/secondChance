#!/usr/bin/env bash
# Creates the labels and 10 user-story issues in your GitHub repo using the GitHub CLI.
#   gh auth login        (once)
#   bash scripts/create_issues.sh hilar47/secondChance
set -eu
REPO="${1:?usage: create_issues.sh <owner/repo>}"

for l in "new:0e8a16" "icebox:c5def5" "technical debt:d93f0b" "backlog:fbca04" "user-story:1d76db"; do
  gh label create "${l%%:*}" --color "${l##*:}" --repo "$REPO" 2>/dev/null || true
done

story() { # title, label, role, want, benefit, criteria
  gh issue create --repo "$REPO" --title "$1" --label "user-story,$2" --body "**As a** $3
**I want** $4
**So that** $5

### Acceptance criteria
$6"
}

story "US-1 Register an account"            "new"            "visitor" "to create an account" "I can list or claim items" "- [ ] name, email, password validated
- [ ] duplicate email rejected (409)
- [ ] password stored hashed"
story "US-2 Log in securely"                "new"            "member"  "to log in with email and password" "my listings are protected" "- [ ] valid credentials return a JWT
- [ ] wrong credentials return a generic 401"
story "US-3 Update my profile"              "backlog"        "member"  "to change my name and password" "my details stay current" "- [ ] PUT /api/auth/update requires a token"
story "US-4 List an item with a photo"      "new"            "giver"   "to post an item with category, condition and a photo" "others can find it" "- [ ] multipart upload accepted
- [ ] only images, max 5 MB"
story "US-5 Browse all items"               "new"            "visitor" "to see every available item" "I can find something I need" "- [ ] GET /api/secondchance/items returns all items"
story "US-6 View item details"              "backlog"        "visitor" "to open an item" "I can decide whether to collect it" "- [ ] GET /items/:id returns the item or 404"
story "US-7 Search and filter"              "backlog"        "visitor" "to filter by name, category and condition" "I find items quickly" "- [ ] GET /api/secondchance/search supports name, category, condition, age_years"
story "US-8 Delete my listing"              "backlog"        "giver"   "to remove an item I no longer offer" "the list stays accurate" "- [ ] only the owner can DELETE /items/:id"
story "US-9 Rate the other person"          "icebox"         "receiver" "to leave a review after pickup" "the community can trust each other" "- [ ] rating 1-5 with comment"
story "US-10 Sentiment score for comments"  "icebox"         "moderator" "comments to be scored automatically" "abusive text can be flagged" "- [ ] /sentiment service returns positive/neutral/negative"
story "TD-1 Add automated API tests"        "technical debt" "developer" "unit and integration tests" "regressions are caught early" "- [ ] tests run in CI"
story "TD-2 Move uploads to cloud storage"  "technical debt" "developer" "images stored outside the container" "uploads survive redeploys" "- [ ] S3 or Cloudinary adapter"
echo "Done - open https://github.com/$REPO/issues"
