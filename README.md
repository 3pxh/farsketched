
## Pitch
A multiplayer game where players give prompts to an image generator and then try to guess the prompt which made an image while tricking the others by making up alternate prompts.
Supports 3-10 players

## Technical Constraints
- Built in Typescript and React with Vite and plain CSS
- Host runs a Tauri desktop application which has a sqlite database which stores their settings and past games (including images).
- Clients load a web page on their phones. (This page has its own build command which makes it.)
- Peer to peer connections established by webrtc and public STUN servers
- JSON  based message passing (with typescript signatures)
- Image generation API key is provided by the host who puts it in their settings. We'll start with Stable Diffusion and add other providers later.

###  Game Flow
- When the host starts a new game it shows a qr code which the clients scan on their phones. This directs them to the web page and also includes a url parameter with the private room id which establishes the peer connection
- Local storage saves a generated uuid player id which can identify the player across reloads.
- As players are joining, they're given the option to set a name and picture which sends messages to the host who rebroadcasts to  the other players.
- After setting a name and picture players have a "Start game" button which when clicked starts a countdown on their phone with a "cancel" button to interrupt it. If it counts all the way down, it tells the host to start the game with the current players who have connected.
- When the game starts, all players see a text input with instructions to write a prompt for the image generator, along with a submit button. When they submit their prompt it sends a message to the host, who runs the prompt through the image generation API and stores the result associated with that player. There is additionally a timer which counts down 45 seconds. Once either all players submit their prompts or the time runs out, the game moves into the next stage: guessing.
- Next the host runs a round of guessing for each image generated which includes the following steps:
	- 1) For fooling the host shows the image and broadcasts a message to all the player devices so that they show another text input with instructions to type an alternate prompt to fool the other players, as well as a submit button, with the exception of the player who generated the image (who sees only "You are responsible for this masterpiece". Again, once all players submit lies or the timer (45 seconds) runs out, the game progresses to guessing.
	- 2) For guessing the host shows the image as well as each of the lies plus the true prompt all in the same style so the players can't tell. They are given buttons on their devices to be able to select one  of the options, with the exception of the player who generated the image. Once all players have selected a guess (or the timer runs out, this time 20 seconds) the game moves to scoring.
	- 3) For scoring the host shows each of the lies and the  truth, but this time the true prompt is styled differently so players can tell. The author of each of the prompts is indicated by their picture to the left of it, and to the right all of the players who guessed that prompt are shown. Players are awarded 5 points for guessing the truth, 3 points for each person who guessed the lie they wrote, and if they created the image they get 3 points for each person who guessed the real prompt. Cumulative point totals are shown as well.
	- 4) Continue back at fooling until we've gone through all of the generated images in the round.
- We run a total of 3 rounds of prompting in the course of a game, so each player will make a total of 3 images. After the final image of the final round, we show a scoring and achievement screen. The scoring shows the cumulative point values for each player. Achievements include
	- who guessed the truth the most times (Most Accurate)
	- the person whose lies got picked the most (Best Bullshitter)
	- the person whose images got the biggest spread of votes across different prompts during guessing (The Chaotician)
	- the person whose images had the true prompt picked the most (The Painter)

### Error Handling and Resilience
- Disconnection will most likely occur. People's phones turn off, and they turn them back on. We would like clients to notice if they have lost connection and automatically try to reestablish it. As a fallback, we'd like the player to be able to refresh the page and re-establish connection with the host, which will tell them which state they should be in and what they should display (including their player name and picture if they selected it).
- Since a client could send a message, refresh, and send it again, we must make sure that messages are always handled idempotently by the host. (So if  a player submitted a prompt to generate an image, they may not generate another that round. Same for other inputs, like guessing a true prompt.)
- The one point of failure that we'll have to account for is the image generation API, which might not succeed. In that case, we would like to pass the error back to the client who produced the image and give them another chance (if they still have time). The reason might include something like filtered content which could allow them to adjust their prompt.

### System Design
- The host will store a single state object representing the full picture of the game state, and render from that. When the host receives a message (or the timer for a stage runs out), it goes into a game state reducer function which takes the original state and the message and returns a new state.
	- We don't need this to persist. If the host machine crashes, we'll expect them to start a new game rather than trying to recover the old one.
- There should be a set of allowable message types which are well defined (and handled by the state reducer)

### Testing
Unit tests on the game state reducer should cover most of the game logic. We'd like to try various combinations of signaling at various states in the game, and perhaps enforce that certain invariants hold (as an example, there should never be more generated images than players).
Test that clients show the correct UI when being told from the host what state the game is in if it needs input.

### Aesthetics
- Client inputs can be clean and minimal. The timer can be a bar which shrinks and changes color.
- On  the host, we'd like some animations and sounds (no sound or animation is needed on the client):
	- When showing a new image which players are going to write alternate prompts (lies) for, let's have the image dissolve in with some little chimes.
	- When showing all of the prompts players can pick from, let's reveal them one at a time, having them fly in and playing a sound effect for each one landing (we can use a webaudio beep to start, and design a "whap!" to make it punchier).
	- Scoring is similarly shown one item at a time, and the players who voted for each option whisked down one at a time with a little whoosh sound
	- When the timer gets to the final 10 seconds host starts playing a ticking sound at once per second which speeds up to twice per second during the last 5 seconds (again, using webaudio).
	- We'll use the web speech API's SpeechSynthesis to render voiceovers at various points. This includes the lobby screen saying various greetings while people join the room and when the game starts, as well as saying "Time's Up" on the timers ending or "Let's see how you did" when showing scores
- We'll use a font which is irreverent but legible, has some personality and renders everything in all caps. Maybe SignPainter or something like it.
