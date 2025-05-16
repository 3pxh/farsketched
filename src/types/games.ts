export enum Game {
  FARSKETCHED = 'farsketched',
  FLIBBERTIGIBBET = 'flibbertigibbet'
}

export type GameType = keyof typeof Game; 