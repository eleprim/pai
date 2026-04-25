# Security Specification - Redbill 1.1

## Data Invariants
1. **Balanced Entries**: A Journal Entry must have `totalDebit == totalCredit`.
2. **Immutability of Posted Entries**: Once a Journal Entry is marked as "Posted", it cannot be edited or deleted (audit requirement).
3. **Transaction Relationship**: Every TransactionLine must belong to a valid JournalEntry and valid Account.
4. **Identity**: All records created must be associated with the authenticated user's UID.

## The "Dirty Dozen" Payloads (Deny Test Cases)
1. **Unbalanced Entry**: Create a Journal Entry where `totalDebit != totalCredit`.
2. **Unauthorized Account Edit**: Change the category of an account already used in posted entries (if enforced, for now just basic auth).
3. **Identity Spoofing**: Create a Journal Entry with `createdBy` set to another user's UID.
4. **Bypassing Posted Status**: Update a Journal Entry that has `status: "Posted"`.
5. **Orphaned Transaction**: Create a TransactionLine with an `entryId` that doesn't exist.
6. **Negative Amounts**: Create a TransactionLine where `debit` or `credit` is negative.
7. **Double Values**: Create a TransactionLine where both `debit` and `credit` are non-zero.
8. **Malicious ID**: Create a document with a 2MB string as an ID.
9. **Field Injection**: Add `isVerified: true` to a user profile or document where it's not allowed.
10. **Timestamp Spoofing**: Provide a `createdAt` value that doesn't match `request.time`.
11. **Account Code Conflict**: (Hard to enforce in rules without `exists`, handled by app logic but rules should at least check existence).
12. **Unauthorized Read**: Attempt to read another user's journal entries.

## Rules Implementation Strategy
- Use `isValidId()` for all path variables.
- Use `isValidAccount()`, `isValidJournalEntry()`, and `isValidTransactionLine()` validation helpers.
- Use `affectedKeys().hasOnly()` for state-based updates.
