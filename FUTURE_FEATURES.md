# Future Features

Ideas considered but intentionally deferred. Captured here so they aren't lost; not
committed to a release. Each entry notes the value, a sketch of the approach, and the
main cost so a future round can scope it quickly.

## Supply / refill tracking — *highest priority*
Track how much of each medication is on hand so a refill never sneaks up.

- **Value:** A med tracker that knows when you're about to run out is meaningfully more
  useful than one that doesn't. Fits the "never miss a dose" purpose directly.
- **Approach:**
  - Add `quantity_on_hand` (and optionally `refills_remaining`) to `medications`.
  - Decrement `quantity_on_hand` by `dose_amount` whenever a dose is logged (and add it
    back on undo/edit).
  - A `low_supply_threshold` per med; when on-hand drops below it, surface a banner on
    Today and send a push via the existing reminders cron.
  - A simple "Refilled — set new quantity" action on the med detail page.
- **Cost:** Schema migration, dose-log write paths must adjust quantity (including undo
  and edit), plus new cron logic and copy for low-supply alerts. Edit/undo bookkeeping is
  the fiddly part — quantity must stay consistent across every dose-log mutation.

## Skip-with-reason
Log a dose as deliberately *skipped* (vomited it back up, vet said hold) rather than
simply missing.

- **Value:** History reflects intent, not just absence — better record for the vet.
- **Approach:** Add a status to `dose_logs` (e.g. `given` | `skipped`) plus the existing
  notes. Show skipped doses distinctly in Today and History.
- **Cost:** Small schema change; UI affordance on the dose modal and history rows.

## Overdue escalation reminder
A follow-up nudge if a due dose still isn't logged N minutes after its time.

- **Value:** The current cron only pings at the scheduled minute; a half-asleep caretaker
  can miss that single buzz.
- **Approach:** Extend the reminders cron to re-check unlogged slots past their time and
  send a gentle escalation, deduped like the first reminder.
- **Cost:** Cron logic + an additional `notifications_sent`-style dedupe key.

## Export history for the vet
Export the dose-log history for a date range as CSV or a print-friendly view.

- **Value:** Directly serves the "something you could hand a vet" goal.
- **Approach:** A server route that streams CSV, or a `/history/print` view styled for
  print. Reuse the existing history query + filters.
- **Cost:** Low; mostly formatting.

## Weight log
Track the dog's weight over time.

- **Value:** Dosing is often weight-based; a trend is handy at checkups.
- **Approach:** New `weight_logs` table (date, weight), a small entry form, a sparkline.
- **Cost:** Low–medium; new table + a lightweight chart.
