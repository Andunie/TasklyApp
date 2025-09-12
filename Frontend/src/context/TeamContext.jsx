import React, { createContext, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from './AuthContext'; // Mevcut kullanıcının ID'sini almak için

const TeamContext = createContext(null);
const STORAGE_KEY = 'taskly.activeTeamId';

// API'den tek bir takımın detayını çeken fonksiyon
const fetchTeamDetails = async (teamId) => {
  if (!teamId) return null;
  const { data } = await apiClient.get(`/api/teams/${teamId}`);
  return data;
};

export function TeamProvider({ children }) {
  const { user: currentUser } = useAuth(); // AuthContext'ten mevcut kullanıcıyı al
  const [activeTeamId, setActiveTeamId] = useState(() => {
    // Sayfa yüklendiğinde localStorage'dan ID'yi oku
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  // react-query ile seçilen takımın detaylarını çek
  const { data: activeTeam, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['teamDetails', activeTeamId], // Query anahtarı: ID değişince yeniden çeker
    queryFn: () => fetchTeamDetails(activeTeamId),
    enabled: !!activeTeamId, // Sadece ID varsa sorguyu çalıştır
    staleTime: 15 * 60 * 1000, // 15 dakika boyunca veriyi taze kabul et
  });

  // Takım değiştirme fonksiyonu
  const updateActiveTeamId = (teamId) => {
    const idNum = teamId ? Number(teamId) : null;
    setActiveTeamId(idNum);
    if (idNum) {
      window.localStorage.setItem(STORAGE_KEY, String(idNum));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Mevcut kullanıcının lider olup olmadığını hesaplayan değer
  const isCurrentUserTeamLead = useMemo(() => {
    if (!currentUser || !activeTeam) return false;
      
    const userId = currentUser.id;
    const teamLeadId = activeTeam.teamLeadId;
    return userId === teamLeadId;
  }, [currentUser, activeTeam]);

  // Context aracılığıyla dışarıya sunulacak değerler
  const value = useMemo(
    () => ({
      activeTeamId,
      setActiveTeamId: updateActiveTeamId,
      activeTeam, // Takımın tüm detayları (name, teamLeadId, members...)
      isLoadingTeam, // Takım verisi yükleniyor mu?
      isCurrentUserTeamLead, // Mevcut kullanıcı lider mi? (true/false)
    }),
    [activeTeamId, activeTeam, isLoadingTeam, isCurrentUserTeamLead]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}