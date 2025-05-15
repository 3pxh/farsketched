import { PlayerSetup } from '../PlayerSetup';
import { PeerProvider } from '@/contexts/PeerContext';
import { AudioProvider } from '@/contexts/AudioProvider';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AudioProvider>
    <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {children}
    </div>
  </AudioProvider>
);

export default {
  'Initial State': (
    <Wrapper>
      <PeerProvider isHost={false} peerId="player1">
        <PlayerSetup />
      </PeerProvider>
    </Wrapper>
  ),
}; 