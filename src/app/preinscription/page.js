"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  filieresV2Service,
  cyclesService,
  levelsV2Service,
} from "../../services/api/services";
import { apiRequest, getApiErrorMessage } from "../../services/api/client";
import { API_ENDPOINTS } from "../../services/api/endpoints";
import RecaptchaV2 from "../../components/RecaptchaV2";

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

const COUNTRY_CODES = [
  { code: "+241", country: "GA", label: "Gabon (+241)" },
  { code: "+237", country: "CM", label: "Cameroun (+237)" },
  { code: "+242", country: "CG", label: "Congo (+242)" },
  { code: "+243", country: "CD", label: "RD Congo (+243)" },
  { code: "+240", country: "GQ", label: "Guinée Éq. (+240)" },
  { code: "+235", country: "TD", label: "Tchad (+235)" },
  { code: "+236", country: "CF", label: "Centrafrique (+236)" },
  { code: "+225", country: "CI", label: "Côte d'Ivoire (+225)" },
  { code: "+221", country: "SN", label: "Sénégal (+221)" },
  { code: "+33", country: "FR", label: "France (+33)" },
  { code: "+1", country: "US", label: "USA/Canada (+1)" },
];

const STEPS = ["Informations", "Documents"];

export default function PublicPreinscriptionPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    nom_candidat: "",
    prenom_candidat: "",
    date_naissance: "",
    email: "",
    indicatif: "+241",
    telephone: "",
    nom_parent: "",
    whatsapp_parent: "",
    filiere_souhaitee: "",
    cycle_souhaite: "",
    niveau_souhaite: "",
    message: "",
    bulletin: null,
  });
  const [files, setFiles] = useState({
    photo: null,
    acte_naissance: null,
    cni: null,
    diplomes: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [filieres, setFilieres] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [filsRes, cyclesRes, levelsRes] = await Promise.all([
          filieresV2Service.list(),
          cyclesService.list(),
          levelsV2Service.list(),
        ]);
        setFilieres(toList(filsRes));
        setCycles(toList(cyclesRes));
        setLevels(toList(levelsRes));
      } catch (_error) {
        setToast({
          open: true,
          message: "Impossible de charger les données académiques.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filteredCycles = useMemo(() => {
    if (!form.filiere_souhaitee) return [];
    return cycles.filter(
      (c) => (c.filiere?.id || c.filiere) === form.filiere_souhaitee,
    );
  }, [cycles, form.filiere_souhaitee]);

  const filteredLevels = useMemo(() => {
    if (!form.cycle_souhaite) return [];
    return levels.filter(
      (l) => (l.cycle?.id || l.cycle) === form.cycle_souhaite,
    );
  }, [levels, form.cycle_souhaite]);

  const validateStep1 = () => {
    const errors = {};
    if (!form.nom_candidat.trim()) errors.nom_candidat = "Requis";
    if (!form.prenom_candidat.trim()) errors.prenom_candidat = "Requis";
    if (!form.date_naissance) errors.date_naissance = "Requis";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Email invalide";
    if (!form.telephone.trim()) errors.telephone = "Requis";
    if (form.telephone && !/^[0-9+\s\-]+$/.test(form.telephone))
      errors.telephone = "Numéro invalide (chiffres, +, - et espaces uniquement)";
    if (!form.filiere_souhaitee) errors.filiere_souhaitee = "Requis";
    if (!form.cycle_souhaite) errors.cycle_souhaite = "Requis";
    if (!form.niveau_souhaite) errors.niveau_souhaite = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!form.bulletin) errors.bulletin = "Veuillez joindre votre bulletin";
    if (!recaptchaToken) errors.recaptcha = "Veuillez cocher le reCAPTCHA.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) {
      setActiveStep(1);
      setFormErrors({});
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    setFormErrors({});
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, bulletin: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nom_candidat", form.nom_candidat.trim());
      formData.append("prenom_candidat", form.prenom_candidat.trim());
      formData.append("date_naissance", form.date_naissance);
      formData.append("email", form.email.trim());
      formData.append("telephone", (form.indicatif + form.telephone).trim());
      formData.append("nom_parent", form.nom_parent.trim());
      formData.append("whatsapp_parent", form.whatsapp_parent.trim());
      formData.append("filiere_souhaitee", form.filiere_souhaitee);
      formData.append("cycle_souhaite", form.cycle_souhaite);
      formData.append("niveau_souhaite", form.niveau_souhaite);
      formData.append("message", form.message.trim());
      if (form.bulletin) {
        formData.append("bulletin", form.bulletin);
      }
      if (files.photo) {
        formData.append("photo", files.photo);
      }
      if (files.acte_naissance) {
        formData.append("acte_naissance", files.acte_naissance);
      }
      if (files.cni) {
        formData.append("cni", files.cni);
      }
      if (files.diplomes) {
        for (let i = 0; i < files.diplomes.length; i++) {
          formData.append("diplomes", files.diplomes[i]);
        }
      }
      formData.append("recaptcha_token", recaptchaToken);

      await apiRequest({
        url: API_ENDPOINTS.preinscriptions,
        method: "POST",
        data: formData,
        timeout: 60000,
      });
      setIsSuccess(true);
      setToast({
        open: true,
        message: "Votre demande a été envoyée avec succès.",
        severity: "success",
      });
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            fieldErrors[key] = value.join(" ");
          } else if (typeof value === "string") {
            fieldErrors[key] = value;
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
          if (fieldErrors.nom_candidat || fieldErrors.prenom_candidat || fieldErrors.email || fieldErrors.telephone || fieldErrors.filiere_souhaitee || fieldErrors.cycle_souhaite || fieldErrors.niveau_souhaite || fieldErrors.date_naissance) {
            setActiveStep(0);
          }
        }
      }
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Soumission impossible"),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F5F7FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Card
          sx={{ p: 5, borderRadius: 4, maxWidth: 600, textAlign: "center" }}
        >
          <Typography
            variant="h4"
            color="success.main"
            fontWeight="bold"
            gutterBottom
          >
            Pré-inscription envoyée
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Votre dossier a bien été enregistré. L&apos;équipe administrative
            reviendra vers vous après vérification.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Retour à l&apos;accueil
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 8,
        px: 2,
        backgroundImage: "linear-gradient(135deg, #193A7F 0%, #17A2B8 100%)",
      }}
    >
      <Grid container justifyContent="center">
        <Grid item xs={12} md={10} lg={8}>
          <Card
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary"
                gutterBottom
              >
                Préinscription en ligne
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remplissez ce formulaire pour soumettre votre candidature au
                SmartCampus.
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={handleSubmit}>
              {/* ===== ÉTAPE 1 : Informations ===== */}
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      Informations Personnelles
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      value={form.nom_candidat}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          nom_candidat: event.target.value,
                        }))
                      }
                      error={Boolean(formErrors.nom_candidat)}
                      helperText={formErrors.nom_candidat}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      value={form.prenom_candidat}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          prenom_candidat: event.target.value,
                        }))
                      }
                      error={Boolean(formErrors.prenom_candidat)}
                      helperText={formErrors.prenom_candidat}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date de naissance"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.date_naissance}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          date_naissance: event.target.value,
                        }))
                      }
                      error={Boolean(formErrors.date_naissance)}
                      helperText={formErrors.date_naissance}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      error={Boolean(formErrors.email)}
                      helperText={formErrors.email}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Indicatif</InputLabel>
                        <Select
                          value={form.indicatif}
                          label="Indicatif"
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              indicatif: event.target.value,
                            }))
                          }
                        >
                          {COUNTRY_CODES.map((cc) => (
                            <MenuItem key={cc.code} value={cc.code}>
                              {cc.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Numéro de téléphone"
                        value={form.telephone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            telephone: event.target.value,
                          }))
                        }
                        error={Boolean(formErrors.telephone)}
                        helperText={formErrors.telephone || "Ex: 07 12 34 56"}
                        placeholder="07 12 34 56"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      sx={{ mt: 1, fontWeight: 600 }}
                    >
                      Informations du Parent / Tuteur
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom du parent / tuteur"
                      value={form.nom_parent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          nom_parent: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="WhatsApp du parent"
                      placeholder="Ex: +237 6XX XXX XXX"
                      value={form.whatsapp_parent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          whatsapp_parent: event.target.value,
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      sx={{ mt: 1, fontWeight: 600 }}
                    >
                      Informations Académiques
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={Boolean(formErrors.filiere_souhaitee)}
                    >
                      <InputLabel>Filière souhaitée</InputLabel>
                      <Select
                        value={form.filiere_souhaitee}
                        label="Filière souhaitée"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            filiere_souhaitee: event.target.value,
                            cycle_souhaite: "",
                            niveau_souhaite: "",
                          }))
                        }
                      >
                        {loading && <MenuItem disabled>Chargement...</MenuItem>}
                        {!loading && filieres.length === 0 && (
                          <MenuItem disabled>Aucune filière disponible</MenuItem>
                        )}
                        {filieres.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.nom}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.filiere_souhaitee && (
                        <Typography variant="caption" color="error">
                          {formErrors.filiere_souhaitee}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={Boolean(formErrors.cycle_souhaite)}
                      disabled={!form.filiere_souhaitee}
                    >
                      <InputLabel>Cycle souhaité</InputLabel>
                      <Select
                        value={form.cycle_souhaite}
                        label="Cycle souhaité"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            cycle_souhaite: event.target.value,
                            niveau_souhaite: "",
                          }))
                        }
                      >
                        {!form.filiere_souhaitee && (
                          <MenuItem disabled>
                            Choisissez d&apos;abord une filière
                          </MenuItem>
                        )}
                        {filteredCycles.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.nom}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.cycle_souhaite && (
                        <Typography variant="caption" color="error">
                          {formErrors.cycle_souhaite}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl
                      fullWidth
                      error={Boolean(formErrors.niveau_souhaite)}
                      disabled={!form.cycle_souhaite}
                    >
                      <InputLabel>Niveau souhaité</InputLabel>
                      <Select
                        value={form.niveau_souhaite}
                        label="Niveau souhaité"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            niveau_souhaite: event.target.value,
                          }))
                        }
                      >
                        {!form.cycle_souhaite && (
                          <MenuItem disabled>
                            Choisissez d&apos;abord un cycle
                          </MenuItem>
                        )}
                        {filteredLevels.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.nom}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.niveau_souhaite && (
                        <Typography variant="caption" color="error">
                          {formErrors.niveau_souhaite}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Message (optionnel)"
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        onClick={handleNext}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                      >
                        Suivant
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* ===== ÉTAPE 2 : Documents ===== */}
              {activeStep === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      Documents à fournir
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Formats acceptés : PDF, PNG, JPG, JPEG
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <input
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        id="bulletin-upload"
                        type="file"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="bulletin-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<CloudUploadIcon />}
                          color={formErrors.bulletin ? "error" : "primary"}
                          sx={{
                            height: "56px",
                            justifyContent: "flex-start",
                            px: 2,
                          }}
                        >
                          {form.bulletin
                            ? form.bulletin.name
                            : "Bulletin *"}
                        </Button>
                      </label>
                      {formErrors.bulletin && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.5, display: "block" }}
                        >
                          {formErrors.bulletin}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <input
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        id="photo-upload"
                        type="file"
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            photo: e.target.files[0] || null,
                          }))
                        }
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            height: "56px",
                            justifyContent: "flex-start",
                            px: 2,
                          }}
                        >
                          {files.photo
                            ? files.photo.name
                            : "Photo d'identité"}
                        </Button>
                      </label>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <input
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        id="acte-naissance-upload"
                        type="file"
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            acte_naissance: e.target.files[0] || null,
                          }))
                        }
                      />
                      <label htmlFor="acte-naissance-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            height: "56px",
                            justifyContent: "flex-start",
                            px: 2,
                          }}
                        >
                          {files.acte_naissance
                            ? files.acte_naissance.name
                            : "Acte de naissance"}
                        </Button>
                      </label>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <input
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        id="cni-upload"
                        type="file"
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            cni: e.target.files[0] || null,
                          }))
                        }
                      />
                      <label htmlFor="cni-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            height: "56px",
                            justifyContent: "flex-start",
                            px: 2,
                          }}
                        >
                          {files.cni
                            ? files.cni.name
                            : "CNI / Passeport"}
                        </Button>
                      </label>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <input
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        id="diplomes-upload"
                        type="file"
                        multiple
                        onChange={(e) =>
                          setFiles((prev) => ({
                            ...prev,
                            diplomes: e.target.files.length > 0 ? e.target.files : null,
                          }))
                        }
                      />
                      <label htmlFor="diplomes-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            height: "56px",
                            justifyContent: "flex-start",
                            px: 2,
                          }}
                        >
                          {files.diplomes
                            ? `${files.diplomes.length} diplôme(s) sélectionné(s)`
                            : "Diplômes précédents"}
                        </Button>
                      </label>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <RecaptchaV2
                      siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={(token) => {
                        setRecaptchaToken(token);
                        if (token) setRecaptchaError("");
                      }}
                    />
                    {(recaptchaError || formErrors.recaptcha) && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: "block", mt: 1 }}
                      >
                        {recaptchaError || formErrors.recaptcha}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBack}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                      >
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={submitting}
                        sx={{ px: 4, py: 1.5, fontSize: "1.1rem", borderRadius: 2 }}
                      >
                        {submitting ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Soumettre ma préinscription"
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </form>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
