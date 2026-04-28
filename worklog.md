---
Task ID: 1
Agent: Main Agent
Task: Add user marketplace submission feature with admin approval workflow

Work Log:
- Added `status` field to MarketplaceItem Prisma schema (pending/approved/rejected)
- Created POST /api/marketplace/submit endpoint (public, no auth required) — items start as "pending", rate-limited to 3/day per seller
- Updated GET /api/marketplace — public only sees "approved" items; admin can filter by status
- Updated POST /api/marketplace — admin-created items auto-approved
- Updated PATCH /api/marketplace/[id] — supports status updates (approve/reject)
- Created SubmitMarketplaceModal component — form for users to submit marketplace listings
- Updated CommunityMarketplace — added "Pasang Iklan" button + empty state CTA
- Updated CMS MarketplaceManager — added approval workflow with tabs (Menunggu/Disetujui/Ditolak/+Tambah)
- Migrated existing 6 items from pending→approved in database
- Pushed schema changes and regenerated Prisma Client

Stage Summary:
- Users can now submit marketplace listings via "Pasang Iklan" button
- Submissions start as "pending" and require admin approval
- Admin CMS has approval workflow with approve/reject actions
- Existing items migrated to "approved" status
- Rate limit: 3 pending submissions per seller per day
