import { UniqueEmoji } from '@/games/lobby/UniqueEmoji';
import { AudioProvider } from '@/contexts/AudioProvider';

export default {
  'Default': (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <AudioProvider>
        <UniqueEmoji />
      </AudioProvider>
    </div>
  ),

  'Small Container': (
    <div style={{ width: '400px', height: '600px', background: '#000' }}>
      <AudioProvider>
        <UniqueEmoji />
      </AudioProvider>
    </div>
  ),
}; 