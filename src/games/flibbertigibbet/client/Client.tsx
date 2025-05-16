import { GameState } from '../types';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { initialState } from '../reducer';
import { ClientContent } from './ClientContent';

export function Client() {
  return (
    <ClientGameStateProvider<GameState> initialState={initialState} debug={true}>
      <ClientContent />
    </ClientGameStateProvider>
  );
}
