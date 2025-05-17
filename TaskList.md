# Farsketched Implementation Task List

## On Deck
- [ ] add "instructions" to game config for Flibbertigibbet and insert them in the openai call. Then have some presets which are configurable in the host lobby.
  - [ ] rethink where the game config sits. api keys should be stored via settings, but aother aspects of the config might get set from host lobby
  - [ ] gameconfig will sit at the game level (not at the App level) - the API call layer will be the purview of both Settings/settings as well as the generation api functions. 
- [ ] allow host to continue from game over stage (or maybe roll credits?)
- [ ] send client crashes to host? (how?) for diagnosing
- [ ] Add Narrator
- [ ] change the peer context to allow subscribers to message routes, e.g. 'farsketched' -> farsketchedReducer as a callback (have 'game.xxx', 'global.gamestate', )? (we might want this if we begin sending narration messages to the client. no one but the peer context should be removing the messages, and it should only do it after furnishing them to all consumers)
- [ ] There's a bug when two players join at the same time and the host doesn't make player objects for both of them. Not sure why this happens (do they have the same id?), if it could be a race condition, a peerjs thing, ... -- the extra unfortunate thing is this can actually lead to the peer id being "taken" on the player who doesn't get a player id when they try to refresh -- come to think of it I wonder if this could be from the peerjs requests happening at the same time and getting the same id. This might have only been the case on the airplane... presumably real people on phones will be less likely to hit this (also maybe their different IPs will get them distinct id's, idk how assignment works by the stun server -- at worst maybe we have them roll their own id)

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
