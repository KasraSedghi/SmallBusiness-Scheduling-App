# Database Guardrails & Schema Integrity

## Directives
- **RLS Enforced:** Every table created or modified in Supabase must have Row-Level Security (RLS) active. Employees should only have read/write access to their own data rows.
- **Relational Integrity:** Ensure foreign keys properly map back to the core User/Profile records.
- **State Controls:** Ensure availability submissions default to a 'Pending' status string, allowing explicit updates to 'Approved' only via an authenticated Admin user session.