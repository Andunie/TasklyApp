import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { toast } from 'react-toastify';

const fetchCalendarSummary = async (tasks) => {
  // Eğer hiç görev yoksa, yine de API'ye boş bir liste gönderelim ki
  // AI bize "Bugün takvimin boş" gibi bir mesaj üretsin.
  if (!tasks) return { summary: "Takvim verileri yüklenemedi." }; 
  
  const { data } = await apiClient.post('/ai/calendar-summary', tasks);
  return data; // { Summary: "..." } nesnesini döndürür
};

export const useCalendarSummary = () => {
  return useMutation(fetchCalendarSummary, {
    onError: (error) => {
      // Hata durumunda kullanıcıya nazik bir bildirim göster
      const message = error.response?.data?.message || "AI asistanı şu an da hizmet veremiyor.";
      toast.error(message);
    },
  });
};