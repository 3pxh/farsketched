import { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/contexts/AudioProvider';
import * as Tone from 'tone';
import './UniqueEmoji.css';

const emojiList = [
  // Original emojis
  "🐶", "🌴", "🍒", "👻", "🤖", "🚀", "💜",
  "🤠", "🐱", "💕", "🌟", "👽", "🌈", "🎉",
  // Animals
  "🐼", "🦁", "🐯", "🦊", "🐨", "🦒", "🦘", "🦥", "🦦", "🦨",
  "🦡", "🦫", "🦦", "🦥", "🦨", "🦡", "🦫", "🦦", "🦥", "🦨",
  // Food & Drink
  "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥨", "🥯", "🥖", "🧀",
  "🍳", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌮", "🌯",
  // Nature
  "🌸", "🌺", "🌹", "🌷", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚",
  "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎",
  // Activities
  "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓",
  "🏸", "🏒", "🏑", "🥍", "🏏", "🥊", "🥋", "⛳", "⛸️", "🎣",
  // Objects
  "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽",
  "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️",
  // Faces
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  // Fantasy
  "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "🧠", "🧡", "🧢",
  "🧣", "🧤", "🧥", "🧦", "🧧", "🧨", "🧩", "🧪", "🧫", "🧬",
  // Misc
  "🎭", "🎪", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷",
  "🎺", "🎸", "🎻", "🎲", "🎯", "🎳", "🎮", "🎰", "🧩", "🎨"
];

export const UniqueEmoji = () => {
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const collected = useRef<Set<string>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const currentScore = useRef(0);
  const { playNote, playSound } = useAudio();
  const [randomizedEmojis, setRandomizedEmojis] = useState<string[]>(emojiList.sort(() => Math.random() - 0.5));
  const nextEmojiIndex = useRef(3);
  const currentEmoji = useRef<Set<string>>(new Set(
    randomizedEmojis.slice(0, 3)
  ));

  // Initialize audio when component mounts
  useEffect(() => {
    const initAudio = async () => {
      await Tone.start();
    };
    initAudio();
  }, []);

  useEffect(() => {
    currentScore.current = score;
  }, [score]);

  const startGame = () => {
    setGameStarted(true);
    setGameRunning(true);
    playSound('sparkle');
  };

  const spawnEmoji = () => {
    if (!gameRunning || !gameRef.current) return;
    console.log(currentEmoji.current);
    // Get a random emoji from the current available set
    const availableEmojis = Array.from(currentEmoji.current);
    if (availableEmojis.length === 0) return;
    
    const emoji = document.createElement("div");
    emoji.className = "emoji";
    const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    emoji.textContent = randomEmoji;
    emoji.style.left = Math.random() * 95 + "vw";
    emoji.style.top = "-2rem";
    gameRef.current.appendChild(emoji);

    let y = -32;
    const speed = Math.random() * 1 + 1;

    const interval = setInterval(() => {
      if (!gameRunning) {
        clearInterval(interval);
        emoji.remove();
        return;
      }

      y += speed;
      emoji.style.top = y + "px";

      if (y > window.innerHeight) {
        emoji.remove();
        clearInterval(interval);
        intervals.current.delete(interval);
      }
    }, 16);

    intervals.current.add(interval);

    emoji.addEventListener("click", () => {
      if (collected.current.has(emoji.textContent || '')) {
        playSound('whoosh');
        endGame();
      } else {
        collected.current.add(emoji.textContent || '');
        setScore(prev => prev + 1);
        currentEmoji.current.add(randomizedEmojis[nextEmojiIndex.current]);
        nextEmojiIndex.current++;
        playNote('C4', '8n');
        emoji.remove();
        clearInterval(interval);
        intervals.current.delete(interval);
      }
    });
  };

  const endGame = () => {
    setGameRunning(false);
    if (currentScore.current > highscore) {
      setHighscore(currentScore.current);
      console.log("New highscore:", currentScore.current);
    }

    // Remove click handlers from all emojis while keeping animations
    if (gameRef.current) {
      const emojis = gameRef.current.getElementsByClassName('emoji');
      Array.from(emojis).forEach(emoji => {
        (emoji as HTMLElement).style.pointerEvents = 'none';
      });
    }
  };

  const restartGame = () => {
    // Clear all intervals
    intervals.current.forEach(interval => clearInterval(interval));
    intervals.current.clear();
    
    // Remove all emojis
    if (gameRef.current) {
      const emojis = gameRef.current.getElementsByClassName('emoji');
      while (emojis.length > 0) {
        emojis[0].remove();
      }
    }

    setGameRunning(true);
    setScore(0);
    currentScore.current = 0;
    collected.current.clear();
    setRandomizedEmojis(emojiList.sort(() => Math.random() - 0.5));
    currentEmoji.current = new Set(
      randomizedEmojis.slice(0, 3)
    );
    nextEmojiIndex.current = 3;
    playSound('sparkle');
  };

  useEffect(() => {
    if (!gameStarted) return;
    
    const interval = setInterval(spawnEmoji, 200);
    intervals.current.add(interval);
    return () => {
      clearInterval(interval);
      intervals.current.delete(interval);
    };
  }, [gameRunning, gameStarted]);

  return (
    <div id="game" ref={gameRef}>
      <div id="highscore">High Score: {highscore}</div>
      <div id="score">Score: {score}</div>
      {!gameStarted ? (
        <div id="game-over">
          <button id="restart-btn" onClick={startGame}>Start Game</button>
        </div>
      ) : !gameRunning && (
        <div id="game-over">
          out of RAM<br />
          <button id="restart-btn" onClick={restartGame}>Again!</button>
        </div>
      )}
    </div>
  );
}; 