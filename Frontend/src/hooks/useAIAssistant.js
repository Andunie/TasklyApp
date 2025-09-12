import { useMutation } from '@tanstack/react-query';
import { aiService } from '../api/services';
import { toast } from 'react-toastify';

export const useAIAssistant = () => {
  return useMutation({
    // mutationFn, bir nesne ({ question, teamId }) alacak şekilde ayarlandı.
    mutationFn: (variables) => aiService.askAssistant(variables),
    
    onSuccess: (data) => {
      // Cevap başarılı geldiğinde burada bir şey yapmaya gerek yok,
      // çünkü gelen cevabı component'in kendi state'inde yöneteceğiz.
      console.log('AI Assistant answered successfully.');
    },

    // Hata durumunda kullanıcıya bir bildirim gösterelim.
    onError: (error) => {
      // Backend'den gelen spesifik hata mesajını yakalamaya çalış
      const message = error.response?.data?.message || error.response?.data?.title || 'AI asistanı şu anda cevap veremiyor.';
      toast.error(message);
    },
  });
};