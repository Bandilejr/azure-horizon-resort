import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sendChatMessage, listenForChatMessages } from '@/services/firebase-services';
import { MOCK_ROOM_GUIDE } from '@/services/mock-data';
import type { ChatMessage, GuideSection, User as CustomUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  BookOpen, 
  Send, 
  Bot,
  MapPin,
  UtensilsCrossed,
  Sparkles,
  Palmtree,
  Home,
  Wifi,
  // REMOVED Clock to fix unused variable error
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';

interface GuestExperienceProps {
  onBack: () => void;
}

export function GuestExperience({ onBack }: GuestExperienceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // FIX: Initialized with mock data directly to avoid cascading render warning
  const [guideSections] = useState<GuideSection[]>(MOCK_ROOM_GUIDE);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // FIX: Using CustomUser type instead of any
    const u = user as CustomUser;
    const userId = u?.id;
    
    if (!userId) return;

    const unsubscribe = listenForChatMessages(userId, (updatedMessages) => {
      setMessages(updatedMessages as ChatMessage[]);
    });
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsTyping(true);
    const u = user as CustomUser;

    const result = await sendChatMessage({
      senderId: u.id,
      senderName: u.name,
      senderRole: 'guest',
      message: newMessage,
      isRead: false
    } as ChatMessage);

    if (result.messageId) {
      setNewMessage('');
    }
    
    setIsTyping(false);
  };

  const getIconForSection = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      MapPin, UtensilsCrossed, Sparkles, Palmtree, Home, Wifi,
    };
    const Icon = icons[iconName] || MapPin;
    return <Icon className="h-5 w-5" />;
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1e3a5f]">Guest Experience</h2>
          <p className="text-gray-600 text-sm">Concierge assistance & room information</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Digital Concierge
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Room Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card className="h-[600px] flex flex-col border-none shadow-lg">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Digital Concierge</CardTitle>
                  <p className="text-xs text-gray-500">Available 24/7</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderRole === 'guest' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.senderRole === 'guest'
                        ? 'bg-[#1e3a5f] text-white rounded-2xl rounded-tr-sm'
                        : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                    } px-4 py-3 shadow-sm`}
                  >
                    {message.senderRole !== 'guest' && (
                      <p className="text-xs font-bold mb-1 opacity-70 uppercase">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <p className={`text-[10px] mt-1 text-right ${
                      message.senderRole === 'guest' ? 'text-white/60' : 'text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* FIX: Replaced inline styles with Tailwind animation delays */}
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 focus-visible:ring-[#c9a227]"
                />
                <Button
                  className="bg-[#c9a227] hover:bg-[#b8941f] text-white"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isTyping}
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {guideSections.map((section) => (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-md border-none shadow-sm ${
                  expandedSection === section.id ? 'ring-2 ring-[#c9a227]' : ''
                }`}
                onClick={() => setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center text-[#1e3a5f]">
                        {getIconForSection(section.icon)}
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === section.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </CardHeader>
                
                {expandedSection === section.id && (
                  <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="border-t pt-4">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}