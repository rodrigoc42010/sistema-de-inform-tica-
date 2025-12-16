import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../selectors/authSelectors';
import { fetchMyAds, createAd, updateAd } from '../../features/ads/adsSlice';
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
  Chip,
  Divider,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Timer as TimerIcon,
  Group as GroupIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  RocketLaunch as RocketLaunchIcon,
  FormatPaint as FormatPaintIcon,
} from '@mui/icons-material';
import adsService from '../../features/ads/adsService';
import axios from '../../api/axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const AD_PRICING = {
  basic: { 7: 19.9, 15: 34.9, 30: 59.9 },
  intermediate: { 7: 29.9, 15: 54.9, 30: 99.9 },
  premium: { 7: 49.9, 15: 89.9, 30: 159.9 },
};

const PlanCard = ({
  title,
  price,
  features,
  icon: Icon,
  selected,
  onSelect,
  color,
}) => (
  <Paper
    elevation={0}
    className={`plan-card ${selected ? 'selected' : ''}`}
    onClick={onSelect}
    sx={{
      p: 3,
      height: '100%',
      position: 'relative',
      borderRadius: 4,
      background: selected
        ? `linear-gradient(180deg, rgba(${color}, 0.1) 0%, rgba(${color}, 0.02) 100%)`
        : 'rgba(255, 255, 255, 0.02)',
      border: selected
        ? `2px solid rgb(${color})`
        : '1px solid rgba(255, 255, 255, 0.08)',
    }}
  >
    {selected && (
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <CheckCircleIcon sx={{ color: `rgb(${color})` }} />
      </Box>
    )}
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: '50%',
          bgcolor: `rgba(${color}, 0.1)`,
          mb: 2,
          className: 'plan-icon',
          transition: 'all 0.3s ease',
        }}
      >
        <Icon sx={{ fontSize: 32, color: `rgb(${color})` }} />
      </Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="800" sx={{ color: `rgb(${color})` }}>
        <Typography
          component="span"
          variant="h6"
          sx={{ verticalAlign: 'top', opacity: 0.7 }}
        >
          R$
        </Typography>
        {price}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        por 30 dias
      </Typography>
    </Box>
    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
    <Stack spacing={1.5}>
      {features.map((feature, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircleIcon
            sx={{ fontSize: 16, color: `rgba(${color}, 0.7)` }}
          />
          <Typography variant="body2" color="text.secondary">
            {feature}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Paper>
);

const TechnicianAds = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { myAds, isLoading: loadingMyAds } = useSelector((state) => state.ads);

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
  const [editOpen, setEditOpen] = useState(false);
  const [editAd, setEditAd] = useState(null);
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

  useEffect(() => {
    dispatch(fetchMyAds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await dispatch(createAd(form)).unwrap();
      setMessage(
        `Anúncio criado com sucesso! Realize o pagamento para ativar.`
      );
      setForm({
        title: '',
        text: '',
        linkUrl: '',
        mediaUrl: '',
        audience: 'client',
        tier: 'basic',
        duration: 30,
      });
      setSnackOpen(true);
    } catch (err) {
      const msg = err || 'Falha ao criar anúncio';
      setMessage(msg);
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (adId) => {
    try {
      const token = user?.token;
      await axios.post(
        `/api/ads/${adId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Pagamento realizado com sucesso! Anúncio ativo.');
      dispatch(fetchMyAds());
      setSnackOpen(true);
    } catch (err) {
      setMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Falha ao processar pagamento'
      );
      setSnackOpen(true);
    }
  };

  const handleFileSelectCreate = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // setUploadingCreate(true); // Removed unused variable
    (async () => {
      try {
        const token = user?.token;
        const res = await adsService.uploadMedia({ token, file });
        setForm((prev) => ({ ...prev, mediaUrl: res.filePath }));
        setMessage('Imagem enviada com sucesso!');
        setSnackOpen(true);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            'Falha ao enviar mídia'
        );
        setSnackOpen(true);
      } finally {
        // setUploadingCreate(false); // Removed unused variable
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
    // setUploadingEdit(true); // Removed unused variable
    (async () => {
      try {
        const token = user?.token;
        const res = await adsService.uploadMedia({ token, file });
        setEditAd((prev) => ({ ...prev, mediaUrl: res.filePath }));
        setMessage('Imagem atualizada com sucesso!');
        setSnackOpen(true);
      } catch (err) {
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            'Falha ao enviar mídia'
        );
        setSnackOpen(true);
      } finally {
        setUploadingEdit(false);
      }
    })();
  };

  const saveEdit = async () => {
    if (!editAd?._id) return;
    try {
      const payload = {
        title: editAd.title,
        text: editAd.text,
        linkUrl: editAd.linkUrl,
        mediaUrl: editAd.mediaUrl,
        audience: editAd.audience,
        active: editAd.active,
      };
      await dispatch(updateAd({ id: editAd._id, adData: payload })).unwrap();
      setEditOpen(false);
      setEditAd(null);
      setMessage('Anúncio atualizado com sucesso!');
      setSnackOpen(true);
    } catch (err) {
      setMessage(err || 'Falha ao atualizar anúncio');
      setSnackOpen(true);
    }
  };

  const getPrice = () => {
    try {
      return AD_PRICING[form.tier][form.duration].toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // Full Toolbar Configuration for "Photoshop-like" experience
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ align: [] }],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 8, textAlign: 'center', position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '200%',
            background:
              'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)',
            zIndex: -1,
            filter: 'blur(60px)',
          }}
        />
        <Typography
          variant="overline"
          sx={{ letterSpacing: 3, color: 'secondary.main', fontWeight: 'bold' }}
        >
          MARKETING PARA TÉCNICOS
        </Typography>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            textShadow: '0 0 30px rgba(255,255,255,0.1)',
          }}
        >
          Impulsione Seu Negócio
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}
        >
          Crie campanhas profissionais com nosso editor avançado.
        </Typography>
      </Box>

      <Grid container spacing={6}>
        {/* Left Column: Form */}
        <Grid item xs={12} lg={8}>
          <Paper className="glass-card-premium" sx={{ p: 5, borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  mr: 2,
                  boxShadow: '0 0 20px rgba(6,182,212,0.4)',
                }}
              >
                <FormatPaintIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="700">
                  Studio de Criação
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Design e configuração da campanha
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Plan Selection */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    sx={{
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <StarIcon color="warning" fontSize="small" /> Escolha seu
                    Plano
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <PlanCard
                        title="Básico"
                        price={AD_PRICING.basic[30].toFixed(0)}
                        icon={PublicIcon}
                        color="148, 163, 184"
                        selected={form.tier === 'basic'}
                        onSelect={() =>
                          setForm((prev) => ({ ...prev, tier: 'basic' }))
                        }
                        features={[
                          'Exposição na lista geral',
                          'Ícone padrão',
                          'Suporte básico',
                        ]}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <PlanCard
                        title="Intermediário"
                        price={AD_PRICING.intermediate[30].toFixed(0)}
                        icon={TrendingUpIcon}
                        color="6, 182, 212"
                        selected={form.tier === 'intermediate'}
                        onSelect={() =>
                          setForm((prev) => ({ ...prev, tier: 'intermediate' }))
                        }
                        features={[
                          'Destaque na lista',
                          'Borda colorida',
                          'Prioridade na busca',
                        ]}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <PlanCard
                        title="Premium"
                        price={AD_PRICING.premium[30].toFixed(0)}
                        icon={RocketLaunchIcon}
                        color="139, 92, 246"
                        selected={form.tier === 'premium'}
                        onSelect={() =>
                          setForm((prev) => ({ ...prev, tier: 'premium' }))
                        }
                        features={[
                          'Topo da página',
                          'Badge "Recomendado"',
                          'Analytics avançado',
                        ]}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Content Fields */}
                <Grid item xs={12}>
                  <Divider
                    sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    sx={{ mb: 3, mt: 2 }}
                  >
                    Conteúdo Criativo
                  </Typography>

                  <Stack spacing={4}>
                    <TextField
                      label="Título Chamativo"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      fullWidth
                      required
                      className="premium-input"
                      placeholder="Ex: Promoção de Formatação - 50% OFF"
                      InputProps={{
                        sx: { fontSize: '1.2rem', fontWeight: 500 },
                      }}
                    />

                    {/* PRO EDITOR */}
                    <Box className="pro-editor-container">
                      <Box className="pro-editor-toolbar">
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            ml: 1,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          }}
                        >
                          Editor Visual Pro
                        </Typography>
                      </Box>
                      <Box className="pro-editor-canvas">
                        <ReactQuill
                          theme="snow"
                          value={form.text}
                          onChange={handleEditorChange}
                          modules={modules}
                          placeholder="Comece a criar seu anúncio aqui..."
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Link de Destino"
                          name="linkUrl"
                          value={form.linkUrl}
                          onChange={handleChange}
                          fullWidth
                          className="premium-input"
                          InputProps={{
                            startAdornment: (
                              <PublicIcon
                                sx={{ mr: 1, color: 'text.secondary' }}
                              />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label="URL da Imagem de Capa"
                            name="mediaUrl"
                            value={form.mediaUrl}
                            onChange={handleChange}
                            fullWidth
                            className="premium-input"
                          />
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="upload-btn"
                            type="file"
                            onChange={handleFileSelectCreate}
                          />
                          <label htmlFor="upload-btn">
                            <Tooltip title="Upload de Imagem">
                              <Button
                                component="span"
                                variant="outlined"
                                sx={{
                                  height: 56,
                                  minWidth: 56,
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'rgba(6,182,212,0.05)',
                                  },
                                }}
                              >
                                <CloudUploadIcon />
                              </Button>
                            </Tooltip>
                          </label>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>

                {/* Settings */}
                <Grid item xs={12}>
                  <Divider
                    sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    sx={{ mb: 3, mt: 2 }}
                  >
                    Segmentação
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Duração da Campanha"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        fullWidth
                        className="premium-input"
                        InputProps={{
                          startAdornment: (
                            <TimerIcon
                              sx={{ mr: 1, color: 'text.secondary' }}
                            />
                          ),
                        }}
                      >
                        <MenuItem value={7}>7 Dias</MenuItem>
                        <MenuItem value={15}>15 Dias</MenuItem>
                        <MenuItem value={30}>30 Dias</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Público Alvo"
                        name="audience"
                        value={form.audience}
                        onChange={handleChange}
                        fullWidth
                        className="premium-input"
                        InputProps={{
                          startAdornment: (
                            <GroupIcon
                              sx={{ mr: 1, color: 'text.secondary' }}
                            />
                          ),
                        }}
                      >
                        <MenuItem value="client">Clientes Finais</MenuItem>
                        <MenuItem value="technician">Outros Técnicos</MenuItem>
                        <MenuItem value="all">Todos</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Total & Submit */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mt: 2,
                      background:
                        'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="primary.light"
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          fontWeight: 'bold',
                        }}
                      >
                        Investimento Total
                      </Typography>
                      <Typography
                        variant="h3"
                        fontWeight="800"
                        sx={{
                          color: '#fff',
                          textShadow: '0 0 20px rgba(6,182,212,0.5)',
                        }}
                      >
                        R$ {getPrice()}
                      </Typography>
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting}
                      startIcon={<RocketLaunchIcon />}
                      sx={{
                        px: 6,
                        py: 2,
                        fontSize: '1.1rem',
                        borderRadius: 50,
                        background:
                          'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                        boxShadow: '0 0 30px rgba(6,182,212,0.4)',
                        '&:hover': {
                          boxShadow: '0 0 50px rgba(6,182,212,0.6)',
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {submitting ? 'Processando...' : 'Lançar Campanha'}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Preview/List */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Typography
              variant="h6"
              fontWeight="700"
              gutterBottom
              sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
            >
              <VisibilityIcon sx={{ mr: 1.5, color: 'secondary.main' }} /> Seus
              Anúncios Ativos
            </Typography>

            {loadingMyAds ? (
              <Typography color="text.secondary">Carregando...</Typography>
            ) : myAds.length === 0 ? (
              <Paper
                className="glass-card-premium"
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <RocketLaunchIcon
                  sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Sem campanhas ativas
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Seus anúncios aparecerão aqui assim que você criar sua
                  primeira campanha.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={3}>
                {myAds.map((ad) => (
                  <Card key={ad._id || ad.id} className="glass-card-premium">
                    <Box sx={{ position: 'relative' }}>
                      {ad.mediaUrl && (
                        <Box sx={{ height: 160, overflow: 'hidden' }}>
                          <img
                            src={ad.mediaUrl}
                            alt={ad.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          display: 'flex',
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={ad.status === 'active' ? 'NO AR' : 'PENDENTE'}
                          color={ad.status === 'active' ? 'success' : 'warning'}
                          size="small"
                          sx={{
                            fontWeight: 'bold',
                            backdropFilter: 'blur(4px)',
                          }}
                        />
                      </Box>
                    </Box>

                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight="700"
                        noWrap
                        title={ad.title}
                        gutterBottom
                      >
                        {ad.title}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={ad.tier?.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        />
                        <Chip
                          label={`${ad.duration_days} dias`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        />
                      </Stack>

                      <Box
                        sx={{
                          maxHeight: 60,
                          overflow: 'hidden',
                          typography: 'body2',
                          color: 'text.secondary',
                          mb: 2,
                          position: 'relative',
                          maskImage:
                            'linear-gradient(to bottom, black 50%, transparent 100%)',
                        }}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(ad.text),
                          }}
                        />
                      </Box>

                      <Divider
                        sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }}
                      />

                      {ad.status === 'pending_payment' ? (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePay(ad.id || ad._id)}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Pagar R$ {ad.price}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => openEdit(ad)}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: 'text.primary',
                          }}
                        >
                          Gerenciar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Dialog de Edição */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          className: 'glass-card-premium',
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Editar Anúncio
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editAd && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <TextField
                  label="Título"
                  name="title"
                  value={editAd.title || ''}
                  onChange={handleEditChange}
                  fullWidth
                  className="premium-input"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Texto do Anúncio
                </Typography>
                <Box className="pro-editor-container">
                  <Box className="pro-editor-toolbar">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      EDITOR VISUAL
                    </Typography>
                  </Box>
                  <Box className="pro-editor-canvas">
                    <ReactQuill
                      theme="snow"
                      value={editAd.text || ''}
                      onChange={handleEditEditorChange}
                      modules={modules}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Link (URL)"
                  name="linkUrl"
                  value={editAd.linkUrl || ''}
                  onChange={handleEditChange}
                  fullWidth
                  className="premium-input"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Status"
                  name="active"
                  value={editAd.active ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditAd((prev) => ({
                      ...prev,
                      active: e.target.value === 'true',
                    }))
                  }
                  fullWidth
                  className="premium-input"
                >
                  <MenuItem value="true">Ativo</MenuItem>
                  <MenuItem value="false">Inativo</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Button onClick={() => setEditOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={
            message.includes('Falha') || message.includes('Erro')
              ? 'error'
              : 'success'
          }
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TechnicianAds;
