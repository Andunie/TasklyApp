import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  Pause,
  Sparkles,
  X,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, getDaysInMonth, getDay, formatISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import apiClient from '../api/client';
import { useTeam } from '../context/TeamContext';
import { aiService } from '../api/services';
import './Calendar.css';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Modal,
  Fade,
  Backdrop,
  Typography,
  Button,
  IconButton,
  Badge,
  Fab,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { useDebounce } from '../hooks/useDebounce';

export default function Calendar() {
  const navigate = useNavigate();
  const { activeTeamId } = useTeam();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [typedText, setTypedText] = useState('...');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [originalTasks, setOriginalTasks] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [apiError, setApiError] = useState(null);
  const theme = useTheme();

  // Show AI popup after 3 seconds
  useEffect(() => {
    setIsLoaded(true);
    const popupTimer = setTimeout(() => {
      setShowAIPopup(true);
    }, 3000);
    return () => clearTimeout(popupTimer);
  }, []);

  // Fetch AI-generated calendar summary when popup is shown
  useEffect(() => {
    if (showAIPopup && originalTasks.length > 0) {
      // Use the original, unmodified task data directly
      aiService
        .getCalendarSummary(originalTasks)
        .then((res) => {
          const summary = res?.summary || 'Takvim özetiniz şu anda boş görünüyor.';
          let i = 0;
          setTypedText(''); // Reset typed text
          const typingInterval = setInterval(() => {
            if (i < summary.length) {
              setTypedText((prev) => prev + summary.charAt(i));
              i++;
            } else {
              clearInterval(typingInterval);
            }
          }, 50);
          return () => clearInterval(typingInterval);
        })
        .catch((err) => {
          console.error('AI summary API error:', err);
          const fallbackText = 'Takvim özeti alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
          let i = 0;
          setTypedText(''); // Reset typed text
          const typingInterval = setInterval(() => {
            if (i < fallbackText.length) {
              setTypedText((prev) => prev + fallbackText.charAt(i));
              i++;
            } else {
              clearInterval(typingInterval);
            }
          }, 50);
          return () => clearInterval(typingInterval);
        });
    } else if (showAIPopup && originalTasks.length === 0) {
      // Handle case when there are no events
      const noEventsText = 'Bu hafta için görev bulunmuyor. Yeni bir görev eklemek ister misiniz?';
      let i = 0;
      setTypedText(''); // Reset typed text
      const typingInterval = setInterval(() => {
        if (i < noEventsText.length) {
          setTypedText((prev) => prev + noEventsText.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50);
      return () => clearInterval(typingInterval);
    }
  }, [showAIPopup, originalTasks]);

  // Fetch team tasks from API (debounced)
  const debouncedCurrentDate = useDebounce(currentDate, 250);
  useEffect(() => {
    if (!activeTeamId) {
      setEvents([]);
      setOriginalTasks([]);
      setApiError(null);
      return;
    }
    setLoadingEvents(true);
    setApiError(null);

    // Calculate the start and end dates of the current week
    const weekStart = startOfWeek(debouncedCurrentDate, { weekStartsOn: 1 }); // Start week on Monday
    const weekEnd = endOfWeek(debouncedCurrentDate, { weekStartsOn: 1 });

    // Format dates for API
    const startDateParam = formatISO(weekStart, { representation: 'date' });
    const endDateParam = formatISO(weekEnd, { representation: 'date' });

    // Construct API URL
    const apiUrl = `https://localhost:7008/api/Calendar/team-tasks?teamId=${activeTeamId}&startDate=${startDateParam}&endDate=${endDateParam}`;

    apiClient
      .get(apiUrl)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        
        // Store original, unmodified data for AI service
        setOriginalTasks(data);
        
        // Process data for UI rendering
        const mapped = data.map((task) => {
          const start = new Date(task.start);
          const end = new Date(task.end);
          const weekDay = start.getDay();
          const pad = (n) => n.toString().padStart(2, '0');
          const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
          const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
          return {
            id: task.id,
            title: task.title,
            startTime,
            endTime,
            color: task.color || 'bg-primary',
            day: weekDay === 0 ? 7 : weekDay, // 1 (Monday) - 7 (Sunday)
            description: task.description || 'Açıklama yok',
            location: task.location || 'Yer belirtilmemiş',
            attendees: task.assigneeName ? [task.assigneeName] : [],
            organizer: task.assigneeName || 'Bilinmiyor',
            status: task.status || 'ToDo',
          };
        });
        setEvents(mapped);
      })
      .catch((err) => {
        console.error('API error:', err);
        setEvents([]);
        setOriginalTasks([]);
        if (err.response && err.response.status === 404) {
          setApiError('Henüz bir takımda değilsiniz. Lütfen bir takıma kaydolun.');
        } else {
          setApiError('Görevler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      })
      .finally(() => setLoadingEvents(false));
  }, [activeTeamId, debouncedCurrentDate]);

  // Dynamic date management
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]); // Monday start
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'EEEE', { locale: tr }).slice(0, 3).toUpperCase()),
    [weekStart]
  );
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => parseInt(format(addDays(weekStart, i), 'd'))),
    [weekStart]
  );
  const currentMonth = useMemo(() => format(currentDate, 'MMMM yyyy', { locale: tr }), [currentDate]);
  const displayDate = useMemo(() => format(currentDate, 'MMMM d', { locale: tr }), [currentDate]);
  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDayOfMonth = useMemo(() => getDay(startOfMonth(currentDate)), [currentDate]);
  const miniCalendarDays = useMemo(
    () => Array.from({ length: daysInMonth + firstDayOfMonth }, (_, i) => (i < firstDayOfMonth ? null : i - firstDayOfMonth + 1)),
    [daysInMonth, firstDayOfMonth]
  );
  const timeSlots = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 8), []); // 08:00 - 19:00

  const myCalendars = [
    { name: 'Düşük', color: 'bg-primary' },
    { name: 'Orta', color: 'bg-success' },
    { name: 'Yüksek', color: 'bg-warning' },
    { name: 'Acil', color: 'bg-danger' },
  ];

  const calculateEventStyle = useCallback((startTime, endTime) => {
    const parseToHour = (t) => {
      const [h, m] = t.split(':').map((n) => parseInt(n, 10));
      return h + m / 60;
    };
    const rawStart = parseToHour(startTime);
    const rawEnd = parseToHour(endTime);
    // Clamp to 08:00 - 19:00
    const clampedStart = Math.max(8, Math.min(19, rawStart));
    const clampedEnd = Math.max(8, Math.min(19, rawEnd));
    const safeEnd = Math.max(clampedEnd, clampedStart + 0.25); // minimum 15 minutes
    const top = (clampedStart - 8) * 80; // 80px per hour
    const height = (safeEnd - clampedStart) * 80;
    return { top: `${top}px`, height: `${height}px` };
  }, []);

  // Map event color class to MUI palette background color
  const getEventBgColor = useCallback(
    (colorClass) => {
      switch (colorClass) {
        case 'bg-success':
          return theme.palette.info.main; // medium
        case 'bg-warning':
          return theme.palette.warning.main; // high
        case 'bg-danger':
          return theme.palette.error.main; // urgent
        case 'bg-primary':
        default:
          return theme.palette.grey[500]; // low/default
      }
    },
    [theme]
  );

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handlePrevWeek = useCallback(() => {
    setCurrentDate((d) => addDays(d, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((d) => addDays(d, 7));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleGoToTasks = useCallback(() => {
    navigate('/app/my-tasks');
  }, [navigate]);

  const onEventKeyDown = useCallback(
    (eventObj, e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEventClick(eventObj);
      }
    },
    [handleEventClick]
  );

  const renderView = () => {
    if (loadingEvents) {
      return (
        <Box className="text-center p-4" role="status" aria-live="polite">
          <CircularProgress color="primary" />
        </Box>
      );
    }

    if (apiError) {
      return (
        <Box className="p-4">
          <Alert severity="error" role="alert" aria-label="Görevler yüklenemedi">
            {apiError}
          </Alert>
        </Box>
      );
    }

    switch (currentView) {
      case 'day':
        return <div className="p-4">Gün görünümü (henüz uygulanmadı)</div>;
      case 'month':
        return <div className="p-4">Ay görünümü (henüz uygulanmadı)</div>;
      case 'week':
      default:
        return (
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-3 h-100" aria-label="Haftalık takvim" role="grid">
            <div className="row g-0 border-bottom border-white border-opacity-25">
              <div className="col-1"></div>
              {weekDays.map((day, i) => (
                <div key={i} className="col text-center border-start border-white border-opacity-25 p-2">
                  <div className="small">{day}</div>
                  <div
                    className={`mt-1 ${
                      weekDates[i] === parseInt(format(currentDate, 'd')) &&
                      format(currentDate, 'MMMM yyyy', { locale: tr }) === currentMonth
                        ? 'bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto'
                        : ''
                    }`}
                    style={{ width: '32px', height: '32px' }}
                  >
                    {weekDates[i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="row g-0">
              <div className="col-1 small">
                {timeSlots.map((time, i) => (
                  <div key={i} className="time-slot border-bottom border-white border-opacity-10 text-end small">
                    {time > 12 ? `${time - 12}:00 ÖS` : `${time}:00 ÖÖ`}
                  </div>
                ))}
              </div>
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div key={dayIndex} className="col border-start border-white border-opacity-25 position-relative">
                  {timeSlots.map((_, timeIndex) => (
                    <div key={timeIndex} className="time-slot border-bottom border-white border-opacity-10"></div>
                  ))}
                  {events
                    .filter((event) => event.day === dayIndex + 1)
                    .map((event, i) => {
                      const eventStyle = calculateEventStyle(event.startTime, event.endTime);
                      return (
                        <div
                          key={i}
                          className={`position-absolute rounded p-2 small event-card`}
                          style={{
                            ...eventStyle,
                            left: '4px',
                            right: '4px',
                            backgroundColor: getEventBgColor(event.color),
                            color: theme.palette.getContrastText(getEventBgColor(event.color)),
                          }}
                          onClick={() => handleEventClick(event)}
                          role="button"
                          tabIndex={0}
                          aria-label={`${event.title}, ${event.startTime} - ${event.endTime}`}
                          onKeyDown={(e) => onEventKeyDown(event, e)}
                        >
                          <div className="fw-medium">{event.title}</div>
                          <div className="opacity-75 text-xs mt-1">{`${event.startTime} - ${event.endTime}`}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="row g-0 h-100">
      {/* Sidebar */}
      <div
        className={`col-md-3 bg-white bg-opacity-10 backdrop-blur p-4 border-end border-white border-opacity-25 animate ${
          isLoaded ? 'fade-in' : ''
        } d-flex flex-column justify-content-between`}
      >
        <div>
          <Button
            variant="contained"
            color="primary"
            className="w-100 mb-4 d-flex align-items-center justify-content-center gap-2"
            onClick={handleGoToTasks}
            aria-label="Yeni görev oluştur"
          >
            <Plus size={20} />
            <span>Oluştur</span>
          </Button>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ color: theme.palette.text.primary }}>{currentMonth}</h5>
              <div className="d-flex gap-1">
                <IconButton size="small" color="inherit" aria-label="Önceki ay" onClick={() => setCurrentDate(addDays(currentDate, -30))}>
                  <ChevronLeft size={16} />
                </IconButton>
                <IconButton size="small" color="inherit" aria-label="Sonraki ay" onClick={() => setCurrentDate(addDays(currentDate, 30))}>
                  <ChevronRight size={16} />
                </IconButton>
              </div>
            </div>
            <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                <div key={i} className="text-center small py-1" style={{ color: theme.palette.text.secondary }}>
                  {day}
                </div>
              ))}
              {miniCalendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`text-center small rounded-circle d-flex align-items-center justify-content-center ${
                    day === parseInt(format(currentDate, 'd')) && format(currentDate, 'MMMM yyyy', { locale: tr }) === currentMonth
                      ? 'bg-primary'
                      : 'hover-bg-light'
                  } ${!day ? 'invisible' : ''}`}
                  style={{ width: '30px', height: '30px', color: day ? theme.palette.text.primary : 'inherit', backgroundColor: day === parseInt(format(currentDate, 'd')) && format(currentDate, 'MMMM yyyy', { locale: tr }) === currentMonth ? theme.palette.primary.main : 'inherit' }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="mb-3" style={{ color: theme.palette.text.primary }}>Öncelikler</h5>
            {myCalendars.map((cal, i) => (
              <div key={i} className="d-flex align-items-center gap-2 mb-2">
                <div className={`rounded`} style={{ width: '12px', height: '12px', backgroundColor: getEventBgColor(cal.color) }}></div>
                <span className="small" style={{ color: theme.palette.text.secondary }}>{cal.name}</span>
              </div>
            ))}
          </div>
        </div>
        <Tooltip title="Yeni görev oluştur">
          <IconButton color="primary" className="rounded-circle p-3 align-self-start" onClick={handleGoToTasks} aria-label="Yeni görev oluştur">
            <Plus size={24} />
          </IconButton>
        </Tooltip>
      </div>

      {/* Calendar View */}
      <div className={`col-md-9 d-flex flex-column animate ${isLoaded ? 'fade-in' : ''}`}>
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-white border-opacity-25">
          <div className="d-flex align-items-center gap-3">
            <Button variant="contained" color="primary" onClick={handleToday} aria-label="Bugüne dön">
              <span>Bugün</span>
            </Button>
            <div className="d-flex">
              <IconButton onClick={handlePrevWeek} aria-label="Önceki hafta">
                <ChevronLeft size={20} />
              </IconButton>
              <IconButton onClick={handleNextWeek} aria-label="Sonraki hafta">
                <ChevronRight size={20} />
              </IconButton>
            </div>
            <h4 className="mb-0" style={{ color: theme.palette.text.primary }}>{displayDate}</h4>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="btn-group" role="group" aria-label="Görünüm seçimi">
              <Button variant={currentView === 'day' ? 'contained' : 'outlined'} onClick={() => setCurrentView('day')} aria-pressed={currentView === 'day'}>
                Gün
              </Button>
              <Button variant={currentView === 'week' ? 'contained' : 'outlined'} onClick={() => setCurrentView('week')} aria-pressed={currentView === 'week'}>
                Hafta
              </Button>
              <Button variant={currentView === 'month' ? 'contained' : 'outlined'} onClick={() => setCurrentView('month')} aria-pressed={currentView === 'month'}>
                Ay
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-grow-1 overflow-auto p-4">{renderView()}</div>
      </div>

      {/* AI Popup */}
      {showAIPopup && (
        <Fade in={showAIPopup} timeout={300}>
          {/* DEĞİŞİKLİK: Konumlandırma artık sx prop'u ile yapılıyor */}
          <Box
            role="dialog"
            aria-label="AI Takvim Özeti"
            sx={{
              position: 'fixed', // Sayfa scroll'undan bağımsız, pencereye sabit
              bottom: 24,        // Alttan 24px boşluk
              right: 24,         // Sağdan 24px boşluk
              zIndex: 1300,      // Diğer tüm elementlerin üzerinde olmasını garantiler
              minWidth: 320,
              maxWidth: 420,
            }}
          >
            <Card sx={{
                background: 'linear-gradient(45deg, #212121 30%, #424242 90%)', // bg-gradient
                color: '#fff', // text-white
                position: 'relative' // Kapatma butonu için
            }}>
              <IconButton
                onClick={() => setShowAIPopup(false)}
                aria-label="Kapat"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <X size={20} />
              </IconButton>
              <CardContent>
                {/* DEĞİŞİKLİK: d-flex yerine Box ile flexbox kullanımı */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Sparkles size={24} color={theme.palette.primary.main} />
                  <Box sx={{ minHeight: '80px' }}>
                    <Typography variant="body1">{typedText}</Typography>
                  </Box>
                </Box>
                
                {/* DEĞİŞİKLİK: d-flex ve flex-fill yerine Grid kullanımı */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {events.length === 0 ? (
                    <>
                      <Grid item xs>
                        <Button fullWidth variant="outlined" color="inherit" onClick={handleGoToTasks}>Evet</Button>
                      </Grid>
                      <Grid item xs>
                        <Button fullWidth variant="outlined" color="inherit" onClick={() => setShowAIPopup(false)}>Hayır</Button>
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs>
                        <Button fullWidth variant="outlined" color="inherit" onClick={togglePlay}>Evet</Button>
                      </Grid>
                      <Grid item xs>
                        <Button fullWidth variant="outlined" color="inherit" onClick={() => setShowAIPopup(false)}>Hayır</Button>
                      </Grid>
                    </>
                  )}
                </Grid>
                
                {isPlaying && (
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="inherit" startIcon={<Pause size={16} />} onClick={togglePlay}>
                      Hans Zimmer'ı Durdur
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          open={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{ backdrop: { timeout: 300 } }}
          aria-labelledby="event-modal-title"
          aria-describedby="event-modal-description"
        >
          <Fade in={Boolean(selectedEvent)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(560px, 92vw)',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
              }}
            >
              <Typography id="event-modal-title" variant="h5" sx={{ mb: 2 }}>
                {selectedEvent.title}
              </Typography>
              <Box id="event-modal-description">
                <Typography className="d-flex align-items-center" sx={{ mb: 1 }}>
                  <Clock size={20} className="me-2" />
                  {`${selectedEvent.startTime} - ${selectedEvent.endTime}`}
                </Typography>
                <Typography className="d-flex align-items-center" sx={{ mb: 1 }}>
                  <MapPin size={20} className="me-2" />
                  {selectedEvent.location}
                </Typography>
                <Typography className="d-flex align-items-center" sx={{ mb: 1 }}>
                  <CalendarIcon size={20} className="me-2" />
                  {`${weekDays[selectedEvent.day - 1]}, ${weekDates[selectedEvent.day - 1]} ${currentMonth}`}
                </Typography>
                <Box className="d-flex align-items-start" sx={{ mb: 1 }}>
                  <Users size={20} className="me-2 mt-1" />
                  <span>
                    <strong>Katılımcılar:</strong>
                    <br />
                    {selectedEvent.attendees.join(', ') || 'Katılımcı yok'}
                  </span>
                </Box>
                <Typography sx={{ mb: 1 }}>
                  <strong>Organizatör:</strong> {selectedEvent.organizer}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Açıklama:</strong> {selectedEvent.description}
                </Typography>
                <Typography>
                  <strong>Durum:</strong> {selectedEvent.status}
                </Typography>
              </Box>
              <Box className="mt-4 text-end" sx={{ textAlign: 'right' }}>
                <Button variant="outlined" onClick={() => setSelectedEvent(null)} aria-label="Kapat">
                  Kapat
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Yeni görev"
        onClick={handleGoToTasks}
        className="position-fixed"
        sx={{ bottom: 24, right: 24 }}
      >
        <Plus size={24} />
      </Fab>
    </div>
  );
}