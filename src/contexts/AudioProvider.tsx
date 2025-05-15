import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface AudioContextValue {
  playNote: (note: string, duration?: string) => void;
  playSound: (sound: string, duration?: string) => void;
  audioEnabled: boolean;
  volume: number;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextValue>({
  playNote: () => {},
  playSound: () => {},
  audioEnabled: false,
  volume: 0,
  setVolume: () => {},
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [volume, setVolumeState] = useState(0);
  const synthRef = useRef<Tone.Synth | null>(null);

  // Convert linear volume (0-1) to decibels (-Infinity to 0)
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    // Convert to decibels, avoiding -Infinity when volume is 0
    const dbVolume = clampedVolume === 0 ? -Infinity : Tone.gainToDb(clampedVolume);
    Tone.Destination.volume.value = dbVolume;
  };

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    const enableAudio = async () => {
      await Tone.start();
      setAudioEnabled(true);
      // Set initial volume to 0.75
      setVolume(0.75);
      console.log("Audio enabled");
    };
    document.addEventListener('click', enableAudio, { once: true });
    return () => {
      if (synthRef.current) synthRef.current.dispose();
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  const playNote = (note: string, duration: string = '8n') => {
    if (audioEnabled && synthRef.current) {
      try {
        synthRef.current.triggerAttackRelease(note, duration);
      } catch (e) {
        // ignore
      }
    }
  };

  // Complex named sounds
  const playSound = (sound: string, duration: string = '8n') => {
    if (!audioEnabled) return;
    switch (sound) {
      case 'chime': {
        // Bell-like arpeggio
        const now = Tone.now();
        const bell = new Tone.MembraneSynth().toDestination();
        bell.triggerAttackRelease('C5', '8n', now);
        bell.triggerAttackRelease('E5', '8n', now + 0.08);
        bell.triggerAttackRelease('G5', '8n', now + 0.16);
        setTimeout(() => bell.dispose(), 500);
        break;
      }
      case 'laser': {
        // Quick pitch sweep
        const synth = new Tone.MonoSynth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        synth.triggerAttackRelease('C6', '16n');
        synth.frequency.rampTo('C3', 0.2);
        setTimeout(() => synth.dispose(), 300);
        break;
      }
      case 'pop': {
        // Percussive blip
        const synth = new Tone.MembraneSynth().toDestination();
        synth.triggerAttackRelease('C3', '32n');
        setTimeout(() => synth.dispose(), 150);
        break;
      }
      case 'whoosh': {
        // Filtered noise sweep
        const noise = new Tone.Noise('white').start();
        const filter = new Tone.Filter(800, 'lowpass').toDestination();
        noise.connect(filter);
        filter.frequency.rampTo(50, 0.5);
        setTimeout(() => {
          noise.stop();
          noise.disconnect();
          filter.dispose();
          noise.dispose();
        }, 500);
        break;
      }
      case 'sparkle': {
        // Fast, high-pitched twinkle
        const synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
        const now = Tone.now();
        synth.triggerAttackRelease('C7', '32n', now);
        synth.triggerAttackRelease('E7', '32n', now + 0.04);
        synth.triggerAttackRelease('G7', '32n', now + 0.08);
        setTimeout(() => synth.dispose(), 200);
        break;
      }
      default:
        playNote(sound, duration);
    }
  };

  return (
    <AudioContext.Provider value={{ playNote, playSound, audioEnabled, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext); 