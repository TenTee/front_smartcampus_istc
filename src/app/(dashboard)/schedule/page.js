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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import {
  emploiDuTempsService,
  filieresV2Service,
  modulesService,
  formateursService,
  classesService,
  cyclesService,
  cycleGlobalsService,
  sallesService,
} from "../../../services/api/services";
import { getApiErrorMessage } from "../../../services/api/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ImportExportModal from "../../../components/importExport/ImportExportModal";
import TableSkeleton from "../../../components/common/TableSkeleton";
import ErrorState from "../../../components/common/ErrorState";
import { useUserPermissions } from "../../../utils/permissions";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h to 18h

const initialForm = {
  jour: "",
  heure_debut: "",
  heure_fin: "",
  salle: "",
  filiere: "",
  cycle: "",
  classe: "",
  module: "",
  formateur: "",
};

export default function SchedulePage() {
  const { canWrite } = useUserPermissions();
  const canWritePedagogie = canWrite('can_manage_pedagogie');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filter states
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterCycle, setFilterCycle] = useState("");
  const [filterClasse, setFilterClasse] = useState("");

  // Form states
  const [form, setForm] = useState(initialForm);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Tronc Commun states
  const [isTroncCommun, setIsTroncCommun] = useState(false);
  const [selectedFilieres, setSelectedFilieres] = useState([]);

  // Related data
  const [filieres, setFilieres] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allCycles, setAllCycles] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [modules, setModules] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [cycleGlobals, setCycleGlobals] = useState([]);
  const [salles, setSalles] = useState([]);
  const [openImportExport, setOpenImportExport] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [schedData, filD, cycD, classD, modD, formateurD, cgD, salleD] =
        await Promise.all([
          emploiDuTempsService.list(),
          filieresV2Service.list(),
          cyclesService.list(),
          classesService.list(),
          modulesService.list(),
          formateursService.list(),
          cycleGlobalsService.list(),
          sallesService.list(),
        ]);
      setSchedules(
        Array.isArray(schedData) ? schedData : schedData?.results || [],
      );
      setFilieres(Array.isArray(filD) ? filD : filD?.results || []);
      setAllCycles(Array.isArray(cycD) ? cycD : cycD?.results || []);
      setAllClasses(Array.isArray(classD) ? classD : classD?.results || []);
      setModules(Array.isArray(modD) ? modD : modD?.results || []);
      setFormateurs(
        Array.isArray(formateurD) ? formateurD : formateurD?.results || [],
      );
      setCycleGlobals(Array.isArray(cgD) ? cgD : cgD?.results || []);
      setSalles(Array.isArray(salleD) ? salleD : salleD?.results || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur de chargement des données."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cascading filters
  useEffect(() => {
    if (filterFiliere) {
      setCycles(
        allCycles.filter(
          (c) => c.filiere === filterFiliere || c.filiere_id === filterFiliere,
        ),
      );
    } else {
      setCycles([]);
    }
    setFilterCycle("");
    setFilterClasse("");
  }, [filterFiliere, allCycles]);

  useEffect(() => {
    if (filterCycle) {
      setClasses(
        allClasses.filter(
          (c) => c.cycle === filterCycle || c.cycle_id === filterCycle,
        ),
      );
    } else {
      setClasses([]);
    }
    setFilterClasse("");
  }, [filterCycle, allClasses]);

  //   const timeToMinutes = (time) => {
  //   const [h, m] = time.split(':').map(Number);
  //   return h * 60 + m;
  // };

  // const session = filteredSchedules.find(s => {
  //   if (s.jour !== jour) return false;

  //   const slotStart = hour * 60;
  //   const slotEnd = (hour + 1) * 60;

  //   const courseStart = timeToMinutes(s.heure_debut);
  //   const courseEnd = timeToMinutes(s.heure_fin);

  //   return courseStart < slotEnd && courseEnd > slotStart;
  // });

  const getDayBoundaries = () => {
    if (!filterClasse) return { start: 8, end: 18 };
    const cls = allClasses.find((c) => Number(c.id) === Number(filterClasse));
    if (!cls) return { start: 8, end: 18 };

    const cycle = allCycles.find(
      (cy) => Number(cy.id) === Number(cls.cycle || cls.cycle_id),
    );
    if (!cycle || !cycle.type_cycle) return { start: 8, end: 18 };

    const cg = cycleGlobals.find(
      (g) => Number(g.id) === Number(cycle.type_cycle || cycle.type_cycle_id),
    );
    if (!cg) return { start: 8, end: 18 };

    const start = parseInt(cg.heure_debut_journee?.split(":")[0] || "8");
    const end = parseInt(cg.heure_fin_journee?.split(":")[0] || "18");
    return { start, end };
  };

  const getBreakTime = () => {
    if (!filterClasse) return null;
    const cls = allClasses.find((c) => Number(c.id) === Number(filterClasse));
    if (!cls) return null;

    const cycle = allCycles.find(
      (cy) => Number(cy.id) === Number(cls.cycle || cls.cycle_id),
    );
    if (!cycle || !cycle.type_cycle) return { debut: "12:00", fin: "13:00" };

    const cg = cycleGlobals.find(
      (g) => Number(g.id) === Number(cycle.type_cycle || cycle.type_cycle_id),
    );
    if (!cg) return { debut: "12:00", fin: "13:00" };

    return {
      debut: cg.heure_pause_debut?.slice(0, 5) || "12:00",
      fin: cg.heure_pause_fin?.slice(0, 5) || "13:00",
    };
  };

  const filteredSchedules = filterClasse
    ? schedules.filter(
        (s) => s.classe === filterClasse || s.classe_id === filterClasse,
      )
    : [];

  const handleOpenDialog = (item = null, defaults = {}) => {
    if (item) {
      setIsEditing(true);
      setSelectedId(item.id);
      setIsTroncCommun(false);
      setSelectedFilieres([]);
      setForm({
        jour: item.jour || "",
        heure_debut: item.heure_debut ? item.heure_debut.slice(0, 5) : "",
        heure_fin: item.heure_fin ? item.heure_fin.slice(0, 5) : "",
        salle: item.salle?.id || item.salle || "",
        filiere: item.filiere || "",
        cycle: item.cycle || "",
        classe: item.classe || "",
        module: item.module || "",
        formateur: item.formateur || "",
      });
    } else {
      setIsEditing(false);
      setSelectedId(null);
      setIsTroncCommun(false);
      setSelectedFilieres([]);
      setForm({
        ...initialForm,
        filiere: filterFiliere || "",
        cycle: filterCycle || "",
        classe: filterClasse || "",
        ...defaults,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (
      !form.jour ||
      !form.heure_debut ||
      !form.heure_fin ||
      !form.salle ||
      !form.module ||
      !form.formateur
    ) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!isTroncCommun && !form.classe) {
      alert("Veuillez sélectionner une classe.");
      return;
    }

    if (isTroncCommun && selectedFilieres.length === 0) {
      alert("Veuillez sélectionner au moins une filière pour le tronc commun.");
      return;
    }

    setSubmitting(true);

    try {
      if (isTroncCommun && !isEditing) {
        // Tronc Commun creation logic
        const targetClasses = allClasses.filter((c) =>
          selectedFilieres.includes(c.filiere_id || c.filiere),
        );

        if (targetClasses.length === 0) {
          alert("Aucune classe n'est associée aux filières sélectionnées.");
          setSubmitting(false);
          return;
        }

        const debutForm = form.heure_debut.slice(0, 5);
        const finForm = form.heure_fin.slice(0, 5);

        const conflicts = schedules.filter((s) => {
          if (s.jour !== form.jour) return false;
          // Check time overlap: startA < endB && endA > startB
          const startA = s.heure_debut ? s.heure_debut.slice(0, 5) : "";
          const endA = s.heure_fin ? s.heure_fin.slice(0, 5) : "";
          if (!startA || !endA) return false;

          const hasTimeOverlap = startA < finForm && endA > debutForm;
          if (!hasTimeOverlap) return false;

          // Check if overlap applies to target classes
          return targetClasses.some(
            (tc) => Number(tc.id) === Number(s.classe_id || s.classe),
          );
        });

        // Delete conflicting schedules
        for (const conflict of conflicts) {
          await emploiDuTempsService.remove(conflict.id);
        }

        // Create new schedule for each targeted class
        for (const tc of targetClasses) {
          const payload = {
            jour: form.jour,
            heure_debut:
              form.heure_debut + (form.heure_debut.length === 5 ? ":00" : ""),
            heure_fin:
              form.heure_fin + (form.heure_fin.length === 5 ? ":00" : ""),
            salle: form.salle,
            classe: Number(tc.id),
            filiere: tc.filiere_id || tc.filiere,
            niveau: tc.niveau_id || tc.niveau,
            module: Number(form.module),
            formateur: Number(form.formateur),
          };
          await emploiDuTempsService.create(payload);
        }
      } else {
        // Normal save or edit logic
        const selectedClass = allClasses.find(
          (c) => c.id === Number(form.classe),
        );
        if (!selectedClass) {
          alert("Classe non trouvée.");
          setSubmitting(false);
          return;
        }

        const payload = {
          jour: form.jour,
          heure_debut:
            form.heure_debut + (form.heure_debut.length === 5 ? ":00" : ""),
          heure_fin:
            form.heure_fin + (form.heure_fin.length === 5 ? ":00" : ""),
          salle: form.salle,
          classe: Number(form.classe),
          filiere: selectedClass.filiere_id || selectedClass.filiere,
          niveau: selectedClass.niveau_id || selectedClass.niveau,
          module: Number(form.module),
          formateur: Number(form.formateur),
        };

        if (isEditing) {
          await emploiDuTempsService.update(selectedId, payload);
        } else {
          await emploiDuTempsService.create(payload);
        }
      }

      setOpenDialog(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Erreur lors de l'enregistrement."));
    } finally {
      setSubmitting(false);
    }
  };

  const exportPDF = () => {
    const input = document.getElementById("schedule-grid");
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Emploi_du_temps_${filterClasse}.pdf`);
    });
  };

  const exportExcel = () => {
    // Simple CSV export for now
    let csv = "Jour,Horaire,Module,Formateur,Salle\n";
    filteredSchedules.forEach((s) => {
      csv += `${s.jour},${s.heure_debut}-${s.heure_fin},${s.module_nom},${s.formateur_nom},${s.salle_nom || s.salle}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Emploi_du_temps_${filterClasse}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await emploiDuTempsService.remove(selectedId);
      setOpenDelete(false);
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Erreur de suppression."));
    }
  };

  const availableSalles = React.useMemo(() => {
    if (!form.jour || !form.heure_debut || !form.heure_fin) {
      return salles;
    }

    const start = form.heure_debut;
    const end = form.heure_fin;

    const occupiedSalleIds = schedules
      .filter((s) => {
        if (isEditing && s.id === selectedId) {
          return false;
        }

        if (s.jour !== form.jour) {
          return false;
        }

        const sStart = s.heure_debut?.slice(0, 5);
        const sEnd = s.heure_fin?.slice(0, 5);

        return sStart < end && sEnd > start;
      })
      .map((s) => Number(s.salle?.id || s.salle));

    return salles.filter((r) => !occupiedSalleIds.includes(r.id));
  }, [
    salles,
    schedules,
    form.jour,
    form.heure_debut,
    form.heure_fin,
    isEditing,
    selectedId,
  ]);

  const filteredModulesForForm = React.useMemo(() => {
    if (!form.classe) return [];
    const selectedClass = allClasses.find(
      (c) => Number(c.id) === Number(form.classe),
    );
    if (!selectedClass || !selectedClass.modules) return [];
    const classModuleIds = selectedClass.modules
      .map((m) => (typeof m === "object" ? m.id : m))
      .map(Number);
    return modules.filter((m) => classModuleIds.includes(Number(m.id)));
  }, [form.classe, allClasses, modules]);

  const timeToMinutes = (time) => {
    if (!time) return 0;

    const parts = time.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);

    return h * 60 + m;
  };

  const renderGrid = () => {
    const breakTime = getBreakTime();
    const { start, end } = getDayBoundaries();
    // const hours = Array.from({ length: end - start + 1 }, (_, i) => i + start);
    const hours = Array.from({ length: end - start }, (_, i) => i + start);
    return (
      <Box
        id="schedule-grid"
        sx={{
          mt: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          bgcolor: "white",
          overflow: "auto",
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "#F5F7FA" }}>
            <TableRow>
              <TableCell
                sx={{
                  width: 80,
                  fontWeight: "bold",
                  bgcolor: "#F5F7FA",
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                }}
              >
                Heure
              </TableCell>
              {JOURS.map((jour) => (
                <TableCell
                  key={jour}
                  align="center"
                  sx={{ fontWeight: "bold", minWidth: 150 }}
                >
                  {jour}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {hours.map((hour) => {
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const isBreak =
                breakTime &&
                timeStr >= breakTime.debut &&
                timeStr < breakTime.fin;

              return (
                <TableRow key={hour}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      bgcolor: "#F5F7FA",
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                    }}
                  >
                    {timeStr}
                  </TableCell>
                  {JOURS.map((jour) => {
                    const session = filteredSchedules.find((s) => {
                      if (s.jour !== jour) return false;

                      const slotStart = hour * 60;
                      const slotEnd = (hour + 1) * 60;

                      const courseStart = timeToMinutes(s.heure_debut);
                      const courseEnd = timeToMinutes(s.heure_fin);

                      return courseStart < slotEnd && courseEnd > slotStart;
                    });

                    return (
                      <TableCell
                        key={jour}
                        align="center"
                        sx={{
                          height: 80,
                          borderLeft: "1px solid #f0f0f0",
                          bgcolor: isBreak ? "#f5f5f5" : "transparent",
                          cursor: isBreak ? "not-allowed" : "pointer",
                          "&:hover": {
                            bgcolor: isBreak
                              ? "#f5f5f5"
                              : "rgba(25, 58, 127, 0.05)",
                          },
                        }}
                        onClick={() =>
                          !isBreak &&
                          !session &&
                          handleOpenDialog(null, {
                            jour,
                            heure_debut: timeStr,
                            heure_fin: `${(hour + 1).toString().padStart(2, "0")}:00`,
                          })
                        }
                      >
                        {isBreak ? (
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            fontWeight="bold"
                          >
                            PAUSE
                          </Typography>
                        ) : session ? (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              bgcolor: "rgba(25, 58, 127, 0.1)",
                              border: "1px solid rgba(25, 58, 127, 0.2)",
                              borderRadius: 1,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              position: "relative",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(session);
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="primary"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {session.module_nom || "Module"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              {session.formateur_nom || "Formateur"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {session.salle_nom || session.salle}
                            </Typography>
                          </Paper>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Emploi du temps
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportPDF}
            disabled={!filterClasse}
          >
            Exporter PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setOpenImportExport(true)}
            disabled={!filterClasse}
          >
            Import / Export
          </Button>
          {canWritePedagogie && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nouveau Créneau
            </Button>
          )}
        </Box>
      </Box>

      {/* FILTER HEADER */}
      {openImportExport && (
        <ImportExportModal
          entity="emploi-du-temps"
          onComplete={() => {
            setOpenImportExport(false);
            fetchData();
          }}
        />
      )}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FilterListIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filière</InputLabel>
          <Select
            value={filterFiliere}
            label="Filière"
            onChange={(e) => setFilterFiliere(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ minWidth: 150 }}
          disabled={!filterFiliere}
        >
          <InputLabel>Cycle</InputLabel>
          <Select
            value={filterCycle}
            label="Cycle"
            onChange={(e) => setFilterCycle(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            {cycles.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ minWidth: 150 }}
          disabled={!filterCycle}
        >
          <InputLabel>Classe</InputLabel>
          <Select
            value={filterClasse}
            label="Classe"
            onChange={(e) => setFilterClasse(e.target.value)}
          >
            <MenuItem value="">Toutes</MenuItem>
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {filterClasse && (
          <Chip
            label={`Break: ${getBreakTime()?.debut} - ${getBreakTime()?.fin}`}
            color="secondary"
            variant="outlined"
            size="small"
          />
        )}
      </Paper>

      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filterClasse ? (
        renderGrid()
      ) : (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "#f8f9fa",
          }}
        >
          <Typography color="text.secondary">
            Veuillez sélectionner une classe pour afficher l'emploi du temps.
          </Typography>
        </Paper>
      )}

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ bgcolor: "#193A7F", color: "white" }}>
          {isEditing ? "Modifier le créneau" : "Nouveau créneau"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {!isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTroncCommun}
                      onChange={(e) => setIsTroncCommun(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography fontWeight="bold">
                      Créneau en tronc commun
                    </Typography>
                  }
                />
              </Grid>
            )}

            {isTroncCommun && !isEditing ? (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Filières concernées</InputLabel>
                  <Select
                    multiple
                    value={selectedFilieres}
                    label="Filières concernées"
                    onChange={(e) =>
                      setSelectedFilieres(
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value,
                      )
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const f = filieres.find((f) => f.id === value);
                          return (
                            <Chip
                              key={value}
                              label={f ? f.nom : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {filieres.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Filière</InputLabel>
                    <Select
                      value={form.filiere}
                      label="Filière"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          filiere: e.target.value,
                          classe: "",
                          module: "",
                        })
                      }
                    >
                      <MenuItem value="">Sélectionnez une filière</MenuItem>
                      {filieres.map((f) => (
                        <MenuItem key={f.id} value={f.id}>
                          {f.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required disabled={!form.filiere}>
                    <InputLabel>Classe</InputLabel>
                    <Select
                      value={form.classe}
                      label="Classe"
                      onChange={(e) =>
                        setForm({ ...form, classe: e.target.value })
                      }
                    >
                      {allClasses
                        .filter(
                          (c) =>
                            c.filiere_id === form.filiere ||
                            c.filiere === form.filiere,
                        )
                        .map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.nom}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Jour</InputLabel>
                <Select
                  value={form.jour}
                  label="Jour"
                  onChange={(e) => setForm({ ...form, jour: e.target.value })}
                >
                  {JOURS.map((j) => (
                    <MenuItem key={j} value={j}>
                      {j}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Début"
                required
                InputLabelProps={{ shrink: true }}
                value={form.heure_debut}
                onChange={(e) =>
                  setForm({ ...form, heure_debut: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Fin"
                required
                InputLabelProps={{ shrink: true }}
                value={form.heure_fin}
                onChange={(e) =>
                  setForm({ ...form, heure_fin: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="salle-select-label">Salle / Lieu</InputLabel>
                <Select
                  labelId="salle-select-label"
                  value={form.salle}
                  label="Salle / Lieu"
                  onChange={(e) => setForm({ ...form, salle: e.target.value })}
                >
                  {availableSalles.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nom} {s.capacite ? `(Capacité: ${s.capacite})` : ""}
                    </MenuItem>
                  ))}
                  {availableSalles.length === 0 && (
                    <MenuItem disabled value="">
                      Aucune salle disponible à cette heure
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={!form.classe}>
                <InputLabel>Cours / Module</InputLabel>
                <Select
                  value={form.module}
                  label="Cours / Module"
                  onChange={(e) => setForm({ ...form, module: e.target.value, formateur: '' })}
                >
                  {modules
                    .filter((m) => {
                      if (isTroncCommun) {
                        if (selectedFilieres.length === 0) return true;
                        const sel = selectedFilieres.map(String);
                        return (
                          (m.attributions || []).some(
                            (a) =>
                              sel.includes(String(a.filiere_id)) ||
                              sel.includes(String(a.filiere)),
                          ) ||
                          sel.includes(String(m.filiere_id)) ||
                          sel.includes(String(m.filiere))
                        );
                      } else {
                        if (!form.filiere && !form.classe) return true;
                        const fId = form.filiere ? String(form.filiere) : null;
                        const cId = form.classe ? String(form.classe) : null;

                        return (
                          (m.attributions || []).some(
                            (a) =>
                              (fId &&
                                (String(a.filiere_id) === fId ||
                                  String(a.filiere) === fId)) ||
                              (cId &&
                                (String(a.classe_id) === cId ||
                                  String(a.classe) === cId)),
                          ) ||
                          (fId &&
                            (String(m.filiere_id) === fId ||
                              String(m.filiere) === fId)) ||
                          (cId &&
                            (String(m.classe_id) === cId ||
                              String(m.classe) === cId))
                        );
                      }
                    })
                    .map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.nom}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Formateur</InputLabel>
                <Select
                  value={form.formateur}
                  label="Formateur"
                  onChange={(e) =>
                    setForm({ ...form, formateur: e.target.value })
                  }
                >
                  {formateurs
                    .filter((f) => !form.module || (f.specialites && f.specialites.includes(form.module)))
                    .map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.nom || f.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Annuler
          </Button>
          {isEditing && (
            <Button
              color="error"
              onClick={() => setOpenDelete(true)}
              disabled={submitting}
            >
              Supprimer
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Supprimer le créneau ?</DialogTitle>
        <DialogContent>Cette action est irréversible.</DialogContent>
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
