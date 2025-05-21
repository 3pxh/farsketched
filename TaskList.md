# Farsketched Implementation Task List

## On Deck
- [ ] be able to go back to choose a game screen
- [x?] client phone slow down (memory leak? reprocessing messages?) (if still slow look into immer)
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

### TURN server notes
- we'll need a TURN server for certain connection types to succeed, but expect most things to use STUN and not consume bandwidth
- using metered.ca free plan at the moment
- if we find bandwidth is expensive, we could cut large things out of the game state (e.g. no images? or: make the game state provider not broadcast image patches to clients who are in the room if we make a notion of local/remote players)
- if we want to protect against abuse (people sending data over the turn server), we might be able to 1. allow a particular domain (for the client) and 2. sign a key for the host (by looking up their steam id)
- also re: abuse, the current keys are checked into git so they'd have to be rotated out (and they will have to be public for a web client)

## Nits
- [ ] if no images created, what happens when time runs out? (pause screen or game over?)
- [ ] tauri audio autoplay https://github.com/tauri-apps/tauri/issues/3478 ("additionalBrowserArgs": "--autoplay-policy=no-user-gesture-required", https://v2.tauri.app/reference/config/#windowconfig)

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


##what if
- the image creator saw votes as they come in. meh prolly no
- the image stays on the scoring screen
- the prompt gets shared with the image on 'share', -from Farsketched
- [x] the client stays on the game over screen even after the host disconnects
- the images show after credits
- a play again button that takes us back to the lobby
- there was an AI player in the mix (from clifford)
- there wasn't a timer on the game over screen
- there was a _-^ button on the game over screen that pops up the score
- there was a round score screen that showed who got what this round
- there was more time on the scoring screen
- that the real prompt was better highlighted. 
- we didn't have 'future master piece here'
- [x] we didn't have 'gallery of all images'
- [x]we had "around the prompt" on game over 
- there were 3 screens on the scoring stage
  - reveal votes  
                  [image] 
      [Avatar][prompt][voters]
       [Name]
  - image with "prompt" and author (4 seconds){tada!}
                [Image]
          [Avatar]["prompt"][guessers]
          [-author]
  - leaderboard
- the toast message disappeared after clicking copy url -> maybe just change the text in the button
- players could ready up
  - host could start
- the host could x people from the lobby
- prompts were not all caps in the gussing stage OR WERE i vote as was written so shall we show
- we made a componant that was avatar+name
- we made a componant that was prompt + author
- Hint: you want to see guesses next to your [prompt:name]
- Game flow {prompt}=>[image]=>{fooling prompt}=>(guessing)=><scoring>


