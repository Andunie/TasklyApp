import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../api/client';

export default function CreateTaskModal({ open, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '', // yyyy-MM-ddTHH:mm
    dueDate: '', // yyyy-MM-ddTHH:mm
    priority: 1,
    teamId: '',
    assignedToUserId: '',
  });

  const priorities = useMemo(
    () => [
      { value: 0, label: 'Düşük' }, // Low
      { value: 1, label: 'Orta' },  // Medium
      { value: 2, label: 'Yüksek' }, // High
      { value: 3, label: 'Acil' },  // Urgent
    ],
    []
  );

  useEffect(() => {
    if (!open) return;
    const loadTeams = async () => {
      try {
        const res = await apiClient.get('/api/Teams');
        setTeams(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error('Takımlar yüklenemedi');
      }
    };
    loadTeams();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!form.teamId) {
      setMembers([]);
      setForm((prev) => ({ ...prev, assignedToUserId: '' }));
      return;
    }
    const loadMembers = async () => {
      try {
        const res = await apiClient.get(`/api/Teams/${form.teamId}/members`);
        // Esnek yanıt şekilleri: doğrudan dizi ya da { members: [] }
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.members)
          ? res.data.members
          : [];
        setMembers(list);
      } catch (err) {
        setMembers([]);
        toast.error('Takım üyeleri yüklenemedi');
      }
    };
    loadMembers();
  }, [open, form.teamId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
    // Temizle
    setTimeout(() => {
      setForm({ title: '', description: '', dueDate: '', priority: 1, teamId: '', assignedToUserId: '' });
      setMembers([]);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.title?.trim() || !form.teamId) {
      toast.info('Başlık ve takım alanları zorunludur');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || '',
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        priority: Number(form.priority) || 0,
        teamId: Number(form.teamId),
        assignedToUserId: form.assignedToUserId || null,
      };
      const res = await apiClient.post('/api/Tasks', payload);
      if (res.status === 201) {
        toast.success('Görev oluşturuldu');
        handleClose();
      } else {
        toast.error('Görev oluşturulamadı');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Görev oluşturulamadı';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Yeni Görev Oluştur</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Başlık"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Açıklama"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={3}
          />

          <TextField
            label="Başlangıç Tarihi"
            name="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Bitiş Tarihi"
            name="dueDate"
            type="datetime-local"
            value={form.dueDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="priority-label">Öncelik</InputLabel>
            <Select
              labelId="priority-label"
              label="Öncelik"
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              {priorities.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="team-label">Takım</InputLabel>
            <Select
              labelId="team-label"
              label="Takım"
              name="teamId"
              value={form.teamId}
              onChange={handleChange}
              required
            >
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!form.teamId || members.length === 0}>
            <InputLabel id="assignee-label">Atanacak Kişi</InputLabel>
            <Select
              labelId="assignee-label"
              label="Atanacak Kişi"
              name="assignedToUserId"
              value={form.assignedToUserId}
              onChange={handleChange}
            >
              <MenuItem value="">
                (Seçimsiz)
              </MenuItem>
              {members.map((m) => (
                <MenuItem key={m.userId || m.id} value={m.userId || m.id}>
                  {m.fullName || m.name || m.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>Oluştur</Button>
      </DialogActions>
    </Dialog>
  );
}