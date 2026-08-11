#!/usr/bin/env node
// AC5: Patient no badge - BLOCKED by missing user_type data
// Cannot test that patients don't show badge when facility users can't either
// Backend returns user_type as null; implementation expects it on user object
// See ac5-patient-no-badge.log for details
console.log('AC5: Blocked by missing-test-data (user_type null in backend)');
process.exit(1);
