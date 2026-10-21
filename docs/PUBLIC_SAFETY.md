# Safety rules for this public test repository

This is a synthetic demonstration, **not** a read-only mirror of the clinic's private code.

## Required review before every push
1. Only explicitly permitted paths, UTF-8 text and small files are allowed.
2. Never copy the private repository history, workflows, patient data, exports, integration endpoints, real phone numbers, or credentials.
3. Keep this GitHub workflow limited to Node tests and a public-content lint gate, with read-only permissions and no deployment steps.
4. The guard is heuristic and can miss confidential data. A person must still approve each new file.
5. CI passing here does not grant production-release approval.

## Limitation
The tests exercise policy examples in this repository. They do not execute or validate the real private booking, WhatsApp, payment, or clinical systems.
