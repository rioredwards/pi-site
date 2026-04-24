## [ERR-20260325-001] npm_run_lint

**Logged**: 2026-03-25T00:00:00Z
**Priority**: medium
**Status**: pending
**Area**: tests

### Summary
`npm run lint` failed in the local workspace because `eslint` was not installed.

### Error
```text
> lint
> eslint .

sh: eslint: command not found
```

### Context
- Command attempted: `npm run lint`
- Working directory: `/Users/rioredwards/dev/pi-site`
- The repo's dev flow appears to rely on Docker-managed dependency installation rather than a populated local `node_modules/`.

### Suggested Fix
Document the expected local bootstrap path more clearly, or provide a supported local install path so static checks can run outside Docker when needed.

### Metadata
- Reproducible: yes
- Related Files: /Users/rioredwards/dev/pi-site/package.json

---

## [ERR-20260325-002] gh_auth_status

**Logged**: 2026-03-25T00:00:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
GitHub CLI authentication was invalid, which blocked issue creation from the review findings.

### Error
```text
github.com
  X Failed to log in to github.com account rioredwards (default)
  - Active account: true
  - The token in default is invalid.
  - To re-authenticate, run: gh auth login -h github.com
  - To forget about this account, run: gh auth logout -h github.com -u rioredwards
```

### Context
- Command attempted: `gh auth status`
- Working directory: `/Users/rioredwards/dev/pi-site`
- This blocked `gh issue create` for the ticket generation step.

### Suggested Fix
Re-authenticate `gh` for `github.com` before ticket-creation workflows that depend on the CLI.

### Metadata
- Reproducible: yes
- Related Files: /Users/rioredwards/dev/pi-site/.git/config

---
