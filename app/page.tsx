import ChatPage from '@/components/ChatPage';

// The chat page IS the product. ChatPage is a Client Component that owns
// all layout and onboarding state. Streaming and message logic added in SAN-30.
export default function Home() {
  return <ChatPage />;
}
