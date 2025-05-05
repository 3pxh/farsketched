import { ChatInterface } from "./components/ChatInterface";
import "./App.css";
import { PeerProvider } from './contexts/PeerContext';
import { usePeer } from './contexts/PeerContext';

function ClientConnectionForm() {
  const { peerId, hostPeerId, setHostPeerId, isConnected, connectToHost } = usePeer();

  return (
    <div>
      <div className="peer-id">
        Your Peer ID: {peerId}
      </div>
      {!isConnected ? (
        <div className="connection-form">
          <input
            type="text"
            value={hostPeerId}
            onChange={(e) => setHostPeerId(e.target.value)}
            placeholder="Enter host's Peer ID"
          />
          <button onClick={connectToHost}>Connect to Host</button>
        </div>
      ) : (
        <div className="connection-status">
          Connected to host: {hostPeerId}
        </div>
      )}
    </div>
  );
}

function ClientApp() {
  return (
    <PeerProvider isHost={false}>
      <main className="container">
        <h1>Client Chat Room</h1>
        <ClientConnectionForm />
        <ChatInterface />
      </main>
    </PeerProvider>
  );
}

export default ClientApp;
