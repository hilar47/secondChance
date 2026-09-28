# User Stories

Roles: **Visitor** (not logged in), **Member** (registered), **Giver** (member who lists), **Receiver** (member who claims).

## Epic 1 – Accounts

**US-1 Register** – *As a visitor I want to create an account so that I can list or claim items.*
- Name, e-mail and password (≥8 chars, letter + number) are required
- Duplicate e-mail returns a clear error
- Password is never stored or returned in plain text

**US-2 Log in** – *As a member I want to log in securely so that my listings are protected.*
- Correct credentials return a token; wrong ones return a generic error
- 5 failed attempts lock the account for 15 minutes

**US-3 Profile** – *As a member I want to edit my name, city and bio and see other members' public profiles and ratings.*
- E-mail is never shown on public profiles

## Epic 2 – Listings

**US-4 List an item** – *As a giver I want to post an item with photos, category, condition and location so others can find it.*
- Title, description, category, condition required; up to 5 image URLs and 10 tags
- Optional coordinates enable "near me" search

**US-5 Manage listings** – *As a giver I want to edit or remove my listing.*
- Only the owner may edit/delete; reserved/given items cannot be edited
- Editing a stale copy is rejected (conflict) instead of silently overwriting

**US-6 My items** – *As a member I want to see items I listed and items I claimed.*

## Epic 3 – Discovery

**US-7 Browse** – *As a visitor I want to browse available items with pagination.*

**US-8 Search** – *As a visitor I want to search by keyword and filter by category, condition and city so I find what I need quickly.*
- Results ranked by relevance; reserved/given items hidden by default

**US-9 Near me** – *As a visitor I want to see items within X km of a location.*

## Epic 4 – Claiming

**US-10 Claim** – *As a receiver I want to reserve an item so nobody else takes it.*
- If two people click at once only one succeeds; the other is told the item is gone
- Owners cannot claim their own item

**US-11 Release** – *As a giver or receiver I want to cancel a reservation so the item becomes available again.*

**US-12 Confirm hand-over** – *As a giver I want to mark the item as given once it is collected.*

## Epic 5 – Trust

**US-13 Review** – *As a giver/receiver I want to rate the other party after a completed hand-over.*
- Only the two participants, only after `given`, only once
- Rating 1–5 with optional comment

**US-14 Reputation** – *As a member I want to read a person's reviews and average rating before arranging a pickup.*

**US-15 Remove review** – *As a reviewer I want to delete my own review; the average updates accordingly.*

## Non-functional stories

- **NF-1** All endpoints validate input and return consistent JSON errors.
- **NF-2** The system runs with one command via Docker Compose.
- **NF-3** Every push runs automated tests in CI.
- **NF-4** Concurrent operations (claim, review, register) never corrupt data.
