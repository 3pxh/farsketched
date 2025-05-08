import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface AudioContextValue {
  playNote: (note: string, duration?: string) => void;
  audioEnabled: boolean;
}

const AudioContext = createContext<AudioContextValue>({
  playNote: () => {},
  audioEnabled: false,
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    const enableAudio = async () => {
      await Tone.start();
      setAudioEnabled(true);
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

  return (
    <AudioContext.Provider value={{ playNote, audioEnabled }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext); 