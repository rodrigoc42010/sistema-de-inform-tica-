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
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider
} from '@mui/material';
import { AddCircle as AddCircleIcon, Payment as PaymentIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import adsService from '../../features/ads/adsService';
import axios from '../../api/axios'; // Import axios directly for custom payment call
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const AD_PRICING = {
  basic: { 7: 19.90, 15: 34.90, 30: 59.90 },
  intermediate: { 7: 29.90, 15: 54.90, 30: 99.90 },
  premium: { 7: 49.90, 15: 89.90, 30: 159.90 }
};

const TechnicianAds = () => {
  const user = useSelector(selectUser);
  const [form, setForm] = useState({
    title: '',
    text: '',
    linkUrl: '',
    mediaUrl: '',
    audience: 'client',
    tier: 'basic',
    duration: 30,
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

  const handleEditorChange = (value) => {
    setForm((prev) => ({ ...prev, text: value }));
  };

  const handleEditEditorChange = (value) => {
    setEditAd((prev) => ({ ...prev, text: value }));
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
      setMessage(`Anúncio criado: ${data?.title}. Realize o pagamento para ativar.`);
      setForm({ title: '', text: '', linkUrl: '', mediaUrl: '', audience: 'client', tier: 'basic', duration: 30 });
      loadMyAds();
      try { window.dispatchEvent(new CustomEvent('ads-updated', { detail: { action: 'create' } })); } catch { }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao criar anúncio';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (adId) => {
    try {
      const token = user?.token;
      // Using direct axios call since payAd might not be in adsService yet
      await axios.post(`/api/ads/${adId}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Pagamento realizado com sucesso! Anúncio ativo.');
      loadMyAds();
      setSnackOpen(true);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || 'Falha ao processar pagamento');
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
        active: editAd.active,
      };
      await adsService.updateAd({ token, id: editAd._id, payload });
      setEditOpen(false);
      setEditAd(null);
      loadMyAds();
      try { window.dispatchEvent(new CustomEvent('ads-updated', { detail: { action: 'update' } })); } catch { }
      setSnackOpen(true);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || 'Falha ao atualizar anúncio');
    }
  };

  const getPrice = () => {
    try {
      return AD_PRICING[form.tier][form.duration].toFixed(2);
    } catch {
      return '0.00';
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Criar Anúncio Premium
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Escolha o plano ideal para destacar seus serviços.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Título" name="title" value={form.title} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Link (URL)" name="linkUrl" value={form.linkUrl} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Texto do Anúncio</Typography>
              <ReactQuill
                theme="snow"
                value={form.text}
                onChange={handleEditorChange}
                style={{ height: '200px', marginBottom: '50px' }}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField select label="Plano" name="tier" value={form.tier} onChange={handleChange} fullWidth>
                <MenuItem value="basic">Básico (Exposição Normal)</MenuItem>
                <MenuItem value="intermediate">Intermediário (Destaque)</MenuItem>
                <MenuItem value="premium">Premium (Topo da Lista)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Duração" name="duration" value={form.duration} onChange={handleChange} fullWidth>
                <MenuItem value={7}>7 Dias</MenuItem>
                <MenuItem value={15}>15 Dias</MenuItem>
                <MenuItem value={30}>30 Dias</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Público Alvo" name="audience" value={form.audience} onChange={handleChange} fullWidth>
                <MenuItem value="client">Clientes</MenuItem>
                <MenuItem value="technician">Outros Técnicos</MenuItem>
                <MenuItem value="all">Todos</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Imagem (URL)" name="mediaUrl" value={form.mediaUrl} onChange={handleChange} fullWidth />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <input id="file-create" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelectCreate} />
                <label htmlFor="file-create">
                  <Button component="span" variant="outlined" size="small" disabled={uploadingCreate}>
                    {uploadingCreate ? 'Enviando...' : 'Upload de imagem'}
                  </Button>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">Resumo do Pedido:</Typography>
                  <Typography variant="body2">Plano {form.tier.toUpperCase()} - {form.duration} dias</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  R$ {getPrice()}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button type="submit" variant="contained" size="large" startIcon={<AddCircleIcon />} disabled={submitting}>
                  {submitting ? 'Processando...' : 'Criar e Ir para Pagamento'}
                </Button>
                {message && <Typography variant="body2" color={message.startsWith('Falha') ? 'error' : 'success.main'}>{message}</Typography>}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Meus Anúncios</Typography>

      {loadingMyAds ? (
        <Typography>Carregando...</Typography>
      ) : myAds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Nenhum anúncio criado ainda.</Typography>
      ) : (
        <Grid container spacing={2}>
          {myAds.map((ad) => (
            <Grid item xs={12} sm={6} md={4} key={ad._id || ad.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={ad.status === 'active' ? 'Ativo' : ad.status === 'pending_payment' ? 'Pendente Pagamento' : ad.status}
                    color={ad.status === 'active' ? 'success' : ad.status === 'pending_payment' ? 'warning' : 'default'}
                    size="small"
                  />
                  <Chip label={ad.tier ? ad.tier.toUpperCase() : 'BASIC'} size="small" color="primary" variant="outlined" />
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" sx={{ mt: 2 }}>
                    {ad.title}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    R$ {ad.price} • {ad.duration_days} dias
                  </Typography>
                  <Typography variant="body2" component="div">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ad.text) }} />
                  </Typography>
                  {ad.mediaUrl && (
                    <Box sx={{ mt: 2 }}>
                      <img src={ad.mediaUrl} alt={ad.title} style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }} />
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {ad.status === 'pending_payment' ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      startIcon={<PaymentIcon />}
                      onClick={() => handlePay(ad.id || ad._id)}
                      fullWidth
                    >
                      Pagar R$ {ad.price}
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => openEdit(ad)}>Editar</Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Anúncio</DialogTitle>
        <DialogContent>
          {editAd && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField label="Título" name="title" value={editAd.title || ''} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Texto do Anúncio</Typography>
                <ReactQuill
                  theme="snow"
                  value={editAd.text || ''}
                  onChange={handleEditEditorChange}
                  style={{ height: '200px', marginBottom: '50px' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Link (URL)" name="linkUrl" value={editAd.linkUrl || ''} onChange={handleEditChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Ativo" name="active" value={editAd.active ? 'true' : 'false'} onChange={(e) => setEditAd((prev) => ({ ...prev, active: e.target.value === 'true' }))} fullWidth>
                  <MenuItem value="true">Sim</MenuItem>
                  <MenuItem value="false">Não</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={saveEdit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)} message={message} />
    </Container>
  );
};

export default TechnicianAds;