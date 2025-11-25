# Configuration Documentation (`settings.json`)

This document explains the structure and possible values for the `src/api/settings.json` file, which acts as the database for the Friends Awards service.

## Global Service Configuration (`service`)

The `service` object tracks the overall state of the awards ceremony.

```json
"service": {
  "name": "Friends Awards",
  "description": "Annual Friends Awards",
  "status": "started",
  "active_round_id": "1763931255233"
}
```

### `status` Options
- **`not_started`**: The initial state. The Admin Panel allows adding categories. The "Start Awards" button is visible to admins. Users see a "Waiting for Admin" message.
- **`started`**: The awards ceremony is in progress. The `active_round_id` points to the current category being voted on. Users are directed to the Voting page.
- **`finished`**: All categories have been voted on and completed. The application shows a "Awards Finished" message.

## Rounds Configuration (`rounds`)

The `rounds` array stores the history and current state of voting for each category. A new round object is created when the service starts and when moving to the next category.

```json
{
  "id": "1763931255233",
  "category_id": "1763929507959",
  "status": "voting",
  "votes": [],
  "has_draw": false,
  "tie_break_participants": [],
  "tie_break_votes": [],
  "result": null
}
```

### `status` Options
- **`voting`**: The default state for a new round. All participants (except the user themselves) are eligible to be voted for.
- **`tie_breaker`**: Entered automatically if a `reveal` action results in a tie.
    - Only participants listed in `tie_break_participants` can receive votes.
    - Votes are stored in `tie_break_votes` instead of the main `votes` array.
- **`revealing`**: Entered when the admin clicks "Reveal Votes" and there is a clear winner.
    - The frontend plays a dramatic animation.
    - The winner is displayed.
- **`completed`**: Entered when the admin clicks "Next Category". The round is finalized, and the system moves to the next category (creating a new round).

### Key Fields
- **`has_draw`** *(boolean)*: Indicates if a tie occurred during the main voting phase.
- **`tie_break_participants`** *(array of strings)*: List of participant IDs involved in the tie. Only these users are displayed as options during the `tie_breaker` status.
- **`tie_break_votes`** *(array of objects)*: Stores votes cast during the tie-breaker phase. Structure is same as `votes`: `[{ "voterId": "...", "votedForId": "..." }]`.
- **`result`** *(object)*: Populated when status is `revealing` or `completed`. Contains:
    - `winnerId`: ID of the winning participant.
    - `stats`: Object mapping participant IDs to their vote count (e.g., `{"id1": 5, "id2": 3}`).
