# Think Tank Trivia GDD

## Summary
Players collectively pose multiple choice questions to an AI which picks what it considers the best answer. The players get points if their answer is picked, or if they guess the correct answer. The game config can be modified to give the AI a personality which changes its choices, for example "you are a golden retriever", allowing infinite replay and player customizability.

## Game Flow
1. Player clients join a lobby, meanwhile the host can customize the system prompt instructions. Once all the players are present one of them triggers the game to start.
2. Players are all given a text input with the invitation to write a question they would like to ask the AI.
3. For each question,
    - the players are given a text input which asks them to write an answer
    - after all the answers have been submitted (or the time runs out) the players are shown all of the answers and asked to choose which one they think the AI will pick. Meanwhile the game sends a request to a language model composed of the instructions, the question and answers, and is called requesting structured output with a zod schema enforcing its output to be {answer: one of the user answers}.
    - on completion of the request the game stores the answer the AI picked
    - once all players have guessed, the game calculates their scores (+5 for guessing correctly, +5 for the AI picking the answer you wrote) and shows the players a scoreboard
4. Go back to 2 until 3 rounds of questions have been played.
5. Show a final scoreboard with achievements.

## Questions
- How do we want to define the output format, and how much of a difference is there? (If we give each answer a letter and ask for that, versus having it repeat a whole answer, ...)
- Do we increase the scoring per round? Or accentuate the character? (You REALLY a golden retriever. Be EXTRA golden retriever.) Give a sense of progression.
- Do we play a full three rounds, or 2 rounds plus a final question? (If final question: who writes that? We could pick from the host's saved images from Farsketched at random and use that for fodder?)

## Ideas
- The in-game announcer text/speech can be generated from the language model using the system character defined by the host.
