# مدار الفرحة — a sixth, independent organizer experience

10 October 2026. Open `/app/events?theme=orbit` or select **مدار الفرحة** from the appearance picker. The previous five appearances remain selectable. Orbit is a distinct workflow and composition on the same event services, not a new copy of event data.

| Area | Orbit behavior |
|---|---|
| Home | Occasion selector and a spatial task map replace the editorial event hero. Each of the seven stations links to its real task, derives readiness from event data and surrounds the personalized invitation. Memories remain explicitly selectable. |
| Workspace | Preparation, event day and additional-options chapters replace the persistent sidebar. A focused chapter strip, all-sections expansion and searchable Ctrl/Cmd-K destinations expose every workspace. |
| Occasion discovery | A sculpture stage with horizontal RTL swipes, category filtering, Arabic search, keyboard arrows and a complete 13-occasion index. Confirmation chooses the visible occasion. |
| Creation | Names, time and place are three short chapters. Forward navigation validates completed chapters; back navigation retains inputs. Final creation uses the existing event service and opens the template desk. |
| Templates | A focused personalized poster with neighbouring invitations, gesture browsing and the complete 13-preset index replaces the grid. Style filters remain. Applying a preset preserves names/text/program and saves through the existing service. A preview dialog offers explicit cinematic playback. |
| Editing | A draggable/pinchable invitation desk, zoom controls and explicit edit/preview modes. The four existing control sections, serial autosave queue, retry, event-detail save and publish snapshot rules remain functional. |
| Seating | An atlas of selectable table rings displays actual used/capacity figures. Selection opens one table's real guest list; all-tables mode and guest search reveal the entire room. Existing assignment, removal and overcapacity confirmation remain. |
| Replies | Three large task lenses open pending, linked-recent and unresolved general-link replies. Counts use actual service data; selection does not automatically resolve or send anything. |
| Other screens | New chapter navigation, surface/type hierarchy, guest facts, guest-hub arches and reception geometry. QR contrast and the existing invitation engine are retained. |

## Interaction contract

- Drag blank map/desk space to pan. Two independent pointers pinch around their midpoint; zoom is bounded to 70–160%. Buttons provide zoom and pan alternatives. Focused canvases support arrows, `+`, `-` and `0`. Native browser zoom and page scrolling outside the canvas are preserved.
- Station grips move individual tasks. Arrow keys move a station by 24 pixels; Shift-arrows use 8. The station and its connecting line update directly during movement, without rendering the React tree on every pointer event. Release snaps and bounds the position; cancelled/lost capture restores it.
- Only task positions persist locally, under `doyofy:orbit:v1:<event-id>`. Stored shapes and finite coordinates are validated. Reset removes that event's layout. A storage failure retains the current session layout and announces the limitation. Layout changes never edit event or invitation data.
- Switching map/list preserves the current viewport when the canvas remounts. Search commands avoid stacking over another modal. Swipe surfaces prioritize vertical scrolling, reject accidental movements and honour cancellation and pending saves.
- Decorative parallax and idle sculpture movement respect reduced motion. These are code-native CSS/SVG assets; no new raster dependency or remote font was introduced.

## Verification and limits

Fresh checks: application/unit TypeScript; **31 domain/service tests**; **20 DOM behavior tests**; **17 existing route mounts plus 14 Orbit route mounts**; **156 text/action/status token contrast pairs** meeting 4.5:1. DOM coverage includes genuine two-pointer pinch events, pan cancellation, viewport restoration, grip movement and persistence, live line cancellation, complete occasion/template traversal, busy selection, command navigation, chapter validation and real create → template save → editor routing. Table and reply selections are checked against service records.

Production build and **103 shipped asset references** pass. The audience remains owner-private. Browser/device visual QA, native pointer capture feel, real touch, overflow and WebGL playback were **not run**: the required Sites control-browser capability is unavailable. jsdom and token checks do not constitute rendered accessibility or usability evidence.

The original browser-local mock-service boundary remains: events/replies do not synchronize across devices; automatic messaging, roles and camera scanning are simulated. Orbit changes the review prototype's UI and interaction model, not that backend boundary.
