# Spec: Add Search to Facility Selector on User Home

## Problem Statement

Users with access to many facilities must scroll through a long dropdown list to find and select a facility from the FacilitySwitcher component in the sidebar. This becomes cumbersome when managing 10+ facilities, reducing efficiency in clinical workflows. A search input will allow instant filtering of facilities by name, improving navigation speed and user experience on both desktop and mobile devices.

## Acceptance Criteria

1. Given the FacilitySwitcher dropdown is open, when the user types in the search input, then only facilities matching the search query are displayed in the list.
2. Given the user has typed a search query, when no facilities match the query, then an empty state message is shown.
3. Given the user searches for a facility by partial name, when facilities match the partial string case-insensitively, then all matching facilities are displayed.
4. Given the search input is rendered, when the user views it on a mobile device, then the input is fully responsive and accessible via touch.
5. Given the user opens the FacilitySwitcher, when the dropdown opens, then the search input receives focus automatically for immediate typing.
6. Given the user has selected a facility from filtered results, when the selection is made, then the dropdown closes and the facility is set as active.
7. Given the FacilitySwitcher has search enabled, when the user opens and closes the dropdown without selecting, then the search query is cleared for the next use.

## Capability Notes

- `src/components/ui/sidebar/facility/facility-switcher.tsx` -- FacilitySwitcher component exists, renders DropdownMenu with facilities list
- `src/components/ui/command.tsx` -- Command component exists with CommandInput (searchable list pattern using cmdk)
- `src/components/ui/input.tsx` -- Input component exists for standard text inputs
- `src/components/ui/dropdown-menu.tsx` -- needs reading to confirm compatibility with Command/search pattern
- `src/components/ui/sidebar/app-sidebar.tsx:136` -- FacilitySwitcher usage in sidebar exists, passes facilities array

## Open Questions

None.
