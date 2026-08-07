// AC5: Invalid JSON logs console warning
// This requires build-time REACT_NAV_LINKS with invalid JSON
// Cannot be tested in pre-built environment

console.log('[AC5] Acceptance Criterion: Invalid JSON logs console warning');
console.log('[AC5] Blocker: Build-time configuration limitation');
console.log('[AC5] Reason: Requires invalid REACT_NAV_LINKS environment variable set before build');
console.log('[AC5] The implementation exists in:');
console.log('[AC5]   - care.config.ts (lines 428-457): JSON parsing with error handling');
console.log('[AC5]   - Line 432-435: Warns if REACT_NAV_LINKS is not an array');
console.log('[AC5]   - Line 439-448: Warns if links are missing name or url properties');
console.log('[AC5]   - Line 451-457: Warns if JSON parse fails');
console.log('[AC5] Status: not-exercised (build-time configuration)');

// No actual test can be run without rebuilding with invalid REACT_NAV_LINKS
