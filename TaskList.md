# Farsketched Implementation Task List

## Developer Experience
- [ ] Run the client via vite. When gh tried peerjs wouldn't connect, unlike the python server. It would be nice for hot module reloading.
- [ ] Having a single-component workflow where we mock data would be nice. Storybook seems heavyweight, but maybe something similar. Might take care of most of the use above too. 

## Game functionality
- [ ] Go through all images in a round
- [ ] Play multiple rounds
- [ ] Final scoring screen, show players all the images on their devices w/ ability to save
- [ ] Handle edge cases

## Logging / Feedback
- [ ] Add some logging which we can use to diagnose crashes? Having a host send us a stack trace as well as the set of all messages ever processed would be convenient. Also the ability to report in-game that something is wrong (and sends us a list of all the messages received).

## Aesthetics / Fun
- [ ] Add an in-game announcer who speaks
- [ ] Background music
- [ ] Sound effects
- [ ] Animations
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
- [ ] Unit tests:
  - [ ] Game state reducer
  - [ ] Message handling
  - [ ] Scoring calculations
  - [ ] Achievement calculations
- [ ] Integration tests:
  - [ ] WebRTC connection
  - [ ] Game flow
  - [ ] Error scenarios
- [ ] End-to-end tests:
  - [ ] Complete game scenarios
  - [ ] Connection recovery
  - [ ] API integration

## Publishing
- [ ] Github pages or netlify site with the clientindex.html
  - [ ] Add the url as the base in the qr code (but not in development)
- [ ] Store Listings
  - [ ] Steam? Mac? ...
  - [ ] File a new corporation?
  - [ ] Pricing? Some initial credits, plus use your own API key? Hm.
- [ ] Web version which runs the host in the cloud?
