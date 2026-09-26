# Trade navigation and comparison — staging review

After an ordinary two-team proposal succeeds, the form now opens the created trade's detail page. While sending, its button says **Sending…** and repeated submissions are blocked synchronously. Failed requests keep the draft and retry key. Counter proposals keep their existing navigation and original-offer behavior.

Three-team detail pages now show outgoing cards down the left and incoming cards down the right, aligned by team. Incoming cards name each asset's source team; outgoing cards name its destination. Salary retention remains grouped with its contract. On mobile, each team's sends/receives pair stacks together. Empty receiving packages are explicit. Acceptance, decline, counters, impact calculations, and two-team detail layout are unchanged.

## Verification

- The new two-team regression cases reproduced missing navigation and repeated submission before the correction.
- 47 component tests passed across TwoTeamProposal, ThreeTeamTrade, CounterProposal, and TransactionPages.
- 10 desktop/mobile Chromium scenarios passed, including navigation after success, failed-request draft preservation, pending feedback, repeat-submit protection, three-team responses and counters, and desktop/mobile card positions.
- Screenshots were inspected. Both viewport sizes have no horizontal overflow.
- Changed JavaScript files passed ESLint. The staging Vite build passed, with the existing large-chunk warning.
- Tests use isolated fixtures and create no hosted trades. API contracts and backend code are unchanged; the backend suite was not rerun for this frontend-only correction.

## Release scope

Publish only to the separate staging frontend site. Hosted publication receipts and asset/browser verification are recorded in the private release folder at E:/hundo-leago-backend/.hundo.local/trades-staging-20260925/. User review remains separate from automated verification. Production publication remains on hold. The previously recorded staging backup/restart follow-up is outside this frontend change.
