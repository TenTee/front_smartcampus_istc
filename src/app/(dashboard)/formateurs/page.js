"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  formateursService,
  modulesService,
  classesService,
} from "../../../services/api/services";
import ImportExportModal from "../../../components/importExport/ImportExportModal";
import { getApiErrorMessage } from "../../../services/api/client";
import { useUserPermissions } from "../../../utils/permissions";

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

const initialForm = {
  nom: "",
  email: "",
  contact: "",
  indicatif: "+241",
  type_formateur: "permanent",
  salaire: "",
  taux_horaire: "",
  specialites: [],
};

export default function FormateursPage() {
  const { canWrite } = useUserPermissions();
  const canWriteRh = canWrite("can_manage_rh");
  const [searchTerm, setSearchTerm] = useState("");
  const [formateurs, setFormateurs] = useState([]);
  const [specialitesList, setSpecialitesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedFormateur, setSelectedFormateur] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [formateurToDelete, setFormateurToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [openCourseDetail, setOpenCourseDetail] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [openCredentials, setOpenCredentials] = useState(false);
  const [openImportExport, setOpenImportExport] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [filterClasse, setFilterClasse] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Fetch formateurs
  const fetchFormateurs = async () => {
    setLoading(true);
    try {
      // formateursService.getFormateurs or list mapped in services.js
      const data = await formateursService.getFormateurs();
      setFormateurs(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(
          error,
          "Chargement des formateurs impossible.",
        ),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch specialites (using modules API since formateurs teach modules)
  const fetchSpecialites = async () => {
    try {
      const data = await modulesService.list();
      setSpecialitesList(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Erreur chargement spécialités:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await classesService.list();
      setClassesList(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Erreur chargement classes:", error);
    }
  };

  useEffect(() => {
    fetchFormateurs();
    fetchSpecialites();
    fetchClasses();
  }, []);

  const filteredSpecialites = useMemo(() => {
    if (!filterClasse) return specialitesList;
    return specialitesList.filter((spec) =>
      spec.attributions?.some(
        (attr) => attr.classe_id === filterClasse || attr.classe_id === Number(filterClasse)
      )
    );
  }, [specialitesList, filterClasse]);

  const filteredFormateurs = useMemo(() => {
    return formateurs.filter((f) => {
      const nom = f.nom || "";
      const mail = f.email || "";
      return (
        nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [formateurs, searchTerm]);

  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = "Le nom est requis";
    if (!form.email.trim()) errors.email = "L'email est requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Email invalide";
    if (!form.contact.trim()) errors.contact = "Le contact est requis";

    if (form.type_formateur === "permanent") {
      if (!form.salaire.toString().trim()) {
        errors.salaire = "Le salaire est requis";
      } else if (isNaN(form.salaire) || Number(form.salaire) < 0) {
        errors.salaire = "Le salaire doit être un nombre positif";
      }
    } else {
      if (!form.taux_horaire.toString().trim()) {
        errors.taux_horaire = "Le taux horaire est requis";
      } else if (isNaN(form.taux_horaire) || Number(form.taux_horaire) <= 0) {
        errors.taux_horaire = "Le taux horaire doit être un nombre positif";
      }
    }

    if (!form.specialites || form.specialites.length === 0) {
      errors.specialites = "Veuillez sélectionner au moins une spécialité";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setFormErrors({});
    setFilterClasse("");
    setOpenCreate(true);
  };

  const parseContactWithIndicatif = (contact) => {
    if (!contact) return { indicatif: "+241", numero: "" };
    const sorted = [...COUNTRY_CODES].sort(
      (a, b) => b.code.length - a.code.length,
    );
    for (const cc of sorted) {
      if (contact.startsWith(cc.code)) {
        return {
          indicatif: cc.code,
          numero: contact.slice(cc.code.length).trim(),
        };
      }
    }
    return { indicatif: "+241", numero: contact };
  };

  const handleEdit = (formateur) => {
    setIsEditing(true);
    setFormErrors({});
    const specialitesIds = Array.isArray(formateur.specialites)
      ? formateur.specialites.map((sp) => (typeof sp === "object" ? sp.id : sp))
      : [];

    const { indicatif, numero } = parseContactWithIndicatif(formateur.contact);

    setForm({
      id: formateur.id,
      nom: formateur.nom || "",
      email: formateur.email || "",
      contact: numero,
      indicatif: indicatif,
      type_formateur: formateur.type_formateur || "permanent",
      salaire: formateur.salaire || "",
      taux_horaire: formateur.taux_horaire || "",
      specialites: specialitesIds,
    });
    setOpenCreate(true);
  };

  const handleDeleteClick = (formateur) => {
    setFormateurToDelete(formateur);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!formateurToDelete) return;
    try {
      await formateursService.remove(formateurToDelete.id);
      setToast({
        open: true,
        message: "Formateur supprimé avec succès.",
        severity: "success",
      });
      fetchFormateurs();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Suppression impossible."),
        severity: "error",
      });
    } finally {
      setOpenDelete(false);
      setFormateurToDelete(null);
    }
  };

  const handleView = (formateur) => {
    setSelectedFormateur(formateur);
    setOpenDrawer(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const fullContact = `${form.indicatif} ${form.contact}`.trim();
      const payload = {
        nom: form.nom,
        email: form.email,
        contact: fullContact,
        type_formateur: form.type_formateur,
        salaire:
          form.type_formateur === "permanent" ? String(form.salaire) : "0",
        taux_horaire:
          form.type_formateur === "vacataire" ? String(form.taux_horaire) : "0",
        specialites: form.specialites,
      };

      if (isEditing) {
        await formateursService.updateFormateur(form.id, payload);
        setToast({
          open: true,
          message: "Formateur mis à jour avec succès.",
          severity: "success",
        });
      } else {
        const result = await formateursService.createFormateur(payload);
        if (result?.credentials) {
          setCredentials(result.credentials);
          setOpenCredentials(true);
        } else {
          setToast({
            open: true,
            message: "Formateur ajouté avec succès.",
            severity: "success",
          });
        }
      }

      setOpenCreate(false);
      setForm(initialForm);
      fetchFormateurs();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Opération impossible."),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9+\s\-]+$/.test(val)) {
      setForm((prev) => ({ ...prev, contact: val }));
    }
  };

  const getSpecialiteLabels = (specialiteIds) => {
    if (!Array.isArray(specialiteIds)) return "-";
    return specialiteIds
      .map((id) => {
        // Gérer si le tableau contient des objets ou des ID
        const itemId = typeof id === "object" ? id.id : id;
        const match = specialitesList.find((sp) => sp.id === itemId);
        return match
          ? match.intitule || match.nom || `Module #${itemId}`
          : `Spécialité #${itemId}`;
      })
      .join(", ");
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="primary">
          Gestion des Formateurs
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2 }}
            onClick={() => setOpenImportExport(true)}
          >
            Import / Export
          </Button>
          {canWriteRh && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
              onClick={handleOpenCreate}
            >
              Ajouter un formateur
            </Button>
          )}
        </Box>
      </Box>

      {openImportExport && (
        <ImportExportModal
          entity="formateurs"
          onComplete={() => {
            setOpenImportExport(false);
            fetchFormateurs();
          }}
        />
      )}

      {/* Barre de recherche */}
      <Card
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />
        </Box>
      </Card>

      {/* Tableau Listing */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#F5F7FA" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Nom complet</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Rémunération</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Spécialités</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : (
              filteredFormateurs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((formateur) => (
                  <TableRow key={formateur.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {formateur.nom || "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          formateur.type_formateur === "vacataire"
                            ? "Vacataire"
                            : "Permanent"
                        }
                        color={
                          formateur.type_formateur === "vacataire"
                            ? "warning"
                            : "success"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formateur.email || "-"}</TableCell>
                    <TableCell>
                      {formateur.contact ? (
                        <a
                          href={`tel:${formateur.contact.replace(/\s/g, "")}`}
                          style={{
                            textDecoration: "none",
                            color: "#1976d2",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          {formateur.contact}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {formateur.type_formateur === "vacataire"
                        ? formateur.taux_horaire
                          ? `${formateur.taux_horaire} Fcfa/h`
                          : "-"
                        : formateur.salaire
                          ? `${formateur.salaire} Fcfa/mois`
                          : "-"}
                    </TableCell>
                    <TableCell>
                      {formateur.specialites &&
                      formateur.specialites.length > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {formateur.specialites.slice(0, 2).map((sp, idx) => {
                            const spId = typeof sp === "object" ? sp.id : sp;
                            const match = specialitesList.find(
                              (s) => s.id === spId,
                            );
                            const label = match
                              ? match.intitule || match.nom
                              : `Spec #${spId}`;
                            return (
                              <Chip
                                key={idx}
                                size="small"
                                label={label}
                                color="primary"
                                variant="outlined"
                                clickable
                                onClick={() => {
                                  if (match) {
                                    setSelectedCourse(match);
                                    setOpenCourseDetail(true);
                                  }
                                }}
                              />
                            );
                          })}
                          {formateur.specialites.length > 2 && (
                            <Chip
                              size="small"
                              label={`+${formateur.specialites.length - 2}`}
                            />
                          )}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {/* ACTIONS SUR LE TABLEAU DE LISTING */}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(formateur)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {canWriteRh && (
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleEdit(formateur)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canWriteRh && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(formateur)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
            {!loading && filteredFormateurs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Aucun formateur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={filteredFormateurs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes par page :"
      />

      {/* Dialog: Création / Modification */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? "Modifier formateur" : "Ajouter un formateur"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Nom complet"
                value={form.nom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nom: e.target.value }))
                }
                error={Boolean(formErrors.nom)}
                helperText={formErrors.nom}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <FormControl size="small" margin="dense" sx={{ minWidth: 140 }}>
                  <Select
                    value={form.indicatif}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        indicatif: e.target.value,
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
                  margin="dense"
                  size="small"
                  fullWidth
                  label="Numéro"
                  value={form.contact}
                  onChange={handlePhoneChange}
                  error={Boolean(formErrors.contact)}
                  helperText={formErrors.contact || "Ex: 07 12 34 56"}
                  placeholder="07 12 34 56"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel id="type-formateur-label">
                  Type de formateur
                </InputLabel>
                <Select
                  labelId="type-formateur-label"
                  value={form.type_formateur}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type_formateur: e.target.value,
                    }))
                  }
                  label="Type de formateur"
                >
                  <MenuItem value="permanent">
                    Permanent (salaire fixe)
                  </MenuItem>
                  <MenuItem value="vacataire">Vacataire (par heure)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {form.type_formateur === "permanent" ? (
                <TextField
                  margin="dense"
                  size="small"
                  fullWidth
                  label="Salaire mensuel"
                  type="number"
                  value={form.salaire}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, salaire: e.target.value }))
                  }
                  error={Boolean(formErrors.salaire)}
                  helperText={formErrors.salaire}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Fcfa</InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  margin="dense"
                  size="small"
                  fullWidth
                  label="Taux horaire"
                  type="number"
                  value={form.taux_horaire}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      taux_horaire: e.target.value,
                    }))
                  }
                  error={Boolean(formErrors.taux_horaire)}
                  helperText={
                    formErrors.taux_horaire || "Montant par heure de cours"
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Fcfa/h</InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel id="filter-classe-label">
                  Filtrer par classe
                </InputLabel>
                <Select
                  labelId="filter-classe-label"
                  value={filterClasse}
                  onChange={(e) => setFilterClasse(e.target.value)}
                  label="Filtrer par classe"
                >
                  <MenuItem value="">
                    <em>Toutes les classes</em>
                  </MenuItem>
                  {classesList.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                size="small"
                margin="dense"
                error={Boolean(formErrors.specialites)}
              >
                <InputLabel id="specialites-label">
                  Spécialités (Modules)
                </InputLabel>
                <Select
                  labelId="specialites-label"
                  multiple
                  value={form.specialites}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      specialites: e.target.value,
                    }))
                  }
                  label="Spécialités (Modules)"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const match = specialitesList.find(
                          (s) => s.id === value,
                        );
                        return (
                          <Chip
                            key={value}
                            size="small"
                            label={
                              match
                                ? match.intitule || match.nom
                                : `ID: ${value}`
                            }
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {filteredSpecialites.map((spec) => (
                    <MenuItem key={spec.id} value={spec.id}>
                      {spec.intitule || spec.nom}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.specialites && (
                  <Typography variant="caption" color="error">
                    {formErrors.specialites}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenCreate(false)}
            color="inherit"
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : isEditing ? (
              "Mettre à jour"
            ) : (
              "Ajouter"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Suppression */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer le formateur{" "}
          <strong>{formateurToDelete?.nom}</strong> ? Cette action est
          irréversible.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} color="inherit">
            Annuler
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer: Visualisation des détails */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Typography
            variant="h6"
            gutterBottom
            color="primary"
            fontWeight="bold"
          >
            Détails Formateur
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {selectedFormateur && (
            <List disablePadding>
              <ListItem dense>
                <ListItemText
                  primary="Nom complet"
                  secondary={selectedFormateur.nom || "-"}
                />
              </ListItem>
              <ListItem dense>
                <ListItemText
                  primary="Type"
                  secondary={
                    selectedFormateur.type_formateur === "vacataire"
                      ? "Vacataire (payé à l'heure)"
                      : "Permanent (salaire fixe)"
                  }
                />
              </ListItem>
              <ListItem dense>
                <ListItemText
                  primary="Email"
                  secondary={selectedFormateur.email || "-"}
                />
              </ListItem>
              {selectedFormateur.username && (
                <ListItem dense>
                  <ListItemText
                    primary="Identifiant portail"
                    secondary={
                      <Chip
                        label={selectedFormateur.username}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    }
                  />
                </ListItem>
              )}
              <ListItem dense>
                <ListItemText
                  primary="Contact / Téléphone"
                  secondary={
                    selectedFormateur.contact ? (
                      <a
                        href={`tel:${selectedFormateur.contact.replace(/\s/g, "")}`}
                        style={{ textDecoration: "none", color: "#1976d2" }}
                      >
                        {selectedFormateur.contact}
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </ListItem>
              <ListItem dense>
                <ListItemText
                  primary="Rémunération"
                  secondary={
                    selectedFormateur.type_formateur === "vacataire"
                      ? selectedFormateur.taux_horaire
                        ? `${selectedFormateur.taux_horaire} Fcfa / heure`
                        : "-"
                      : selectedFormateur.salaire
                        ? `${selectedFormateur.salaire} Fcfa / mois`
                        : "-"
                  }
                />
              </ListItem>
              <ListItem dense>
                <ListItemText
                  primary="Spécialités"
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    selectedFormateur.specialites?.length > 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {selectedFormateur.specialites.map((sp, idx) => {
                          const spId = typeof sp === "object" ? sp.id : sp;
                          const match = specialitesList.find(
                            (s) => s.id === spId,
                          );
                          const label = match
                            ? match.intitule || match.nom
                            : `Spec #${spId}`;
                          return (
                            <Chip
                              key={idx}
                              size="small"
                              label={label}
                              color="primary"
                              variant="outlined"
                              clickable
                              onClick={() => {
                                if (match) {
                                  setSelectedCourse(match);
                                  setOpenCourseDetail(true);
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
                    ) : (
                      "Aucune spécialité"
                    )
                  }
                />
              </ListItem>
            </List>
          )}
          {selectedFormateur && !selectedFormateur.username && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={async () => {
                  try {
                    const result = await formateursService.generateAccount(
                      selectedFormateur.id,
                    );
                    setCredentials(result);
                    setOpenCredentials(true);
                    setOpenDrawer(false);
                    fetchFormateurs();
                  } catch (error) {
                    setToast({
                      open: true,
                      message: getApiErrorMessage(
                        error,
                        "Impossible de générer le compte.",
                      ),
                      severity: "error",
                    });
                  }
                }}
              >
                Générer un compte portail
              </Button>
            </Box>
          )}
          {selectedFormateur && selectedFormateur.username && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                onClick={async () => {
                  try {
                    const result = await formateursService.resetPassword(
                      selectedFormateur.user,
                    );
                    setCredentials({
                      username: result.username,
                      password: result.new_password,
                    });
                    setOpenCredentials(true);
                    setOpenDrawer(false);
                  } catch (error) {
                    setToast({
                      open: true,
                      message: getApiErrorMessage(
                        error,
                        "Impossible de réinitialiser le mot de passe.",
                      ),
                      severity: "error",
                    });
                  }
                }}
              >
                Réinitialiser le mot de passe
              </Button>
            </Box>
          )}
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={() => setOpenDrawer(false)}
              fullWidth
            >
              Fermer
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialog: Détail du cours */}
      <Dialog
        open={openCourseDetail}
        onClose={() => setOpenCourseDetail(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "primary.main" }}>
          Détail du cours
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedCourse.nom || selectedCourse.intitule}
              </Typography>
              {selectedCourse.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {selectedCourse.description}
                  </Typography>
                </Box>
              )}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Durée
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCourse.duree
                      ? `${selectedCourse.duree} heures`
                      : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Coefficient
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCourse.coefficient || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Semestre
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCourse.semestre || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCourseDetail(false)} variant="outlined">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Identifiants après création */}
      <Dialog
        open={openCredentials}
        onClose={() => setOpenCredentials(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "success.main" }}>
          Identifiants du formateur
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Voici les identifiants de connexion du formateur. Communiquez-les
            lui pour qu&apos;il puisse accéder à son portail.
          </Alert>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f5f5f5" }}>
            <Typography variant="body2" color="text.secondary">
              Nom d&apos;utilisateur
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              {credentials?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mot de passe
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {credentials?.password}
            </Typography>
          </Paper>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Ce mot de passe ne sera plus affiché. Notez-le ou envoyez-le au
            formateur maintenant.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              navigator.clipboard.writeText(
                `Utilisateur: ${credentials?.username}\nMot de passe: ${credentials?.password}`,
              );
              setToast({
                open: true,
                message: "Identifiants copiés !",
                severity: "success",
              });
            }}
          >
            Copier
          </Button>
          <Button variant="contained" onClick={() => setOpenCredentials(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars de notifications (Success/Error) */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
