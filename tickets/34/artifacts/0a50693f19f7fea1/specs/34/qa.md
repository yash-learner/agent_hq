# QA Report: Add search for the Healthcare Service index page

All acceptance criteria have been verified through live-flow testing with video evidence.

## Summary

✅ **All acceptance criteria passed** — Search functionality for healthcare services works as specified, including input display, filtering, clearing, empty state handling, and URL persistence.

## Live-flow

### AC1: Search input displays on page load

**Verdict:** pass

Navigated to `/facility/{facilityId}/services` and verified that:
- Services page loads with "Services" heading visible
- Search input field is displayed above the list of services
- Search input has correct placeholder text: "Search healthcare services..."

**Plan steps executed:** 1, 2

[ac1-search-input-displays](specs/34/videos/ac1-search-input-displays.webm)

---

### AC2: Search filters services by name (debounced)

**Verdict:** pass

Created three test healthcare services (Cardiology, Neurology, Orthopedics) via UI, then verified that:
- Typing "Cardiology" in the search input filters the list after debounce
- Only the Cardiology service is visible in the filtered results
- Other services (Neurology, Orthopedics) are properly filtered out
- URL updates to contain `search=Cardiology` query parameter

**Data setup:** Created three healthcare services via UI (steps 1-11 from qa-plan)

**Plan steps executed:** Data setup 1-11, live steps 1, 2

[ac2-search-filters-services](specs/34/videos/ac2-search-filters-services.webm)

---

### AC3: Clearing search shows all services

**Verdict:** pass

Starting from a filtered state (search="Cardiology"), verified that:
- Clearing the search input by deleting all text restores the full list
- All three services (Cardiology, Neurology, Orthopedics) become visible again
- URL no longer contains the `search` query parameter
- List returns to unfiltered state

**Plan steps executed:** 1, 2

[ac3-clearing-search](specs/34/videos/ac3-clearing-search.webm)

---

### AC4: Empty state for no matching results

**Verdict:** pass

Verified that searching for a non-existent term:
- Typing "NonexistentService12345" triggers the search
- Empty state message "No services found" is displayed
- No service cards are visible in the results
- URL contains `search=NonexistentService12345` parameter

**Plan steps executed:** 1, 2

[ac4-empty-state](specs/34/videos/ac4-empty-state.webm)

---

### AC5: Search term persists in URL and on page reload

**Verdict:** pass

Verified URL persistence and page reload behavior:
- Typing "Neurology" in search input filters the list
- URL updates to contain `search=Neurology`
- Only Neurology service is visible
- Reloading the page (F5) maintains the search state
- Search input remains pre-filled with "Neurology" after reload
- Filtered results remain consistent (only Neurology visible)
- URL continues to contain `search=Neurology` after reload

**Plan steps executed:** 1, 2, 3

[ac5-url-persistence](specs/34/videos/ac5-url-persistence.webm)

---

## Code inspection

No additional code inspection was performed. All acceptance criteria were verified through live-flow testing.

## Limits

None. All acceptance criteria were successfully exercised in the running application.
