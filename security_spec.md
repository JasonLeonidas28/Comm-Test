# Security Specification & Test-Driven Defense

## 1. Data Invariants
1. All requests to access or modify commissioning reports must be authenticated (`request.auth != null`).
2. Document IDs in `/reports/{reportId}` and `/reports/{reportId}/photos/{photoId}` must satisfy `isValidId(id)` (alphanumeric, dash, underscore, <= 128 characters).
3. The platform owner/admin `kerjaanjason@gmail.com` has full administrative oversight over reports and tenants.
4. Reports can be read and edited by authenticated contractors and owners.
5. All string fields must adhere to explicit size caps to prevent Denial-of-Wallet attacks.
6. Subcollection photos must strictly reference their parent `reportId`.
7. Tenant documents can be managed by the platform admin/owner.

## 2. The "Dirty Dozen" Threat Payloads
1. **Empty / Anonymous Access**: Unauthenticated write to `/reports/rep_1` -> Must reject (403).
2. **ID Poisoning Attack**: Target `/reports/invalid$$$###name` with 2KB junk document ID -> Must reject.
3. **Ghost Field Injection**: Submitting payload with `{ ..., shadowField: "unauthorized" }` -> Must reject.
4. **Huge String Wallet Drain**: Setting `title` to 2MB string -> Must reject (`title.size() <= 256`).
5. **Orphaned Photo Insertion**: Adding a photo under `/reports/fake_parent/photos/p1` -> Must reject.
6. **Admin Impersonation**: Non-admin claiming `role: "admin"` -> Must reject.
7. **Negative Reports Quota**: Setting `reportsQuota: -9999` on tenant -> Must reject.
8. **Null Keys in Report**: Creating report without required `title` or `createdAt` -> Must reject.
9. **Cross-Tenant Hijack**: Attempting to alter immutable `creatorUid` or `id` -> Must reject.
10. **Malicious Enum Override**: Setting `status` to invalid state `"hacked"` -> Must reject.
11. **Subcollection Photo Flood**: Sending arbitrary unvalidated blobs without `reportId` -> Must reject.
12. **Catch-All Default Leak**: Attempting write to arbitrary unspecified collection `/{unmapped=**}` -> Must reject.

## 3. Test Invariants Coverage
All 12 attacks are blocked by the fortress rules:
- Global default deny catch-all `match /{document=**} { allow read, write: if false; }`
- Strict `isValidId()`, `isValidReport()`, and `isValidPhoto()` validation functions.
- `isAdmin()` checking verified email against `kerjaanjason@gmail.com`.
