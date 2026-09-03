"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TablePagination,
  FormControlLabel,
  Switch,
  Link,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  assiduiteService,
  etudiantsService,
  modulesService,
} from "../../../services/api/services";
import { getApiErrorMessage } from "../../../services/api/client";
import { formatDate } from "../../../utils/formatters";
import Skeleton from "@mui/material/Skeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { useUserPermissions } from "../../../utils/permissions";

const initialForm = {
  etudiant: "",
  module: "",
  date: "",
  type: "ABSENCE",
  minutes_retard: "",
  justifie: false,
  justificatif: "",
  justificatifFile: null,
};

export default function AttendancePage() {
  const { canWrite } = useUserPermissions();
  const canWritePedagogie = canWrite('can_manage_pedagogie');
  const [attendances, setAttendances] = useState([]);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Form states
  const [form, setForm] = useState(initialForm);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const { selectedYear } = useAcademicYear();

  const filteredModules = React.useMemo(() => {
    if (!form.etudiant) return modules;
    const student = students.find(
      (s) => Number(s.id) === Number(form.etudiant),
    );
    if (!student) return modules;

    // Get the class ID from the student's latest inscription
    const latestInscription = student.inscriptions?.[0];
    const classeId = latestInscription?.classe;

    if (!classeId) return modules;

    return modules.filter((m) => {
      // Check if module is linked directly to this class
      const isLinkedToClasse = (m.attributions || []).some(
        (attr) => Number(attr.classe_id) === Number(classeId),
      );

      // Also check if linked via academic path (Filiere/Cycle/Niveau)
      const isLinkedViaPath = (m.attributions || []).some(
        (attr) =>
          attr.filiere_nom === latestInscription.filiere_nom &&
          attr.cycle_nom === latestInscription.cycle_nom &&
          attr.niveau_nom === latestInscription.niveau_nom,
      );

      return isLinkedToClasse || isLinkedViaPath;
    });
  }, [form.etudiant, students, modules]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [assD, etuD, modD] = await Promise.all([
        assiduiteService.list(),
        etudiantsService.list(),
        modulesService.list(),
      ]);
      setAttendances(Array.isArray(assD) ? assD : assD?.results || []);
      setStudents(Array.isArray(etuD) ? etuD : etuD?.results || []);
      setModules(Array.isArray(modD) ? modD : modD?.results || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur de chargement des données."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear?.id]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setIsEditing(true);
      setSelectedId(item.id);
      setForm({
        etudiant: item.etudiant || "",
        module: item.module || "",
        date: item.date ? item.date.split("T")[0] : "",
        type: item.type || "ABSENCE",
        minutes_retard: item.minutes_retard || "",
        justifie: !!item.justifie,
        justificatif: item.justificatif || "",
        justificatifFile: null,
      });
    } else {
      setIsEditing(false);
      setSelectedId(null);
      setForm({
        ...initialForm,
        date: new Date().toISOString().split("T")[0],
        justificatifFile: null,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.etudiant || !form.module || !form.date) {
      alert("Veuillez remplir (Étudiant, Cours, Date).");
      return;
    }

    if (form.justifie && !form.justificatifFile && !form.justificatif) {
      alert(
        "Un fichier justificatif (scan ou photo) est obligatoire pour justifier une absence ou un retard.",
      );
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("etudiant", Number(form.etudiant));
    formData.append("module", Number(form.module));
    formData.append("date", form.date);
    formData.append("type", form.type);
    if (form.type === "RETARD" && form.minutes_retard) {
      formData.append("minutes_retard", Number(form.minutes_retard));
    }
    formData.append("justifie", form.justifie);

    if (form.justificatifFile) {
      formData.append("justificatif", form.justificatifFile);
    }

    try {
      if (isEditing) {
        await assiduiteService.update(selectedId, formData);
      } else {
        await assiduiteService.create(formData);
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Erreur lors de l'enregistrement."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await assiduiteService.remove(selectedId);
      setOpenDelete(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Erreur de suppression."));
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Assiduité
        </Typography>
        {canWritePedagogie && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Ajouter une absence / un retard
          </Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#F5F7FA" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Étudiant</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Cours (Module)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Retard (min)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Statut vis vis justificatif
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Justificatif</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Parent</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={26} sx={{ borderRadius: 1, opacity: 0.7 }} /></TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            }
            {error && (
              <TableRow>
                <TableCell colSpan={8}>
                  <ErrorState message={error} onRetry={fetchData} />
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && attendances.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun enregistrement d'assiduité.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              attendances
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>
                      {item.etudiant_nom || item.etudiant}{" "}
                      {item.etudiant_matricule
                        ? `(${item.etudiant_matricule})`
                        : ""}
                    </TableCell>
                    <TableCell>{item.module_nom || item.module}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.type}
                        size="small"
                        color={item.type === "ABSENCE" ? "error" : "warning"}
                      />
                    </TableCell>
                    <TableCell>{item.minutes_retard || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.justifie ? "Justifié" : "Non justifié"}
                        size="small"
                        color={item.justifie ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {item.justificatif ? (
                        <Link
                          href={item.justificatif}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          Voir le document
                        </Link>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.parent_whatsapp ? (
                        <Chip
                          label={item.parent_nom || "Parent"}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {item.parent_whatsapp && (
                        <IconButton
                          size="small"
                          title="Notifier le parent via WhatsApp"
                          sx={{ color: "#25D366" }}
                          onClick={() => {
                            const numero = item.parent_whatsapp.replace(
                              /[^\d+]/g,
                              "",
                            );
                            const nomParent = item.parent_nom || "Cher parent";
                            const nomEtudiant =
                              item.etudiant_nom || "votre enfant";
                            const dateEvt = formatDate(item.date);
                            const moduleNom = item.module_nom || "un cours";
                            let message;
                            if (item.type === "ABSENCE") {
                              message = `Bonjour ${nomParent}, nous vous informons que votre enfant ${nomEtudiant} a été marqué(e) absent(e) le ${dateEvt} au cours de ${moduleNom}. Merci de prendre les dispositions nécessaires. — Administration SmartCampus`;
                            } else {
                              message = `Bonjour ${nomParent}, nous vous informons que votre enfant ${nomEtudiant} a accusé un retard de ${item.minutes_retard || "?"} minutes le ${dateEvt} au cours de ${moduleNom}. — Administration SmartCampus`;
                            }
                            window.open(
                              `https://wa.me/${numero}?text=${encodeURIComponent(message)}`,
                              "_blank",
                            );
                          }}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canWritePedagogie && (
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(item)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canWritePedagogie && (
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedId(item.id);
                            setOpenDelete(true);
                          }}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={attendances.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes :"
      />

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? "Modifier" : "Nouvel enregistrement"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Étudiant</InputLabel>
                <Select
                  value={form.etudiant}
                  label="Étudiant"
                  onChange={(e) =>
                    setForm({ ...form, etudiant: e.target.value })
                  }
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nom || s.matricule || s.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Cours (Module)</InputLabel>
                <Select
                  value={form.module}
                  label="Cours (Module)"
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                >
                  {filteredModules.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                required
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.type}
                  label="Type"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                      minutes_retard:
                        e.target.value === "ABSENCE" ? "" : form.minutes_retard,
                    })
                  }
                >
                  <MenuItem value="ABSENCE">Absence</MenuItem>
                  <MenuItem value="RETARD">Retard</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {form.type === "RETARD" && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minutes de retard"
                  value={form.minutes_retard}
                  onChange={(e) =>
                    setForm({ ...form, minutes_retard: e.target.value })
                  }
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.justifie}
                    onChange={(e) =>
                      setForm({ ...form, justifie: e.target.checked })
                    }
                  />
                }
                label="Justifié"
              />
            </Grid>

            {form.justifie && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Justificatif (Scan ou Photo) * obligatoire
                </Typography>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) =>
                    setForm({ ...form, justificatifFile: e.target.files[0] })
                  }
                  style={{ width: "100%", marginBottom: "10px" }}
                />
                {form.justificatif && (
                  <Typography variant="caption" display="block">
                    Fichier actuel :{" "}
                    <a
                      href={form.justificatif}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir le document
                    </a>
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "En cours..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          Voulez-vous supprimer cet enregistrement d'assiduité ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
