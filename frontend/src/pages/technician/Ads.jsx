import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../selectors/authSelectors';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import adsService from '../../features/ads/adsService';

const TechnicianAds = () => {
  const user = useSelector(selectUser);
  const [form, setForm] = useState({
    title: '',
    text: '',
    linkUrl: '',
    mediaUrl: '',
    audience: 'client',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [myAds, setMyAds] = useState([]);
  const [loadingMyAds, setLoadingMyAds] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadMyAds = async () => {
    try {
      setLoadingMyAds(true);
      const token = user?.token;
      const ads = await adsService.getMyAds(token);
      setMyAds(Array.isArray(ads) ? ads : []);
    } catch (err) {
      console.error('Falha ao carregar meus anúncios', err);
    } finally {
      setLoadingMyAds(false);
    }
  };

  useEffect(() => {
    loadMyAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const token = user?.token;
      const data = await adsService.createAd({ token, payload: form });
      setMessage(`Anúncio criado: ${data?.title}. Uma taxa de postagem será registrada para administração.`);
      setForm({ title: '', text: '', linkUrl: '', mediaUrl: '', audience: 'client', startDate: '', endDate: '' });
      loadMyAds();
      try { window.dispatchEvent(new CustomEvent('ads-updated', { detail: { action: 'create' } })); } catch {}
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao criar anúncio';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelectCreate = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCreate(true);
    (async () => {
      try {
        const token = user?.token;
        const res = await adsService.uploadMedia({ token, file });
        setForm((prev) => ({ ...prev, mediaUrl: res.filePath }));
        setSnackOpen(true);
      } catch (err) {
        setMessage(err?.response?.data?.message || err?.message || 'Falha ao enviar mídia');
      } finally {
        setUploadingCreate(false);
      }
    })();
  };

  const openEdit = (ad) => {
    setEditAd({ ...ad });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditAd((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelectEdit = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEdit(true);
    (async () => {
      try {
        const token = user?.token;
        const res = await adsService.uploadMedia({ token, file });
        setEditAd((prev) => ({ ...prev, mediaUrl: res.filePath }));
        setSnackOpen(true);
      } catch (err) {
        setMessage(err?.response?.data?.message || err?.message || 'Falha ao enviar mídia');
      } finally {
        setUploadingEdit(false);
      }
    })();
  };

  const saveEdit = async () => {
    if (!editAd?._id) return;
    try {
      const token = user?.token;
      const payload = {
        title: editAd.title,
        text: editAd.text,
        linkUrl: editAd.linkUrl,
        mediaUrl: editAd.mediaUrl,
        audience: editAd.audience,
        startDate: editAd.startDate,
        endDate: editAd.endDate,
        active: editAd.active,
      };
      await adsService.updateAd({ token, id: editAd._id, payload });
      setEditOpen(false);
      setEditAd(null);
      loadMyAds();
      try { window.dispatchEvent(new CustomEvent('ads-updated', { detail: { action: 'update' } })); } catch {}
      setSnackOpen(true);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || 'Falha ao atualizar anúncio');
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Criar Anúncio de Serviço
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Ao criar o anúncio, uma taxa de postagem é registrada para administração.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Título" name="title" value={form.title} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Link (URL)" name="linkUrl" value={form.linkUrl} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Texto" name="text" value={form.text} onChange={handleChange} fullWidth required multiline minRows={3} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Imagem (URL)" name="mediaUrl" value={form.mediaUrl} onChange={handleChange} fullWidth />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <input id="file-create" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelectCreate} />
                <label htmlFor="file-create">
                  <Button component="span" variant="outlined" disabled={uploadingCreate}>
                    {uploadingCreate ? 'Enviando...' : 'Upload de imagem'}
                  </Button>
                </label>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Audiência" name="audience" value={form.audience} onChange={handleChange} fullWidth>
                <MenuItem value="client">Clientes</MenuItem>
                <MenuItem value="technician">Técnicos</MenuItem>
                <MenuItem value="all">Todos</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField type="date" label="Início" name="startDate" value={form.startDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField type="date" label="Fim" name="endDate" value={form.endDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button type="submit" variant="contained" startIcon={<AddCircleIcon />} disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Criar Anúncio'}
                </Button>
                {message && <Typography variant="body2" color={message.startsWith('Falha') ? 'error' : 'text.secondary'}>{message}</Typography>}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Meus Anúncios</Typography>
        {loadingMyAds ? (
          <Typography>Carregando...</Typography>
        ) : myAds.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhum anúncio criado ainda.</Typography>
        ) : (
          <Grid container spacing={2}>
            {myAds.map((ad) => (
              <Grid item xs={12} sm={6} md={4} key={ad._id}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>{ad.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 48 }}>{ad.text}</Typography>
                  {ad.mediaUrl && (
                    <Box sx={{ mt: 1 }}>
                      <img src={ad.mediaUrl} alt={ad.title} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 4 }} />
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button size="small" variant="outlined" onClick={() => openEdit(ad)}>Editar</Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Anúncio</DialogTitle>
        <DialogContent>
          {editAd && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField label="Título" name="title" value={editAd.title || ''} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Texto" name="text" value={editAd.text || ''} onChange={handleEditChange} fullWidth multiline minRows={3} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Link (URL)" name="linkUrl" value={editAd.linkUrl || ''} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Imagem (URL)" name="mediaUrl" value={editAd.mediaUrl || ''} onChange={handleEditChange} fullWidth />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <input id="file-edit" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelectEdit} />
                  <label htmlFor="file-edit">
                    <Button component="span" variant="outlined" disabled={uploadingEdit}>
                      {uploadingEdit ? 'Enviando...' : 'Upload de imagem'}
                    </Button>
                  </label>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Audiência" name="audience" value={editAd.audience || 'client'} onChange={handleEditChange} fullWidth>
                  <MenuItem value="client">Clientes</MenuItem>
                  <MenuItem value="technician">Técnicos</MenuItem>
                  <MenuItem value="all">Todos</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Ativo" name="active" value={editAd.active ? 'true' : 'false'} onChange={(e) => setEditAd((prev) => ({ ...prev, active: e.target.value === 'true' }))} fullWidth>
                  <MenuItem value="true">Sim</MenuItem>
                  <MenuItem value="false">Não</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField type="date" label="Início" name="startDate" value={(editAd.startDate || '').slice(0,10)} onChange={handleEditChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField type="date" label="Fim" name="endDate" value={(editAd.endDate || '').slice(0,10)} onChange={handleEditChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={saveEdit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)} message="Anúncio atualizado" />
    </Container>
  );
};

export default TechnicianAds;