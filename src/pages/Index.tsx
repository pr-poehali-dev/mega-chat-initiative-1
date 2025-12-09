import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

type Language = 'ru' | 'en';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const translations = {
  ru: {
    title: 'Mega Chat',
    subtitle: 'Ваш персональный AI-ассистент',
    placeholder: 'Напишите ваше сообщение...',
    send: 'Отправить',
    support: 'Поддержка',
    supportTitle: 'Свяжитесь с нами',
    name: 'Ваше имя',
    email: 'Ваш email',
    message: 'Ваше сообщение',
    submit: 'Отправить',
    successMessage: 'Сообщение успешно отправлено!',
    welcomeMessage: 'Привет! Я Mega Chat AI. Чем могу помочь сегодня?',
    thinkingMessage: 'Обрабатываю ваш запрос...'
  },
  en: {
    title: 'Mega Chat',
    subtitle: 'Your personal AI assistant',
    placeholder: 'Type your message...',
    send: 'Send',
    support: 'Support',
    supportTitle: 'Contact us',
    name: 'Your name',
    email: 'Your email',
    message: 'Your message',
    submit: 'Submit',
    successMessage: 'Message sent successfully!',
    welcomeMessage: 'Hello! I\'m Mega Chat AI. How can I help you today?',
    thinkingMessage: 'Processing your request...'
  }
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<Language>('ru');
  const [supportOpen, setSupportOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const t = translations[language];

  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: t.welcomeMessage,
      timestamp: new Date()
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('https://functions.poehali.dev/da5a9482-af32-4f73-8ef3-6923bcc3f9fe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          language: language
        })
      });

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || (language === 'ru' ? 'Извините, произошла ошибка.' : 'Sorry, an error occurred.'),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'ru' 
          ? 'Извините, не удалось получить ответ. Проверьте подключение к интернету.' 
          : 'Sorry, failed to get a response. Please check your internet connection.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSupportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: t.successMessage,
      duration: 3000,
    });
    setSupportOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-effect border-b border-border sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-purple-pink rounded-xl flex items-center justify-center">
              <Icon name="MessageSquare" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{t.title}</h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="hover:bg-primary/10"
            >
              <Icon name="Languages" size={18} />
              <span className="ml-2">{language === 'ru' ? 'RU' : 'EN'}</span>
            </Button>
            
            <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gradient-purple-pink text-white border-0 hover:opacity-90">
                  <Icon name="Headphones" size={18} />
                  <span className="ml-2">{t.support}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect">
                <DialogHeader>
                  <DialogTitle className="text-xl gradient-text">{t.supportTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSupportSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">{t.name}</Label>
                    <Input id="name" required className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label htmlFor="email">{t.email}</Label>
                    <Input id="email" type="email" required className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label htmlFor="support-message">{t.message}</Label>
                    <Textarea id="support-message" required className="mt-1 bg-muted/50 min-h-[100px]" />
                  </div>
                  <Button type="submit" className="w-full gradient-purple-orange text-white border-0">
                    {t.submit}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className={`max-w-[80%] p-4 ${
                  message.role === 'user' 
                    ? 'gradient-purple-pink text-white' 
                    : 'glass-effect'
                }`}>
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg gradient-purple-orange flex items-center justify-center flex-shrink-0">
                        <Icon name="Bot" size={18} className="text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={message.role === 'user' ? 'text-white' : 'text-foreground'}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <Card className="glass-effect p-4 max-w-[80%]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-purple-orange flex items-center justify-center">
                      <Icon name="Bot" size={18} className="text-white" />
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="glass-effect rounded-xl p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.placeholder}
                className="flex-1 bg-muted/50 border-0"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="gradient-purple-pink text-white border-0 hover:opacity-90"
              >
                <Icon name="Send" size={18} />
                <span className="ml-2 hidden sm:inline">{t.send}</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;