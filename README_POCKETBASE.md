# PocketBase — Quick Setup for Pifatro

This file explains how to run PocketBase locally, create the minimal collection schema and how to use the `src/utils/pocketbaseClient.js` helper added to the project.

1) Install and run PocketBase (if not already):

```powershell
# Download from https://pocketbase.io/ and unzip, then run:
pocketbase serve
# Default dashboard: http://127.0.0.1:8090
```

2) Create collection `game_states` (Admin UI -> Collections):

- Collection name: `game_states`
- Fields (example):
  - `user` — Type: Relation, related collection: `users`, maxSelect: 1
  - `lives` — Type: Number
  - `coins` — Type: Number
  - `hand` — Type: Text (we store JSON string of the player's hand)
  - `lastUpdated` — Type: Text or DateTime (optional)

Notes: authentication uses PocketBase built-in `users` collection. You can create users from the Admin UI or sign up from the client.

3) How the helper works (`src/utils/pocketbaseClient.js`)

- Call `initPocketBase(url)` early in your app (MainScene.create or entry script). Default `url` is `http://127.0.0.1:8090`.
- Use `signUp(email,password,passwordConfirm,username)` and `loginWithEmail(email,password)` to authenticate.
- After login, call `saveGameState({ lives, coins, hand })` to save or update the single `game_states` record for the authenticated user.
- Use `loadGameState()` to fetch the saved state (returns parsed `hand` array).

4) Example integration (quick):

```js
import pbClient from './src/utils/pocketbaseClient.js';

// init
pbClient.initPocketBase('http://127.0.0.1:8090');

// sign up or login
await pbClient.signUp('me@example.com','123456','123456','myname');
await pbClient.loginWithEmail('me@example.com','123456');

// save the game state
await pbClient.saveGameState({ lives: 2, coins: 150, hand: [{ id: 'AS', rank: 'A', suit: 'S', asset: 'ace_of_spades' }] });

// load
const state = await pbClient.loadGameState();
console.log(state);
```

5) Run dev server for the game (Vite):

```powershell
npm run dev
```

If you want, I can also:
- Add a small login UI scene to the game UI and wire save/load calls to the existing `MainScene` events.
- Add automatic save on `onPifeSuccess` and on scene shutdown.
