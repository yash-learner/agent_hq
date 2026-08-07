# Review: Add support for inserting links in the left navbar

## Round 1

- **should-fix** `src/components/ui/sidebar/facility/facility-nav.tsx:180-187` — `transformCustomLink()` does not recursively transform nested children; if a custom link has children with their own children, the grandchildren won't be transformed and will lack proper URL prefixing and icon resolution. Add recursive transformation for deeply nested children.

All acceptance criteria are implemented:
- AC1: Custom links append after plugin links via spread in the return array
- AC2: `target` prop flows from CustomNavLink → NavigationLink → NavLink → ActiveLink
- AC3: `resolveCustomLinkIcon()` handles both "care" and "lucide" icon types
- AC4: `visibility` filtering applied at line 128 (main links) and line 219 (children)
- AC5: Plugin and custom links coexist — custom links append after plugin links
- AC6: Tooltip support via `tooltip={link.name}` on SidebarMenuButton (line 145)
- AC7: Error handling with descriptive console.error messages and fallback to empty array

No tests were added for this feature. While not a blocker (QA will validate behavior), Playwright tests would strengthen coverage for:
- Custom link rendering with various icon types
- Links with `target="_blank"` having correct DOM attribute
- Visibility filtering behavior
- Config parsing with invalid JSON/missing fields

Clean implementation otherwise — proper TypeScript types, clear documentation in `.example.env`, and graceful error handling.
