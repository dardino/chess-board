# Pull Request

## Description

This PR adds two new CSS-only mirror animations for chess pieces aimed at matching the current `rotating` and `translating` animation model. The board now supports `mirroring="horizontal"` and `mirroring="vertical"` behaviors through CSS variables, while leaving the existing rotation and translation animations untouched.

## Type of Change

<!-- Check all that apply -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [x] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that changes existing behavior)
- [x] 🎨 UI / styling change
- [x] 📚 Documentation update
- [ ] ⚙️ Build / tooling / configuration
- [ ] ♻️ Refactoring (no functional changes)
- [ ] ✅ Tests

## Related Issues

Closes #25

## Changes Made

- Added CSS-only horizontal and vertical mirror animations to the board animation system.
- Added CSS custom properties for mirror transform values in the same pattern as the existing rotate/translate variables.
- Updated the public documentation and usage snippets to include `mirroring` examples and supported CSS variables.
- Filled in the PR template with the feature summary and verification notes for the mirror animation work.

## Testing

<!-- Describe how you tested your changes -->
- [ ] I have added/updated tests for new functionality
- [x] `pnpm test:run` passes
- [x] `pnpm lint` passes
- [x] `pnpm type-check` passes
- [ ] I have manually verified the demo (`pnpm demo`)

## Screenshots / Demo

<!-- For UI changes, add before/after screenshots or a link to the live demo -->

| Before | After |
| ------ | ----- |
| Existing board animation set only included rotate/translate states. | Board supports `mirroring="horizontal"` and `mirroring="vertical"` with CSS variable overrides. |

## Checklist

- [x] My code follows the project's style guidelines
- [x] I have performed a self-review of my code
- [x] I have updated the documentation (README, `docs/`) where relevant
- [x] My changes don't introduce new warnings
- [x] The build succeeds (`pnpm build`)
