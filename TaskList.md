# Farsketched Implementation Task List

## On Deck
- [ ] allow host to continue from game over stage (or maybe roll credits?)
- [ ] send client crashes to host? (how?) for diagnosing
- [ ] Add Narrator
- [ ] remove vertical scroll on client
- [ ] change the peer context to allow subscribers to message routes, e.g. 'farsketched' -> farsketchedReducer as a callback (have 'game.xxx', 'global.gamestate', )

### Narrator notes
- once we have arbitrary subscribers to peer context, we'll make a narrator provider
- NarratorProvider knows if it's a host or not, exposes narrate(text)
- if host: speak and send a message to peers
- if not host: subscribes to messages and narrate() as a callback

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

## Testing
- [ ] Integration tests:
  - [ ] WebRTC connection
  - [ ] Game flow
  - [ ] Error scenarios
- [ ] End-to-end tests:
  - [ ] Complete game scenarios
  - [ ] Connection recovery
  - [ ] API integration

## Publishing
- [ ] Store Listings
  - [ ] Steam? Mac? ...
  - [ ] File a new corporation?
  - [ ] Pricing? Some initial credits, plus use your own API key? Hm.
- [ ] Web version which runs the host in the cloud?
