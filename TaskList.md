# Farsketched Implementation Task List

## On Deck
- [ ] be able to go back to choose a game screen
- [x?] client phone slow down (memory leak? reprocessing messages?)
- [x] on reconnecting a client should get the whole game state and moved to the appropriate stage (hypothesis: the call to requestFullState() is happening before the client is connected) (this seems like it works but appeared to be a bug because of how laggy the client phone slow down issue was)
- [ ] Add a fixture which makes the current player equal to the active player so we can verify what it looks like during guessing stage
- [ ] do we want to put the gameconfig on gamestate? (mutating it outside the reducer feels wrong, but we may want the config on the client e.g. for showing the instructions to players in flibbertigibbet)
- [ ] allow host to continue from game over stage (or maybe roll credits?)
- [ ] send client crashes to host? (how?) for diagnosing
- [ ] Add Narrator
- [ ] change the peer context to allow subscribers to message routes, e.g. 'farsketched' -> farsketchedReducer as a callback (have 'game.xxx', 'global.gamestate', )? (we might want this if we begin sending narration messages to the client. no one but the peer context should be removing the messages, and it should only do it after furnishing them to all consumers)
- [ ] Bug in players joining, repro for the current issue: join as a client and put in player info and hit join really quickly (this can happen before the host has established a listener to the client). Maybe look at https://github.com/3pxh/farsketched/commit/b67e27e0cac04a6c558ca3947596e0d6713da103#diff-c2e867840f0fe7e913feda06ee3bda37325a9f0a3acdbe7f81f30d60fd6848be (this change was breaking, no one could connect) More likely fix: look at where the host logs "Connection back to client" and have it send a ready message.

### Narrator notes
- once we have arbitrary subscribers to peer context, we'll make a narrator provider
- NarratorProvider knows if it's a host or not, exposes narrate(text)
- if host: speak and send a message to peers
- if not host: subscribes to messages and narrate() as a callback
- client should have settings of "I am in the room / I am remote"

## Nits
- [ ] if no images created, what happens when time runs out? (pause screen or game over?)

## Developer Experience
- [ ] Run the client via vite. When gh tried peerjs wouldn't connect, unlike the python server. It would be nice for hot module reloading.

## Logging / Feedback
- [ ] Add some logging which we can use to diagnose crashes? Having a host send us a stack trace as well as the set of all messages ever processed would be convenient. Also the ability to report in-game that something is wrong (and sends us a list of all the messages received).

## Aesthetics / Fun
- [ ] Add an in-game announcer who speaks
- [ ] Background music
- [ ] Sound effects
- [ ] Something for people to do while they wait?
  - [ ] ChatGPT says it prefers X or Y? (precompute)

## Error Handling
- [ ] Implement connection recovery:
  - [ ] Automatic reconnection attempts
  - [ ] Store the peer id in localstorage on clients, have them attempt to use the same id to connect (so they're identified as the same player; otherwise we'll need a player id)
  - [ ] State synchronization on reconnection
  - [ ] Handle disconnection gracefully (and don't wait on non-present players)
- [ ] Handle API failures:
  - [ ] Retry logic for image generation?
  - [ ] Error feedback to players on generation failure?

## Publishing
- [ ] Store Listings
  - [ ] Steam? Mac? ...
  - [ ] File a new corporation?
  - [ ] Pricing? Some initial credits, plus use your own API key? Hm.
- [ ] Web version which runs the host in the cloud?
  - [ ] Intercept the api network requests and pipe them through our own provider?
