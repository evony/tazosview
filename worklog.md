---
Task ID: 2
Agent: Main Agent
Task: Tie marketplace seller identity to player gamertag account (verified sellers)

Work Log:
- Added `playerId` field to MarketplaceItem schema (FK → Player, nullable for admin-created)
- Added `marketplaceItems` relation to Player model
- Updated POST /api/marketplace/submit — now requires player login via `requirePlayer()`, auto-fills sellerName from gamertag and sellerAvatar from player avatar
- Rate limiting changed from per-sellerName to per-playerId (max 5/day)
- Updated SubmitMarketplaceModal — shows "Login Diperlukan" if not logged in, auto-fills WhatsApp from player phone, shows verified seller badge with gamertag + tier
- Updated CommunityMarketplace card — shows green ShieldCheck badge for verified sellers (items with playerId)
- Updated CMS MarketplaceManager — shows ✓ indicator for verified sellers
- Pushed schema changes and regenerated Prisma Client
- Lint passes cleanly

Stage Summary:
- Marketplace submissions now require player login (gamertag account)
- Seller name auto-fills from gamertag — no impersonation possible
- Verified sellers get green shield badge in marketplace cards
- Admin-created items have playerId=null (shown without verified badge)
- Buyer trust increased — can verify seller identity through their gamertag account
