# User Story Template

Use this template for every story you add to the backlog (GitHub Issues → *User story* template).

## Title
`US-<number> <short name>`

## Story
**As a** <role — visitor, member, giver, receiver, admin>
**I want** <the capability I need>
**So that** <the benefit I get>

## Acceptance criteria
- [ ] Given <context>, when <action>, then <expected result>
- [ ] Given <context>, when <action>, then <expected result>

## Labels
Exactly one status label:

| Label | Meaning |
|-------|---------|
| `new` | Just captured, not yet refined |
| `backlog` | Refined and ready to be scheduled into a sprint |
| `icebox` | Good idea, not planned now |
| `technical debt` | Internal improvement with no direct user-facing change |

## Definition of done
- [ ] Code reviewed and merged via pull request
- [ ] Automated checks pass in CI
- [ ] Documentation updated if the API changed

## Example

**US-5 Browse all items**
**As a** visitor **I want** to see every available item **so that** I can find something I need.
- [ ] Given items exist, when I call `GET /api/secondchance/items`, then all items are returned as JSON.
Label: `new`
