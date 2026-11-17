# Security Specification & Test-Driven Defense

## 1. Data Invariants
1. Document IDs across all collections (`/reports`, `/photos`, `/tenants`, `/sellerSettings`, `/paymentRequests`, `/securityLogs`) must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, 1..128 chars).
2. Verified platform owners (`kerjaanjason@gmail.com`, `voltcheck@admin.com`, `admin@vgreen.id` with `email_verified == true`) hold administrative privileges in `isAdmin()`. Substring email matching (`.*admin.*`) is strictly forbidden to prevent spoofing.
3. Tenant credentials stored in `/tenants/{tenantId}` MUST use salted SHA-256 (`passwordHash` + `passwordSalt`) and MUST NOT persist plaintext `password` fields in Firestore (`!('password' in data)`).
4. `reportsUsed` on `/tenants/{tenantId}` is strictly monotonic (`incoming().reportsUsed >= existing().reportsUsed`) so consumed report tokens cannot be refunded by client tampering.
5. All string fields enforce explicit `.size()` caps to prevent Denial-of-Wallet storage abuse.
6. Subcollection photos (`/reports/{reportId}/photos/{photoId}`) enforce parent existence via `exists(/databases/$(database)/documents/reports/$(reportId))` and strict `incoming().reportId == reportId`.
7. Seller payment settings (`/sellerSettings/default`) allow only document ID `'default'`, forbid deletion, and block writes by signed-in non-admin users.
8. Payment requests (`/paymentRequests/{requestId}`) must be created with `status == 'pending'`, enforce valid tier/status enums, bounded duration/amounts, immutable `id` and `tenantId`, and lock status transitions from non-admin signed-in users or after terminal `'approved'` state.
9. Security audit logs (`/securityLogs/{logId}`) are strictly append-only (`allow update, delete: if false;`) with bounded summary length and strict enum validation.

## 2. The "Dirty Dozen" Threat Payloads
1. **Plaintext Password Leak**: Writing `{ ..., password: "secret" }` to `/tenants/t1` -> Must reject (`!('password' in data)`).
2. **ID Poisoning Attack**: Target `/reports/invalid$$$###name` -> Must reject (`isValidId` regex).
3. **Token Refund Attack**: Updating `/tenants/t1` with `reportsUsed: 0` when `existing().reportsUsed == 1` -> Must reject.
4. **Huge String Wallet Drain**: Setting `title` to 2MB string -> Must reject (`title.size() <= 256`).
5. **Orphaned Photo Insertion**: Adding photo under `/reports/missing_parent/photos/p1` -> Must reject (`exists(...)`).
6. **Email Spoofing / Wildcard Admin**: Signing in with `eviladmin@gmail.com` or unverified email -> Must reject (`isAdmin()` requires exact allowlisted email + `email_verified == true`).
7. **Negative Reports Quota**: Setting `reportsQuota: -9999` -> Must reject (`reportsQuota >= -1`).
8. **Pre-Approved Payment Request**: Creating `/paymentRequests/pay_1` with `status: 'approved'` -> Must reject (`incoming().status == 'pending'`).
9. **Immutable ID / Tenant Hijack**: Updating `/paymentRequests/pay_1` to alter `tenantId` or `id` -> Must reject.
10. **Malicious Enum Override**: Setting `status: "hacked"` or `severity: "root"` -> Must reject.
11. **Audit Log Tampering**: Updating or deleting `/securityLogs/sec_1` -> Must reject (`allow update, delete: if false;`).
12. **Catch-All Default Leak**: Attempting write to unmapped collection `/{unmapped=**}` -> Must reject.
