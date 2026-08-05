"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  TablePagination,
} from "@mui/material";
import { formatDate } from "../../../utils/formatters";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import { personnelsService } from "../../../services/api/services";
import ImportExportModal from "../../../components/importExport/ImportExportModal";
import { getApiErrorMessage } from "../../../services/api/client";

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

const initialForm = {
  nom: "",
  contact: "",
  indicatif: "+241",
  fonction: "stagiaire",
  salaire: "",
  date_embauche: "",
  solde_conges_initial: "30",
};

const fontionsOptions = [
  { value: "responsableRh", label: "Responsable RH" },
  { value: "responsablePedagogique", label: "Responsable Pédagogique" },
  { value: "responsableLogistique", label: "Responsable Logistique" },
  { value: "stagiaire", label: "Stagiaire" },
  { value: "femmeMenage", label: "Femme de ménage" },
  { value: "responsableMarketing", label: "Responsable Marketing" },
];

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openImportExport, setOpenImportExport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const [openDelete, setOpenDelete] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await personnelsService.list();
      setStaffList(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(
          error,
          "Impossible de charger le personnel.",
        ),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      const fullName = member.nom || "";
      return (
        !searchTerm || fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [staffList, searchTerm]);

  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = "Le nom est requis";
    if (!form.contact.trim()) errors.contact = "Le contact est requis";
    if (!form.salaire) ;
    //   errors.salaire = "Le salaire est requis";
    // } else if (isNaN(form.salaire) || Number(form.salaire) < 0) {
    //   errors.salaire = "Le salaire doit être positif";
    // }
    //  if (!form.salaire.toString().trim()) {
    //   errors.salaire = "Le salaire est requis";
    // } else if (isNaN(form.salaire) || Number(form.salaire) < 0) {
    //   errors.salaire = "Le salaire doit être positif";
    // }
    if (!form.date_embauche)
      errors.date_embauche = "La date d'embauche est requise";
    if (!form.solde_conges_initial.toString().trim()) {
      errors.solde_conges_initial = "Le solde initial est requis";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setFormErrors({});
    setOpenCreate(true);
  };

  const handleEdit = (member) => {
    setIsEditing(true);
    setFormErrors({});
    const { indicatif, numero } = parseContactWithIndicatif(member.contact);
    setForm({
      id: member.id,
      nom: member.nom || "",
      contact: numero,
      indicatif: indicatif,
      fonction: member.fonction || "stagiaire",
      salaire: member.salaire || "",
      date_embauche: member.date_embauche || "",
      solde_conges_initial: member.solde_conges_initial || "30",
    });
    setOpenCreate(true);
  };

  const handleDeleteClick = (member) => {
    setStaffToDelete(member);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await personnelsService.remove(staffToDelete.id);
      setToast({
        open: true,
        message: "Personnel supprimé avec succès.",
        severity: "success",
      });
      fetchStaff();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Suppression impossible."),
        severity: "error",
      });
    } finally {
      setOpenDelete(false);
      setStaffToDelete(null);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^[0-9+\s\-]+$/.test(val)) {
      setForm((prev) => ({ ...prev, contact: val }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const fullContact = `${form.indicatif} ${form.contact}`.trim();
      const payload = {
        nom: form.nom,
        contact: fullContact,
        fonction: form.fonction,
        salaire: String(form.salaire),
        date_embauche: form.date_embauche,
        solde_conges_initial: parseInt(form.solde_conges_initial, 10),
      };

      if (isEditing) {
        await personnelsService.update(form.id, payload);
        setToast({
          open: true,
          message: "Personnel mis à jour.",
          severity: "success",
        });
      } else {
        await personnelsService.create(payload);
        setToast({
          open: true,
          message: "Nouveau membre du personnel ajouté.",
          severity: "success",
        });
      }

      setOpenCreate(false);
      setForm(initialForm);
      fetchStaff();
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
          Gestion du Personnel
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setOpenImportExport(true)}
          >
            Import / Export
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
            onClick={handleOpenCreate}
          >
            Ajouter un membre
          </Button>
        </Box>
      </Box>

      {openImportExport && (
        <ImportExportModal
          entity="personnels"
          onComplete={() => {
            setOpenImportExport(false);
            fetchStaff();
          }}
        />
      )}

      <Card
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher par nom..."
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
      </Card>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#F5F7FA" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Nom complet</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Fonction</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Embauche</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Congés</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Salaire</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {member.nom || "-"}
                    </TableCell>
                    <TableCell>
                      {member.contact ? (
                        <a
                          href={`tel:${member.contact.replace(/\s/g, "")}`}
                          style={{
                            textDecoration: "none",
                            color: "#1976d2",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          {member.contact}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          fontionsOptions.find(
                            (f) => f.value === member.fonction,
                          )?.label ||
                          member.fonction ||
                          "-"
                        }
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {member.date_embauche
                        ? formatDate(member.date_embauche)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {member.solde_conges_restant} j /{" "}
                          {member.solde_conges_initial} j
                        </Typography>
                        <Chip
                          size="tiny"
                          label={
                            member.est_eligible_conges
                              ? "Éligible"
                              : "Non éligible"
                          }
                          color={
                            member.est_eligible_conges ? "success" : "warning"
                          }
                          sx={{ fontSize: "0.65rem", height: 18 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {member.salaire ? `${member.salaire} Fcfa` : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleEdit(member)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(member)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
            {!loading && filteredStaff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Aucun membre du personnel trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={filteredStaff.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes par page :"
      />

      {/* Dialog Validation */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? "Modifier le membre du personnel" : "Ajouter un membre"}
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
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Salaire"
                type="number"
                value={form.salaire}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, salaire: e.target.value }))
                }
                error={Boolean(formErrors.salaire)}
                helperText={formErrors.salaire}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Date d'embauche"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date_embauche}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    date_embauche: e.target.value,
                  }))
                }
                error={Boolean(formErrors.date_embauche)}
                helperText={formErrors.date_embauche}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Solde congés initial"
                type="number"
                value={form.solde_conges_initial}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    solde_conges_initial: e.target.value,
                  }))
                }
                error={Boolean(formErrors.solde_conges_initial)}
                helperText={formErrors.solde_conges_initial}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" margin="dense">
                <InputLabel>Fonction</InputLabel>
                <Select
                  value={form.fonction}
                  label="Fonction"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fonction: e.target.value }))
                  }
                >
                  {fontionsOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
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

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer le membre{" "}
          <strong>{staffToDelete?.nom}</strong> ?
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

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
