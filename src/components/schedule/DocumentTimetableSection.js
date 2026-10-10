"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ToggleOn as ActiveIcon,
  ToggleOff as InactiveIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  CalendarMonth as CalendarIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { emploiDuTempsDocumentsService } from "../../services/api/services";
import { getMediaUrl } from "../../services/api/client";

export default function DocumentTimetableSection({
  documents = [],
  classes = [],
  isAdmin = false,
  selectedClasseId = null,
  onRefresh = () => {},
  title = "Emplois du temps importés (PDF / Images)",
  subtitle = "Consultez et téléchargez les plannings officiels sous format PDF ou Image.",
}) {
  const [openUpload, setOpenUpload] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Upload Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [uploadForm, setUploadForm] = useState({
    titre: "",
    classe: selectedClasseId || "",
    description: "",
    date_effective: todayStr,
    fichier: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleOpenUpload = () => {
    setUploadForm({
      titre: "Emploi du Temps",
      classe: selectedClasseId || (classes.length > 0 ? classes[0].id : ""),
      description: "",
      date_effective: todayStr,
      fichier: null,
    });
    setFormError("");
    setOpenUpload(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        fichier: file,
        titre: prev.titre || file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.fichier) {
      setFormError("Veuillez sélectionner un fichier (PDF ou Image).");
      return;
    }
    if (!uploadForm.classe) {
      setFormError("Veuillez sélectionner une classe.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("titre", uploadForm.titre);
      formData.append("classe", uploadForm.classe);
      if (uploadForm.description) {
        formData.append("description", uploadForm.description);
      }
      if (uploadForm.date_effective) {
        formData.append("date_effective", uploadForm.date_effective);
      }
      formData.append("fichier", uploadForm.fichier);

      await emploiDuTempsDocumentsService.upload(formData);
      setOpenUpload(false);
      onRefresh();
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
          err?.response?.data?.fichier?.[0] ||
          "Erreur lors de l'import du fichier."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet emploi du temps importé ?")) {
      try {
        await emploiDuTempsDocumentsService.remove(id);
        onRefresh();
      } catch (err) {
        alert("Erreur lors de la suppression du fichier.");
      }
    }
  };

  const handleToggleActive = async (doc) => {
    try {
      await emploiDuTempsDocumentsService.patch(doc.id, {
        est_actif: !doc.est_actif,
      });
      onRefresh();
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  const handleOpenPreview = (doc) => {
    setSelectedDoc(doc);
    setOpenPreview(true);
  };

  // DRF returns fichier as a complete /media/... URL. Keep relative URLs
  // relative to the API host and upgrade legacy HTTP URLs on HTTPS pages.
  const getFileUrl = (fichierPath) => getMediaUrl(fichierPath) || "#";

  const handleDownload = async (doc) => {
    const fileUrl = getFileUrl(doc?.fichier);
    if (!doc?.fichier || fileUrl === "#") return;

    try {
      const downloadUrl = `/api/media-download?url=${encodeURIComponent(fileUrl)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Le fichier n'a pas pu être téléchargé.");

      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.fichier.split("/").pop().split("?")[0] || `${doc.titre || "emploi-du-temps"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Erreur de téléchargement de l'emploi du temps :", error);
      window.alert("Le téléchargement a échoué. Vérifiez que le fichier est toujours disponible, puis réessayez.");
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-");
      if (y && m && d) return `${d}/${m}/${y}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const filteredDocs = selectedClasseId
    ? documents.filter(
        (d) =>
          Number(d.classe) === Number(selectedClasseId) ||
          Number(d.classe_id) === Number(selectedClasseId)
      )
    : documents;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "#193A7F",
            }}
          >
            <CalendarIcon sx={{ color: "#193A7F" }} />
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={handleOpenUpload}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(25, 58, 127, 0.25)",
            }}
          >
            Importer un Emploi du Temps (PDF / Image)
          </Button>
        )}
      </Box>

      {/* Grid of Documents */}
      {filteredDocs.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed #d0d7de",
            bgcolor: "#F8F9FA",
          }}
        >
          <FileIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body1" fontWeight="600" color="text.secondary">
            Aucun emploi du temps sous forme de fichier n&apos;a été importé pour l&apos;instant.
          </Typography>
          {isAdmin && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={handleOpenUpload}
              sx={{ mt: 2, textTransform: "none" }}
            >
              Importer maintenant
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredDocs.map((doc) => {
            const isPdf = doc.is_pdf || doc.fichier?.toLowerCase().split("?")[0].endsWith(".pdf");

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.08)",
                    bgcolor: doc.est_actif ? "#ffffff" : "#F5F5F5",
                    transition: "all 0.25s ease",
                    position: "relative",
                    opacity: doc.est_actif ? 1 : 0.75,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(25, 58, 127, 0.12)",
                      transform: "translateY(-3px)",
                      borderColor: "rgba(25, 58, 127, 0.3)",
                    },
                  }}
                >
                  <Box>
                    {/* Top Row: Icon + Chips */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isPdf
                            ? "rgba(211, 47, 47, 0.1)"
                            : "rgba(25, 118, 210, 0.1)",
                          color: isPdf ? "#d32f2f" : "#1976d2",
                        }}
                      >
                        {isPdf ? <PdfIcon /> : <ImageIcon />}
                      </Box>

                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        <Chip
                          label={isPdf ? "PDF" : "IMAGE"}
                          size="small"
                          color={isPdf ? "error" : "primary"}
                          variant="outlined"
                          sx={{ fontWeight: "700", fontSize: "0.65rem", height: 20 }}
                        />
                        {isAdmin && (
                          <Chip
                            label={doc.est_actif ? "Actif" : "Masqué"}
                            size="small"
                            color={doc.est_actif ? "success" : "default"}
                            sx={{ fontWeight: "600", fontSize: "0.65rem", height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Title & Info */}
                    <Typography
                      variant="subtitle1"
                      fontWeight="700"
                      color="text.primary"
                      sx={{
                        lineHeight: 1.3,
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {doc.titre}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight="600"
                      color="primary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      {doc.classe_nom || "Toutes les classes"}
                    </Typography>

                    {doc.date_effective && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                        <EventIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight="500">
                          Date d&apos;effet : {formatDateDisplay(doc.date_effective)}
                        </Typography>
                      </Box>
                    )}

                    {doc.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          mb: 1.5,
                          fontStyle: "italic",
                        }}
                      >
                        {doc.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions Footer */}
                  <Box sx={{ pt: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)", mt: 1.5 }}>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenPreview(doc)}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      >
                        Aperçu
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(doc)}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      >
                        Télécharger
                      </Button>
                    </Box>

                    {isAdmin && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 1,
                          pt: 0.5,
                        }}
                      >
                        <Tooltip title={doc.est_actif ? "Désactiver" : "Activer"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(doc)}
                            color={doc.est_actif ? "success" : "default"}
                          >
                            {doc.est_actif ? <ActiveIcon /> : <InactiveIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Dialog with Backdating Support */}
      <Dialog
        open={openUpload}
        onClose={() => !submitting && setOpenUpload(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography component="span" variant="h6" fontWeight="bold">
            Importer un Emploi du Temps (PDF / Image)
          </Typography>
          <IconButton onClick={() => setOpenUpload(false)} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleUploadSubmit} sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Titre de l'emploi du temps"
              value={uploadForm.titre}
              onChange={(e) => setUploadForm({ ...uploadForm, titre: e.target.value })}
              placeholder="Ex: Emploi du Temps Semestre 1"
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Classe concernée</InputLabel>
              <Select
                value={uploadForm.classe}
                label="Classe concernée"
                onChange={(e) => setUploadForm({ ...uploadForm, classe: e.target.value })}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Date d'effet / Date de l'emploi du temps (antidatage)"
              type="date"
              value={uploadForm.date_effective}
              onChange={(e) => setUploadForm({ ...uploadForm, date_effective: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Sélectionnez une date passée ou spécifique pour antidater cet emploi du temps"
              fullWidth
            />

            <TextField
              label="Description (Optionnelle)"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Ex: Valable à partir du 1er Octobre"
              multiline
              rows={2}
              fullWidth
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{
                p: 2.5,
                borderStyle: "dashed",
                borderRadius: 2.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                textTransform: "none",
              }}
            >
              <Typography variant="body2" fontWeight="600">
                {uploadForm.fichier
                  ? `Fichier sélectionné : ${uploadForm.fichier.name}`
                  : "Cliquez pour sélectionner un fichier (PDF, PNG, JPG...)"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Formats acceptés : .pdf, .png, .jpg, .jpeg, .webp
              </Typography>
              <input
                type="file"
                hidden
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenUpload(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : <UploadIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {submitting ? "Importation..." : "Importer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, height: "85vh" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography component="span" variant="h6" fontWeight="bold">
              {selectedDoc?.titre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Classe : {selectedDoc?.classe_nom} {selectedDoc?.date_effective ? `| Date d'effet : ${formatDateDisplay(selectedDoc.date_effective)}` : ""}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {selectedDoc && (
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(selectedDoc)}
                sx={{ borderRadius: 2 }}
              >
                Télécharger
              </Button>
            )}
            <IconButton onClick={() => setOpenPreview(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "#1e1e1e", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {selectedDoc && (
            selectedDoc.is_pdf || selectedDoc.fichier?.toLowerCase().split("?")[0].endsWith(".pdf") ? (
              <iframe
                src={getFileUrl(selectedDoc.fichier)}
                title={selectedDoc.titre}
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            ) : (
              <Box
                component="img"
                src={getFileUrl(selectedDoc.fichier)}
                alt={selectedDoc.titre}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  p: 2,
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
