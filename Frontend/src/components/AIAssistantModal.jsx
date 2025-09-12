import React, { useState, useEffect, useRef } from 'react';
import { useTeam } from '../context/TeamContext';
import { useAIAssistant } from '../hooks/useAIAssistant';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  Avatar,
} from '@mui/material';
import { Send, Sparkles, X } from 'lucide-react';

// Yazıyor... efekti için basit bir component
const TypingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ width: 8, height: 8, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }} />
    <Box sx={{ width: 8, height: 8, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
    <Box sx={{ width: 8, height: 8, bgcolor: 'text.secondary', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }
    `}</style>
  </Box>
);

export default function AIAssistantModal({ open, handleClose }) {
  const { activeTeamId } = useTeam();
  const { mutate: askQuestion, isPending, data, reset } = useAIAssistant();

  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const contentRef = useRef(null);

  // Modal her açıldığında eski konuşmayı ve state'i temizle
  useEffect(() => {
    if (open) {
      setConversation([
        { 
          sender: 'ai', 
          text: `Merhaba! Ben TasklyAI. Projelerinizle ilgili ne bilmek istersiniz? Örneğin, "Bu hafta en meşgul kişi kim?" diye sorabilirsiniz.` 
        }
      ]);
      setQuestion('');
      reset(); // React Query mutation'ını sıfırla
    }
  }, [open, reset]);

  // AI'dan yeni bir cevap geldiğinde konuşmaya ekle
  useEffect(() => {
    if (data?.answer) {
      setConversation((prev) => [...prev, { sender: 'ai', text: data.answer }]);
    }
  }, [data]);

  // Yeni mesaj geldiğinde en alta scroll yap
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [conversation, isPending]);

  const handleSend = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion && !isPending) {
      setConversation((prev) => [...prev, { sender: 'user', text: trimmedQuestion }]);
      askQuestion({ question: trimmedQuestion, teamId: activeTeamId });
      setQuestion('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { height: '70vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Sparkles size={24} color="primary" />
        TasklyAI Asistan
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent ref={contentRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2, overflowY: 'auto' }}>
        {conversation.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
            }}
          >
            {msg.sender === 'ai' && <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><Sparkles size={18} /></Avatar>}
            <Box
              sx={{
                bgcolor: msg.sender === 'ai' ? 'action.hover' : 'primary.main',
                color: msg.sender === 'ai' ? 'text.primary' : 'primary.contrastText',
                p: 1.5,
                borderRadius: 2,
                borderTopLeftRadius: msg.sender === 'ai' ? 0 : 2,
                borderTopRightRadius: msg.sender === 'user' ? 0 : 2,
                maxWidth: '80%',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
            </Box>
          </Box>
        ))}
        {isPending && (
          <Box sx={{ display: 'flex', gap: 1.5, alignSelf: 'flex-start' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><Sparkles size={18} /></Avatar>
            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, borderTopLeftRadius: 0 }}>
              <TypingIndicator />
            </Box>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder="Bir soru sorun..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isPending}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSend} disabled={isPending || !question.trim()} color="primary">
                {isPending ? <CircularProgress size={24} /> : <Send />}
              </IconButton>
            ),
          }}
        />
      </Box>
    </Dialog>
  );
}