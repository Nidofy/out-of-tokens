# DSH adapter
Only use authenticated connection/request and profileContext.dir/out-of-tokens/v1.
Never read village saves, credentials or conversations. Do not install in live profiles during tests.
CAS and backup rotation publish one envelope. Uncertain writes require read-only reconciliation.
Disposal aborts requests, waits for storage operations, removes only owned UI.
Temporary-profile contract tests do not substitute for real DSH co-existence acceptance.
