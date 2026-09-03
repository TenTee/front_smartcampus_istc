"use client";

import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Grid,
  Tooltip,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import GridOnIcon from "@mui/icons-material/GridOn";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import SummarizeIcon from "@mui/icons-material/Summarize";
import VerifiedIcon from "@mui/icons-material/Verified";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

import {
  notesService,
  etudiantsService,
  modulesService,
  evaluationsService,
  classesService,
  filieresV2Service,
  cyclesService,
  configurationEtablissementService,
  parametresGlobauxService,
} from "../../../services/api/services";
import { getApiErrorMessage, getMediaUrl } from "../../../services/api/client";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import TableSkeleton from "../../../components/common/TableSkeleton";
import ErrorState from "../../../components/common/ErrorState";
import GradeFormModal from "../../../components/grades/GradeFormModal";
import ReleveNotesTemplate from "../../../components/grades/ReleveNotesTemplate";
import {
  buildExportWorkbook,
  getEntityImportConfig,
  downloadXlsxWorkbook,
} from "../../../utils/importExportUtils";
import { getStoredPermissions, hasReadAccess, hasWriteAccess } from "../../../utils/permissions";

const premiumStyles = {
  container: { p: 4, bgcolor: "#f8fafc", minHeight: "100vh" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 4,
    flexWrap: "wrap",
    gap: 2,
  },
  title: {
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: "-0.02em",
    fontSize: "2rem",
  },
  actionBtn: { borderRadius: "10px", textTransform: "none", fontWeight: 600 },
  card: {
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    bgcolor: "white",
    p: 3,
    mb: 3,
  },
  tableCell: {
    py: 2,
    color: "#334155",
    fontWeight: 500,
    borderBottom: "1px solid #f1f5f9",
  },
  tableHeadCell: {
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    bgcolor: "#f1f5f9",
    py: 2,
  },
  transcriptHeader: { textAlign: "center", mb: 4 },
  tabsWrapper: { mb: 4, borderBottom: "1px solid #e2e8f0" },
  input: {
    "& .MuiInputBase-root": { borderRadius: "8px" },
    "& .MuiOutlinedInput-input": { py: 1.5 },
  },
};

export default function GradesPage() {
  const [tabValue, setTabValue] = useState(0);
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [evaluationsList, setEvaluationsList] = useState([]);
  const [classesList, setClassesList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const { selectedYear } = useAcademicYear();
  const permissions = getStoredPermissions();
  const canReadGrades = hasReadAccess(permissions.can_manage_pedagogie) || hasReadAccess(permissions.can_manage_etudiants);
  const canWriteGrades = hasWriteAccess(permissions.can_manage_pedagogie) || hasWriteAccess(permissions.can_manage_etudiants);
  const [selectedNote, setSelectedNote] = useState(null);

  const [selectedStudentForTranscript, setSelectedStudentForTranscript] =
    useState("");
  const [transcriptFiliere, setTranscriptFiliere] = useState("");
  const [transcriptCycle, setTranscriptCycle] = useState("");
  const [transcriptClasse, setTranscriptClasse] = useState("");
  const [releveData, setReleveData] = useState(null);
  const [releveLoading, setReleveLoading] = useState(false);
  const releveRef = useRef(null);

  const [filieresList, setFilieresList] = useState([]);
  const [cyclesList, setCyclesList] = useState([]);

  // Batch Entry State
  const [batchParams, setBatchParams] = useState({
    classe: "",
    module: "",
    evaluation: "",
  });
  const [batchData, setBatchData] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [rattrapageClasse, setRattrapageClasse] = useState("");
  const [rattrapageSession, setRattrapageSession] = useState("");
  const [rattrapages, setRattrapages] = useState([]);
  const [rattrapageLoading, setRattrapageLoading] = useState(false);

  const initialForm = {
    etudiant: "",
    module: "",
    classe: "",
    note_cc: "",
    note_sn: "",
  };
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [config, setConfig] = useState(null);
  const [gradeParams, setGradeParams] = useState({ pourcentage_cc: 30, pourcentage_sn: 70 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        resNotes,
        resEtudiants,
        resModules,
        resEvals,
        resClasses,
        resFilieres,
        resCycles,
        resConfig,
        resParams,
      ] = await Promise.all([
        notesService.list().catch(() => []),
        etudiantsService.list().catch(() => []),
        modulesService.list().catch(() => []),
        evaluationsService.list().catch(() => []),
        classesService.list().catch(() => []),
        filieresV2Service.list().catch(() => []),
        cyclesService.list().catch(() => []),
        configurationEtablissementService.getCurrent().catch(() => null),
        parametresGlobauxService.getStats().catch(() => null),
      ]);
      setNotes(Array.isArray(resNotes) ? resNotes : resNotes?.results || []);
      setStudents(
        Array.isArray(resEtudiants)
          ? resEtudiants
          : resEtudiants?.results || [],
      );
      setModulesList(
        Array.isArray(resModules) ? resModules : resModules?.results || [],
      );
      setEvaluationsList(
        Array.isArray(resEvals) ? resEvals : resEvals?.results || [],
      );
      setClassesList(
        Array.isArray(resClasses) ? resClasses : resClasses?.results || [],
      );
      setFilieresList(
        Array.isArray(resFilieres) ? resFilieres : resFilieres?.results || [],
      );
      setCyclesList(
        Array.isArray(resCycles) ? resCycles : resCycles?.results || [],
      );
      setConfig(resConfig);
      if (resParams) {
        setGradeParams({
          pourcentage_cc: resParams.pourcentage_cc ?? 30,
          pourcentage_sn: resParams.pourcentage_sn ?? 70,
        });
      }
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Erreur de chargement"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear?.id]);

  const fetchRattrapages = useCallback(async () => {
    setRattrapageLoading(true);
    try {
      const data = await notesService.rattrapages({
        ...(rattrapageClasse ? { classe: rattrapageClasse } : {}),
        ...(rattrapageSession ? { session: rattrapageSession } : {}),
      });
      setRattrapages(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Impossible de charger les rattrapages."),
        severity: "error",
      });
    } finally {
      setRattrapageLoading(false);
    }
  }, [rattrapageClasse, rattrapageSession]);

  useEffect(() => {
    if (tabValue === 3) fetchRattrapages();
  }, [tabValue, fetchRattrapages, selectedYear?.id]);

  const handleDownloadRattrapagesPdf = () => {
    if (!rattrapages.length) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const selectedClasse = classesList.find((item) => String(item.id) === String(rattrapageClasse));
    const title = "Liste des étudiants à convoquer au rattrapage";
    pdf.setFontSize(15);
    pdf.text(title, 14, 16);
    pdf.setFontSize(10);
    pdf.text(`Classe : ${selectedClasse?.nom || "Toutes les classes"}`, 14, 23);
    pdf.text(`Semestre : ${rattrapageSession || "Tous les semestres"}`, 14, 29);
    pdf.text("Critère : note finale strictement inférieure à 50 / 100", 14, 35);

    let y = 44;
    const writeHeader = () => {
      pdf.setFontSize(8);
      pdf.setFont(undefined, "bold");
      pdf.text("N°", 14, y);
      pdf.text("Étudiant", 24, y);
      pdf.text("Matricule", 78, y);
      pdf.text("Salle", 112, y);
      pdf.text("Module à rattraper", 148, y);
      pdf.text("Note /100", 190, y);
      pdf.setFont(undefined, "normal");
      y += 6;
    };
    writeHeader();
    rattrapages.forEach((row, index) => {
      if (y > 280) {
        pdf.addPage();
        y = 16;
        writeHeader();
      }
      pdf.text(String(index + 1), 14, y);
      pdf.text(String(row.etudiant_nom || "-").slice(0, 28), 24, y);
      pdf.text(String(row.etudiant_matricule || "-").slice(0, 17), 78, y);
      pdf.text(String(row.salle_nom || "Non planifiée").slice(0, 19), 112, y);
      pdf.text(String(row.module_nom || "-").slice(0, 23), 148, y);
      pdf.text(Number(row.note_finale).toFixed(2), 190, y);
      y += 6;
    });
    pdf.save(`rattrapages_${selectedClasse?.nom?.replace(/\s+/g, "_") || "toutes_classes"}.pdf`);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const eName = n.etudiant?.nom || n.etudiant_nom || "";
      const mName = n.module?.intitule || n.module_nom || "";
      return (
        eName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [notes, searchTerm]);

  const filteredModules = useMemo(() => {
    if (!batchParams.classe) return [];
    const selectedClasse = classesList.find(
      (c) => String(c.id) === String(batchParams.classe),
    );
    if (!selectedClasse) return [];

    // 1. Modules liés directement à la classe via M2M
    const directIds = new Set(
      (selectedClasse.modules || []).map((m) => (typeof m === "object" ? m.id : m)),
    );

    // 2. Modules liés via CourseAssignment (même filière + niveau)
    const classeFiliere = selectedClasse.filiere;
    const classeNiveau = selectedClasse.niveau;

    return modulesList.filter((m) => {
      if (directIds.has(m.id)) return true;
      // Check attributions for matching filiere+niveau or classe_id
      if (m.attributions) {
        return m.attributions.some(
          (att) =>
            String(att.classe_id) === String(selectedClasse.id) ||
            (String(att.filiere_id || "") === String(classeFiliere) &&
              String(att.niveau_id || "") === String(classeNiveau)),
        );
      }
      return false;
    });
  }, [batchParams.classe, classesList, modulesList]);

  const filteredEvaluations = useMemo(() => {
    return evaluationsList.filter((ev) => {
      const matchClasse =
        !batchParams.classe ||
        String(ev.classe) === String(batchParams.classe) ||
        String(ev.classe_id) === String(batchParams.classe);
      const matchModule =
        !batchParams.module ||
        String(ev.module) === String(batchParams.module) ||
        String(ev.module_id) === String(batchParams.module);
      return matchClasse && matchModule;
    });
  }, [batchParams.classe, batchParams.module, evaluationsList]);

  useEffect(() => {
    // Reset module and evaluation when class changes
    setBatchParams((prev) => ({ ...prev, module: "", evaluation: "" }));
    setBatchData([]);
  }, [batchParams.classe]);

  // Auto-load batch data when class and module are selected
  useEffect(() => {
    if (batchParams.classe && batchParams.module) {
      fetchBatchData();
    }
    // when class or module cleared, clear batchData
    if (!batchParams.classe || !batchParams.module) {
      setBatchData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchParams.classe, batchParams.module]);

  useEffect(() => {
    // Reset evaluation when module changes
    setBatchParams((prev) => ({ ...prev, evaluation: "" }));
    setBatchData([]);
  }, [batchParams.module]);

  const filteredCyclesForTranscript = useMemo(() => {
    if (!transcriptFiliere) return [];
    return cyclesList.filter(
      (c) => String(c.filiere) === String(transcriptFiliere),
    );
  }, [transcriptFiliere, cyclesList]);

  const filteredClassesForTranscript = useMemo(() => {
    if (!transcriptCycle) return [];
    return classesList.filter(
      (c) => String(c.cycle) === String(transcriptCycle),
    );
  }, [transcriptCycle, classesList]);

  const filteredStudentsForTranscript = useMemo(() => {
    if (!transcriptClasse) return [];
    // Enrolled students in the selected class
    return students.filter(
      (s) =>
        s.inscriptions &&
        s.inscriptions.some(
          (ins) => String(ins.classe) === String(transcriptClasse),
        ),
    );
  }, [transcriptClasse, students]);

  const fetchBatchData = async () => {
    if (!batchParams.classe || !batchParams.module) return;
    setBatchLoading(true);
    try {
      const data = await notesService.batchEntry({
        classe: batchParams.classe,
        module: batchParams.module,
      });
      setBatchData(
        data.map((item) => ({
          ...item,
          note_cc: item.note_cc || "",
          note_sn: item.note_sn || "",
          validee: !!item.validee,
        })),
      );
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchSave = async () => {
    if (!canWriteGrades) {
      setToast({ open: true, message: "Accès en lecture seule : vous ne pouvez pas enregistrer des notes.", severity: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        notes: batchData.map((item) => ({
          etudiant_id: item.etudiant_id,
          module_id: item.module_id,
          classe_id: item.classe_id,
          evaluation_id: item.evaluation_id,
          note_cc: item.note_cc === "" ? null : item.note_cc,
          note_sn: item.note_sn === "" ? null : item.note_sn,
        })),
      };
      await notesService.batchSave(payload);
      setToast({
        open: true,
        message:
          "Toutes les notes ont été enregistrées. Elles seront visibles par les étudiants après validation.",
        severity: "success",
      });
      fetchData(); // Refresh global list
      // Refresh the batch view so updated notes are visible immediately
      try {
        await fetchBatchData();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchValidate = async (valider = true) => {
    if (!canWriteGrades) {
      setToast({ open: true, message: "Accès en lecture seule : vous ne pouvez pas valider des notes.", severity: "warning" });
      return;
    }
    const noteIds = batchData
      .filter((item) => item.note_id)
      .map((item) => item.note_id);
    if (noteIds.length === 0) {
      setToast({
        open: true,
        message:
          "Aucune note enregistrée à valider. Enregistrez d'abord les notes.",
        severity: "warning",
      });
      return;
    }
    setValidating(true);
    try {
      const payload = { note_ids: noteIds };
      const res = valider
        ? await notesService.valider(payload)
        : await notesService.devalider(payload);
      setToast({
        open: true,
        message: res?.message || (valider ? "Notes validées" : "Notes dévalidées"),
        severity: "success",
      });
      fetchData();
      try {
        await fetchBatchData();
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, valider ? "Erreur lors de la validation" : "Erreur lors de la dévalidation"),
        severity: "error",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleExportModuleNotes = async () => {
    if (!batchParams.classe || !batchParams.module) {
      setToast({
        open: true,
        message: "Sélectionnez une classe et un module avant d'exporter.",
        severity: "warning",
      });
      return;
    }

    try {
      const classeName =
        classesList.find((c) => String(c.id) === String(batchParams.classe))
          ?.nom || batchParams.classe;
      const moduleName =
        modulesList.find((m) => String(m.id) === String(batchParams.module))
          ?.nom || batchParams.module;
      const formateurName =
        batchData[0]?.formateur_nom || batchData[0]?.formateur || "";
      const anneeAcad =
        selectedYear?.nom || selectedYear?.annee || selectedYear?.name || "";

      const headerRows = [
        ["Classe", classeName],
        ["Module", moduleName],
        ["Formateur", formateurName],
        ["Année académique", anneeAcad],
        [],
        ["Matricule", "Note CC", "Note SN", "Note Finale"],
      ];

      const dataRows = batchData.map((item) => [
        item.etudiant_matricule || item.matricule || "",
        item.note_cc === null || item.note_cc === undefined ? "" : item.note_cc,
        item.note_sn === null || item.note_sn === undefined ? "" : item.note_sn,
        item.note_finale === null || item.note_finale === undefined
          ? ""
          : item.note_finale,
      ]);

      const sheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Notes par module");

      downloadXlsxWorkbook(
        workbook,
        `notes_module_${classeName.replace(/\s+/g, "_")}_${moduleName.replace(/\s+/g, "_")}.xlsx`,
      );
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        message: "Erreur lors de l'export des notes par module.",
        severity: "error",
      });
    }
  };


  const computeNoteFinale = (noteCC, noteSN) => {
  const cc = parseFloat(noteCC) || 0;
  const sn = parseFloat(noteSN) || 0;

  return (cc + sn).toFixed(2);

  };

const handleBatchInputChange = (index, field, value) => {
  const newData = [...batchData];
  const ccMax = gradeParams?.pourcentage_cc ?? 30;
  const snMax = gradeParams?.pourcentage_sn ?? 70;

  if ((field === "note_cc" || field === "note_sn") && value !== "") {
    let num = parseFloat(value);

    if (!isNaN(num)) {
      // CC est sur la valeur configuree
      if (field === "note_cc") {
        if (num > ccMax) num = ccMax;
      }

      // SN est sur la valeur configuree
      if (field === "note_sn") {
        if (num > snMax) num = snMax;
      }

      if (num < 0) num = 0;

      value = num;
    }
  }

  newData[index][field] = value;

  const cc = parseFloat(newData[index].note_cc) || 0;
  const sn = parseFloat(newData[index].note_sn) || 0;

  // Note finale sur 100
  newData[index].note_finale = (cc + sn).toFixed(2);

  setBatchData(newData);
};
  const handleSave = async () => {
    if (!canWriteGrades) {
      setToast({ open: true, message: "Accès en lecture seule : vous ne pouvez pas modifier cette note.", severity: "warning" });
      return;
    }
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        etudiant: form.etudiant,
        module: form.module,
        classe: form.classe || null,
        note_cc: form.note_cc === "" ? null : parseFloat(form.note_cc) || null,
        note_sn: form.note_sn === "" ? null : parseFloat(form.note_sn) || null,
      };
      if (form.id) {
        await notesService.update(form.id, payload);
        setToast({ open: true, message: "Note modifiée", severity: "success" });
      } else {
        await notesService.create(payload);
        setToast({ open: true, message: "Note ajoutée", severity: "success" });
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    let errors = {};
    if (!form.etudiant) errors.etudiant = "Requis";
    if (!form.module) errors.module = "Requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = (note) => {
    setForm({
      id: note.id,
      etudiant: note.etudiant?.id || note.etudiant,
      module: note.module?.id || note.module,
      classe: note.classe?.id || note.classe || "",
      note_cc: note.note_cc || "",
      note_sn: note.note_sn || "",
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (!canWriteGrades) {
      setToast({ open: true, message: "Accès en lecture seule : vous ne pouvez pas supprimer cette note.", severity: "warning" });
      setOpenDelete(false);
      return;
    }
    if (!selectedNote) return;
    try {
      await notesService.remove(selectedNote.id);
      setToast({ open: true, message: "Note supprimée", severity: "success" });
      fetchData();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setOpenDelete(false);
    }
  };

  const fetchReleveNotes = async (etudiantId) => {
    if (!etudiantId) return;
    setReleveLoading(true);
    try {
      const res = await notesService.releveNotes(etudiantId);
      setReleveData(res);
    } catch (err) {
      console.error("Erreur chargement relevé:", err);
      setToast({ open: true, message: "Erreur lors du chargement du relevé", severity: "error" });
      setReleveData(null);
    } finally {
      setReleveLoading(false);
    }
  };

  const handleDownloadTranscript = async () => {
    const element = releveRef.current;
    if (!element) return;
    try {
      // html2canvas doit attendre les fichiers locaux (notamment logoisare)
      // afin de capturer exactement le même en-tête que celui de l'aperçu.
      await Promise.all(
        Array.from(element.querySelectorAll("img")).map((image) => {
          if (image.complete) {
            return image.decode ? image.decode().catch(() => undefined) : undefined;
          }
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        }),
      );
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      // Le gabarit du relevé est une page A4 fixe : on l'insère donc sans
      // recalcul de ratio, qui pouvait agrandir le logo dans le PDF.
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      const studentName = releveData?.etudiant?.nom?.replace(/\s+/g, "_") || "etudiant";
      pdf.save(`releve_notes_${studentName}.pdf`);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      setToast({
        open: true,
        message: "Erreur lors de la génération du PDF",
        severity: "error",
      });
    }
  };

  const activeStudentObj = useMemo(() => {
    return students.find(
      (s) => String(s.id) === String(selectedStudentForTranscript),
    );
  }, [students, selectedStudentForTranscript]);

  const studentTranscriptNotes = useMemo(() => {
    if (!selectedStudentForTranscript) return [];
    return notes.filter((n) => {
      const estId = n.etudiant?.id || n.etudiant || n.etudiant_id;
      return String(estId) === String(selectedStudentForTranscript);
    });
  }, [notes, selectedStudentForTranscript]);

  const generalAverage = useMemo(() => {
    if (!studentTranscriptNotes.length) return 0;
    const total = studentTranscriptNotes.reduce(
      (acc, curr) => acc + parseFloat(curr.note_finale || curr.moyenne || 0),
      0,
    );
    return (total / studentTranscriptNotes.length).toFixed(2);
  }, [studentTranscriptNotes]);

  const transcriptBySemester = useMemo(() => {
    const groups = {
      "Semestre 1": [],
      "Semestre 2": [],
    };

    studentTranscriptNotes.forEach((note) => {
      const semestre = note.module_semestre || note.session || "Semestre 1";
      if (!groups[semestre]) {
        groups[semestre] = [];
      }
      groups[semestre].push(note);
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [studentTranscriptNotes]);

  const semesterAverage = (items) => {
    if (!items.length) return null;
    const total = items.reduce(
      (acc, curr) => acc + parseFloat(curr.note_finale || curr.moyenne || 0),
      0,
    );
    return (total / items.length).toFixed(2);
  };

  if (!canReadGrades) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">
          Vous avez un accès en lecture seule sur ce module. Vous pouvez consulter les données et les exporter, mais pas modifier les notes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={premiumStyles.container} className="grades-page">
      {/* <Box sx={premiumStyles.header} className="no-print">
        <Typography variant="h4" sx={premiumStyles.title}>Gestion des Notes</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {canWriteGrades && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setForm(initialForm); setFormErrors({}); setOpenModal(true); }} sx={{ ...premiumStyles.actionBtn, bgcolor: '#4f46e5' }}>
              Ajouter une Note
            </Button>
          )}
        </Box>
      </Box> */}

      <Box sx={premiumStyles.tabsWrapper} className="no-print">
        <Tabs
          value={tabValue}
          onChange={(e, val) => setTabValue(val)}
          TabIndicatorProps={{
            style: { backgroundColor: "#4f46e5", height: 3 },
          }}
        >
          {/* <Tab icon={<AssignmentIcon />} iconPosition="start" label="Vue Globale" sx={{ textTransform: 'none', fontWeight: 600 }} /> */}
          <Tab
            icon={<GridOnIcon />}
            iconPosition="start"
            label="Saisie par Cours"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Relevés par Étudiant"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<SummarizeIcon />}
            iconPosition="start"
            label="Récapitulatif par Classe"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<AssignmentIcon />}
            iconPosition="start"
            label="Rattrapages"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Card sx={{ ...premiumStyles.card, mb: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              gutterBottom
              sx={{ mb: 3 }}
            >
              Sélection du Cours
            </Typography>
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Classe</InputLabel>
                  <Select
                    value={batchParams.classe}
                    label="Classe"
                    onChange={(e) =>
                      setBatchParams({ ...batchParams, classe: e.target.value })
                    }
                  >
                    {classesList.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Module / Matière</InputLabel>
                  <Select
                    value={batchParams.module}
                    label="Module / Matière"
                    onChange={(e) =>
                      setBatchParams({ ...batchParams, module: e.target.value })
                    }
                    disabled={!batchParams.classe}
                  >
                    {filteredModules.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={fetchBatchData}
                  disabled={
                    !batchParams.classe || !batchParams.module || batchLoading
                  }
                  sx={{ height: 56, borderRadius: "10px", bgcolor: "#4f46e5" }}
                >
                  Charger la Liste
                </Button>
              </Grid>
            </Grid>
          </Card>

          {batchData.length > 0 ? (
            <Card sx={premiumStyles.card}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Saisie des Notes
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportModuleNotes}
                    disabled={!batchData.length}
                    sx={{
                      ...premiumStyles.actionBtn,
                      color: "#334155",
                      borderColor: "#cbd5e1",
                    }}
                  >
                    Exporter par Module
                  </Button>
                  {canWriteGrades && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleBatchSave}
                      disabled={submitting}
                      sx={premiumStyles.actionBtn}
                    >
                      {submitting ? "Enregistrement..." : "Enregistrer tout"}
                    </Button>
                  )}
                  {canWriteGrades && (
                    <Button
                      variant="contained"
                      startIcon={<VerifiedIcon />}
                      onClick={() => handleBatchValidate(true)}
                      disabled={validating || !batchData.length}
                      sx={{ ...premiumStyles.actionBtn, bgcolor: "#16a34a" }}
                    >
                      {validating ? "Validation..." : "Valider les notes"}
                    </Button>
                  )}
                  {canWriteGrades && (
                    <Button
                      variant="outlined"
                      startIcon={<VerifiedUserIcon />}
                      onClick={() => handleBatchValidate(false)}
                      disabled={validating || !batchData.length}
                      sx={{
                        ...premiumStyles.actionBtn,
                        color: "#f59e0b",
                        borderColor: "#fcd34d",
                      }}
                    >
                      Dévalider
                    </Button>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                  bgcolor: "#f8fafc",
                  p: 2,
                  borderRadius: "8px",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Classe
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {
                      classesList.find(
                        (c) => String(c.id) === String(batchParams.classe),
                      )?.nom
                    }
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Module
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {
                      modulesList.find(
                        (m) => String(m.id) === String(batchParams.module),
                      )?.nom
                    }
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Formateur
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="primary">
                    {batchData[0]?.formateur_nom || "Non assigné"}
                  </Typography>
                </Box>
                {batchParams.evaluation && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Évaluation
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {
                        evaluationsList.find(
                          (e) =>
                            String(e.id) === String(batchParams.evaluation),
                        )?.libelle
                      }
                    </Typography>
                  </Box>
                )}
              </Box>

              <Alert
                severity="info"
                sx={{ mb: 2, borderRadius: "8px" }}
                icon={<VerifiedIcon fontSize="small" />}
              >
                Les notes enregistrées sont masquées aux étudiants jusqu&apos;à leur
                validation. Cliquez sur &quot;Valider les notes&quot; pour les
                publier sur le portail étudiant.
              </Alert>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={premiumStyles.tableHeadCell}>
                        Matricule
                      </TableCell>
                      <TableCell sx={premiumStyles.tableHeadCell}>
                        Nom Complet
                      </TableCell>
                      <TableCell sx={premiumStyles.tableHeadCell} width={150}>
                        Note CC / {gradeParams?.pourcentage_cc ?? 30}
                      </TableCell>
                      <TableCell sx={premiumStyles.tableHeadCell} width={150}>
                        Note SN / {gradeParams?.pourcentage_sn ?? 70}
                      </TableCell>
                      <TableCell sx={premiumStyles.tableHeadCell}>
                        Note Finale 
                      </TableCell>
                      <TableCell sx={premiumStyles.tableHeadCell}>
                        Statut
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchData.map((row, index) => (
                      <TableRow key={row.etudiant_id} hover>
                        <TableCell sx={premiumStyles.tableCell}>
                          {row.etudiant_matricule}
                        </TableCell>
                        <TableCell
                          sx={{ ...premiumStyles.tableCell, fontWeight: 600 }}
                        >
                          {row.etudiant_nom}
                        </TableCell>
                        <TableCell sx={premiumStyles.tableCell}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.note_cc}
                            onChange={(e) =>
                              handleBatchInputChange(
                                index,
                                "note_cc",
                                e.target.value,
                              )
                            }
                            inputProps={{ min: 0, max: gradeParams?.pourcentage_cc ?? 30, step: 0.25 }}
                            sx={premiumStyles.input}
                          />
                        </TableCell>
                        <TableCell sx={premiumStyles.tableCell}>
                          <TextField
                            size="small"
                            type="number"
                            value={row.note_sn}
                            onChange={(e) =>
                              handleBatchInputChange(
                                index,
                                "note_sn",
                                e.target.value,
                              )
                            }
                            inputProps={{ min: 0, max: gradeParams?.pourcentage_sn ?? 70, step: 0.25 }}
                            sx={premiumStyles.input}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            ...premiumStyles.tableCell,
                            fontWeight: 700,
                            color: "#10b981",
                          }}
                        >
                          {row.note_finale || "__"} / 100
                        </TableCell>
                        <TableCell sx={premiumStyles.tableCell}>
                          <Chip
                            size="small"
                            label={row.validee ? "Validée" : "En attente"}
                            color={row.validee ? "success" : "warning"}
                            variant={row.validee ? "filled" : "outlined"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ) : batchLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : (
            <Box sx={{ py: 10, textAlign: "center", color: "#94a3b8" }}>
              <AssignmentIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6">
                Sélectionnez une classe et un module pour commencer la saisie.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Card sx={premiumStyles.card}>
          <Box className="no-print" sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Génération du Relevé de Notes
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filière</InputLabel>
                  <Select
                    value={transcriptFiliere}
                    label="Filière"
                    onChange={(e) => {
                      setTranscriptFiliere(e.target.value);
                      setTranscriptCycle("");
                      setTranscriptClasse("");
                      setSelectedStudentForTranscript("");
                      setReleveData(null);
                    }}
                  >
                    <MenuItem value="">
                      <em>Toutes</em>
                    </MenuItem>
                    {filieresList.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small" disabled={!transcriptFiliere}>
                  <InputLabel>Cycle</InputLabel>
                  <Select
                    value={transcriptCycle}
                    label="Cycle"
                    onChange={(e) => {
                      setTranscriptCycle(e.target.value);
                      setTranscriptClasse("");
                      setSelectedStudentForTranscript("");
                      setReleveData(null);
                    }}
                  >
                    <MenuItem value="">
                      <em>Sélectionner</em>
                    </MenuItem>
                    {filteredCyclesForTranscript.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small" disabled={!transcriptCycle}>
                  <InputLabel>Classe</InputLabel>
                  <Select
                    value={transcriptClasse}
                    label="Classe"
                    onChange={(e) => {
                      setTranscriptClasse(e.target.value);
                      setSelectedStudentForTranscript("");
                      setReleveData(null);
                    }}
                  >
                    <MenuItem value="">
                      <em>Sélectionner</em>
                    </MenuItem>
                    {filteredClassesForTranscript.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small" disabled={!transcriptClasse}>
                  <InputLabel>Étudiant</InputLabel>
                  <Select
                    value={selectedStudentForTranscript}
                    label="Étudiant"
                    onChange={(e) => {
                      setSelectedStudentForTranscript(e.target.value);
                      setReleveData(null);
                    }}
                  >
                    <MenuItem value="">
                      <em>Sélectionner</em>
                    </MenuItem>
                    {filteredStudentsForTranscript.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nom} {s.prenom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {selectedStudentForTranscript && (
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchReleveNotes(selectedStudentForTranscript)}
                  disabled={releveLoading}
                >
                  {releveLoading ? "Chargement..." : "Générer le Relevé"}
                </Button>
                {releveData && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTranscript}
                    sx={{ bgcolor: "#4f46e5" }}
                  >
                    Télécharger PDF
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {releveLoading ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Chargement du relevé...</Typography>
            </Box>
          ) : releveData ? (
            <Box sx={{ overflow: "auto" }}>
              <ReleveNotesTemplate ref={releveRef} data={releveData} />
            </Box>
          ) : selectedStudentForTranscript ? (
            <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
              <AssignmentIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6">
                Cliquez sur &quot;Générer le Relevé&quot; pour afficher le relevé de notes.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
              <PersonIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6">
                Veuillez sélectionner un étudiant pour afficher son relevé.
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {tabValue === 2 &&
        (() => {
          // --- Filtres cascade pour le récapitulatif ---
          const recapFilieres = filieresList;
          const recapCycles = transcriptFiliere
            ? cyclesList.filter(
                (c) => String(c.filiere) === String(transcriptFiliere),
              )
            : [];
          const recapClasses = transcriptCycle
            ? classesList.filter(
                (c) => String(c.cycle) === String(transcriptCycle),
              )
            : [];

          // Étudiants inscrits dans la classe sélectionnée
          const classStudents = transcriptClasse
            ? students
                .filter(
                  (s) =>
                    s.inscriptions &&
                    s.inscriptions.some(
                      (ins) => String(ins.classe) === String(transcriptClasse),
                    ),
                )
                .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
            : [];

          // Modules rattachés à cette classe (via M2M direct + CourseAssignment)
          const selectedClasseObj = classesList.find(
            (c) => String(c.id) === String(transcriptClasse),
          );
          const directModuleIds = new Set(
            (selectedClasseObj?.modules || []).map((m) =>
              typeof m === "object" ? m.id : m,
            ),
          );
          const classeFiliere = selectedClasseObj?.filiere;
          const classeNiveau = selectedClasseObj?.niveau;
          const classModules = modulesList.filter((m) => {
            if (directModuleIds.has(m.id)) return true;
            if (m.attributions) {
              return m.attributions.some(
                (att) =>
                  String(att.classe_id) === String(transcriptClasse) ||
                  (String(att.filiere_id || "") === String(classeFiliere) &&
                    String(att.niveau_id || "") === String(classeNiveau)),
              );
            }
            return false;
          });

          // Notes de la classe
          const classNotes = transcriptClasse
            ? notes.filter(
                (n) =>
                  String(n.classe || n.classe_id) === String(transcriptClasse),
              )
            : [];

          // Construire la matrice étudiant → module → note
          const getNote = (studentId, moduleId) => {
            return classNotes.find(
              (n) =>
                String(n.etudiant?.id || n.etudiant || n.etudiant_id) ===
                  String(studentId) &&
                String(n.module?.id || n.module || n.module_id) ===
                  String(moduleId),
            );
          };

          const getStudentAverage = (studentId) => {
            const studentNotes = classNotes.filter(
              (n) =>
                String(n.etudiant?.id || n.etudiant || n.etudiant_id) ===
                  String(studentId) && n.note_finale != null,
            );
            if (studentNotes.length === 0) return null;
            const total = studentNotes.reduce(
              (acc, n) => acc + parseFloat(n.note_finale || 0),
              0,
            );
            return (total / studentNotes.length).toFixed(2);
          };

          const getMention = (avg) => {
            if (avg === null) return "--";
            const v = parseFloat(avg);
            if (v < 50) return "Échec";
            if (v < 60) return "Passable";
            if (v < 70) return "Assez Bien";
            if (v < 80) return "Bien";
            return "Très Bien";
          };

          const getMentionColor = (avg) => {
            if (avg === null) return "#94a3b8";
            const v = parseFloat(avg);
            if (v < 50) return "#ef4444";
            if (v < 60) return "#f59e0b";
            if (v < 70) return "#3b82f6";
            if (v < 80) return "#10b981";
            return "#8b5cf6";
          };

          // Classement
          const rankedStudents = classStudents
            .map((s) => ({
              ...s,
              avg: getStudentAverage(s.id),
            }))
            .sort((a, b) => {
              if (a.avg === null && b.avg === null) return 0;
              if (a.avg === null) return 1;
              if (b.avg === null) return -1;
              return parseFloat(b.avg) - parseFloat(a.avg);
            });

          return (
            <Box>
              <Card sx={{ ...premiumStyles.card, mb: 3 }} className="no-print">
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Sélection de la classe
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Filière</InputLabel>
                      <Select
                        value={transcriptFiliere}
                        label="Filière"
                        onChange={(e) => {
                          setTranscriptFiliere(e.target.value);
                          setTranscriptCycle("");
                          setTranscriptClasse("");
                        }}
                      >
                        <MenuItem value="">
                          <em>Sélectionner</em>
                        </MenuItem>
                        {recapFilieres.map((f) => (
                          <MenuItem key={f.id} value={f.id}>
                            {f.nom}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      size="small"
                      disabled={!transcriptFiliere}
                    >
                      <InputLabel>Cycle</InputLabel>
                      <Select
                        value={transcriptCycle}
                        label="Cycle"
                        onChange={(e) => {
                          setTranscriptCycle(e.target.value);
                          setTranscriptClasse("");
                        }}
                      >
                        <MenuItem value="">
                          <em>Sélectionner</em>
                        </MenuItem>
                        {recapCycles.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.nom}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      size="small"
                      disabled={!transcriptCycle}
                    >
                      <InputLabel>Classe</InputLabel>
                      <Select
                        value={transcriptClasse}
                        label="Classe"
                        onChange={(e) => setTranscriptClasse(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Sélectionner</em>
                        </MenuItem>
                        {recapClasses.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.nom}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {transcriptClasse && classStudents.length > 0 && (
                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={async () => {
                        const element = document.getElementById(
                          "printable-class-recap",
                        );
                        if (!element) return;
                        try {
                          const canvas = await html2canvas(element, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: "#ffffff",
                          });
                          const imgData = canvas.toDataURL("image/png");
                          const pdf = new jsPDF("l", "mm", "a4");
                          const pdfWidth = pdf.internal.pageSize.getWidth();
                          const pdfHeight =
                            (canvas.height * pdfWidth) / canvas.width;
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          let position = 0;
                          if (pdfHeight <= pageHeight) {
                            pdf.addImage(
                              imgData,
                              "PNG",
                              0,
                              0,
                              pdfWidth,
                              pdfHeight,
                            );
                          } else {
                            while (position < pdfHeight) {
                              pdf.addImage(
                                imgData,
                                "PNG",
                                0,
                                -position,
                                pdfWidth,
                                pdfHeight,
                              );
                              position += pageHeight;
                              if (position < pdfHeight) pdf.addPage();
                            }
                          }
                          const classeName = (
                            selectedClasseObj?.nom || "classe"
                          ).replace(/\s+/g, "_");
                          pdf.save(`recapitulatif_notes_${classeName}.pdf`);
                        } catch (err) {
                          console.error("Erreur génération PDF:", err);
                          setToast({
                            open: true,
                            message: "Erreur lors de la génération du PDF",
                            severity: "error",
                          });
                        }
                      }}
                      sx={{
                        bgcolor: "#4f46e5",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Télécharger le Récapitulatif (PDF)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      sx={{ ml: 1, textTransform: "none" }}
                      onClick={async () => {
                        if (!transcriptClasse) {
                          setToast({
                            open: true,
                            message: "Sélectionnez une classe avant d'exporter",
                            severity: "warning",
                          });
                          return;
                        }
                        try {
                          const data = await notesService.list({
                            classe: transcriptClasse,
                          });
                          const items = Array.isArray(data)
                            ? data
                            : data?.results || data?.data || [];
                          const cfg = getEntityImportConfig("notes");
                          const lookupData = {};
                          const workbook = buildExportWorkbook(
                            "notes",
                            items,
                            cfg,
                            lookupData,
                          );
                          const classeName = (
                            selectedClasseObj?.nom || transcriptClasse
                          ).replace(/\s+/g, "_");
                          downloadXlsxWorkbook(
                            workbook,
                            `notes_classe_${classeName}.xlsx`,
                          );
                        } catch (err) {
                          console.error(err);
                          setToast({
                            open: true,
                            message: "Erreur lors de l'export des notes",
                            severity: "error",
                          });
                        }
                      }}
                    >
                      Exporter (Excel)
                    </Button>
                  </Box>
                )}
              </Card>

              {transcriptClasse ? (
                classStudents.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
                    <SummarizeIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                    <Typography variant="h6">
                      Aucun étudiant inscrit dans cette classe.
                    </Typography>
                  </Box>
                ) : (
                  <Card sx={premiumStyles.card} id="printable-class-recap">
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                      <Typography variant="h5" fontWeight={800} gutterBottom>
                        Récapitulatif des Notes
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {selectedClasseObj?.nom || "Classe"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Généré le {new Date().toLocaleDateString("fr-FR")} —{" "}
                        {classStudents.length} étudiant(s) —{" "}
                        {classModules.length} module(s)
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <TableContainer sx={{ maxHeight: 600 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                position: "sticky",
                                left: 0,
                                zIndex: 3,
                                bgcolor: "#f1f5f9",
                                minWidth: 40,
                              }}
                            >
                              #
                            </TableCell>
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                position: "sticky",
                                left: 40,
                                zIndex: 3,
                                bgcolor: "#f1f5f9",
                                minWidth: 80,
                              }}
                            >
                              Matricule
                            </TableCell>
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                position: "sticky",
                                left: 120,
                                zIndex: 3,
                                bgcolor: "#f1f5f9",
                                minWidth: 160,
                              }}
                            >
                              Nom
                            </TableCell>
                            {classModules.map((m) => (
                              <TableCell
                                key={m.id}
                                sx={{
                                  ...premiumStyles.tableHeadCell,
                                  minWidth: 80,
                                  textAlign: "center",
                                }}
                              >
                                <Tooltip title={m.nom} arrow>
                                  <span>
                                    {(m.nom || "").length > 12
                                      ? (m.nom || "").substring(0, 12) + "…"
                                      : m.nom}
                                  </span>
                                </Tooltip>
                              </TableCell>
                            ))}
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                minWidth: 80,
                                textAlign: "center",
                                bgcolor: "#e0f2fe",
                              }}
                            >
                              Moyenne
                            </TableCell>
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                minWidth: 80,
                                textAlign: "center",
                                bgcolor: "#e0f2fe",
                              }}
                            >
                              Rang
                            </TableCell>
                            <TableCell
                              sx={{
                                ...premiumStyles.tableHeadCell,
                                minWidth: 90,
                                textAlign: "center",
                                bgcolor: "#e0f2fe",
                              }}
                            >
                              Mention
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rankedStudents.map((student, idx) => {
                            const avg = student.avg;
                            const mention = getMention(avg);
                            return (
                              <TableRow
                                key={student.id}
                                hover
                                sx={
                                  avg !== null && parseFloat(avg) < 50
                                    ? { bgcolor: "#fef2f2" }
                                    : {}
                                }
                              >
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    position: "sticky",
                                    left: 0,
                                    bgcolor: "white",
                                    zIndex: 1,
                                    fontWeight: 600,
                                  }}
                                >
                                  {idx + 1}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    position: "sticky",
                                    left: 40,
                                    bgcolor: "white",
                                    zIndex: 1,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {student.matricule || "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    position: "sticky",
                                    left: 120,
                                    bgcolor: "white",
                                    zIndex: 1,
                                    fontWeight: 600,
                                  }}
                                >
                                  {student.nom || "-"}
                                </TableCell>
                                {classModules.map((m) => {
                                  const noteObj = getNote(student.id, m.id);
                                  const nf = noteObj?.note_finale;
                                  return (
                                    <TableCell
                                      key={m.id}
                                      sx={{
                                        ...premiumStyles.tableCell,
                                        textAlign: "center",
                                        fontWeight: 500,
                                        color:
                                          nf != null && parseFloat(nf) < 50
                                            ? "#ef4444"
                                            : "#334155",
                                      }}
                                    >
                                      {nf != null
                                        ? parseFloat(nf).toFixed(2)
                                        : "-"}
                                    </TableCell>
                                  );
                                })}
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    textAlign: "center",
                                    fontWeight: 800,
                                    fontSize: "0.95rem",
                                    color: getMentionColor(avg),
                                  }}
                                >
                                  {avg !== null ? avg : "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    textAlign: "center",
                                    fontWeight: 700,
                                  }}
                                >
                                  {avg !== null
                                    ? `${idx + 1}/${rankedStudents.filter((s) => s.avg !== null).length}`
                                    : "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    ...premiumStyles.tableCell,
                                    textAlign: "center",
                                    fontWeight: 600,
                                    color: getMentionColor(avg),
                                  }}
                                >
                                  {mention}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Statistiques de classe */}
                    {(() => {
                      const avgs = rankedStudents
                        .map((s) => s.avg)
                        .filter((a) => a !== null)
                        .map((a) => parseFloat(a));
                      if (avgs.length === 0) return null;
                      const classAvg = (
                        avgs.reduce((a, b) => a + b, 0) / avgs.length
                      ).toFixed(2);
                      const maxAvg = Math.max(...avgs).toFixed(2);
                      const minAvg = Math.min(...avgs).toFixed(2);
                      const successCount = avgs.filter((a) => a >= 50).length;
                      const successRate = (
                        (successCount / avgs.length) *
                        100
                      ).toFixed(1);

                      return (
                        <Grid container spacing={2} sx={{ mt: 3 }}>
                          <Grid item xs={6} md={3}>
                            <Card
                              sx={{
                                p: 2,
                                bgcolor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "12px",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Moyenne de classe
                              </Typography>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#10b981"
                              >
                                {classAvg}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Card
                              sx={{
                                p: 2,
                                bgcolor: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "12px",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Meilleure moyenne
                              </Typography>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#3b82f6"
                              >
                                {maxAvg}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Card
                              sx={{
                                p: 2,
                                bgcolor: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "12px",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Plus basse moyenne
                              </Typography>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#ef4444"
                              >
                                {minAvg}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Card
                              sx={{
                                p: 2,
                                bgcolor: "#faf5ff",
                                border: "1px solid #e9d5ff",
                                borderRadius: "12px",
                                textAlign: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Taux de réussite
                              </Typography>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#8b5cf6"
                              >
                                {successRate}%
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      );
                    })()}
                  </Card>
                )
              ) : (
                <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
                  <SummarizeIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                  <Typography variant="h6">
                    Sélectionnez une classe pour afficher le récapitulatif des
                    notes.
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })()}

      {tabValue === 3 && (
        <Card sx={premiumStyles.card}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Étudiants en rattrapage</Typography>
              <Typography variant="body2" color="text.secondary">
                Toute note finale strictement inférieure à 50 / 100 requiert un rattrapage.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadRattrapagesPdf} disabled={!rattrapages.length} sx={{ ...premiumStyles.actionBtn, bgcolor: "#4f46e5" }}>
              Télécharger le PDF
            </Button>
          </Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Classe</InputLabel>
                <Select value={rattrapageClasse} label="Classe" onChange={(e) => setRattrapageClasse(e.target.value)}>
                  <MenuItem value=""><em>Toutes les classes</em></MenuItem>
                  {classesList.map((classe) => <MenuItem key={classe.id} value={classe.id}>{classe.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Semestre</InputLabel>
                <Select value={rattrapageSession} label="Semestre" onChange={(e) => setRattrapageSession(e.target.value)}>
                  <MenuItem value=""><em>Tous les semestres</em></MenuItem>
                  <MenuItem value="Semestre 1">Semestre 1</MenuItem>
                  <MenuItem value="Semestre 2">Semestre 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {rattrapageLoading ? <TableSkeleton rows={5} columns={6} /> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={premiumStyles.tableHeadCell}>Étudiant</TableCell>
                  <TableCell sx={premiumStyles.tableHeadCell}>Matricule</TableCell>
                  <TableCell sx={premiumStyles.tableHeadCell}>Classe</TableCell>
                  <TableCell sx={premiumStyles.tableHeadCell}>Salle</TableCell>
                  <TableCell sx={premiumStyles.tableHeadCell}>Module à rattraper</TableCell>
                  <TableCell sx={premiumStyles.tableHeadCell}>Note / 100</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {rattrapages.map((row) => <TableRow key={row.note_id} hover>
                    <TableCell sx={premiumStyles.tableCell}>{row.etudiant_nom}</TableCell>
                    <TableCell sx={premiumStyles.tableCell}>{row.etudiant_matricule || "-"}</TableCell>
                    <TableCell sx={premiumStyles.tableCell}>{row.classe_nom}</TableCell>
                    <TableCell sx={premiumStyles.tableCell}>{row.salle_nom || "Non planifiée"}</TableCell>
                    <TableCell sx={premiumStyles.tableCell}>{row.module_nom}</TableCell>
                    <TableCell sx={{ ...premiumStyles.tableCell, color: "#dc2626", fontWeight: 700 }}>{Number(row.note_finale).toFixed(2)}</TableCell>
                  </TableRow>)}
                  {!rattrapages.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>Aucun étudiant ne correspond aux filtres sélectionnés.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {openModal && (
        <GradeFormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSave={handleSave}
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          submitting={submitting}
          students={students}
          modules={modulesList}
        />
      )}

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Supprimer cette note définitivement ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          #printable-transcript, #printable-transcript * { visibility: visible; }
          #printable-transcript { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          #printable-class-recap, #printable-class-recap * { visibility: visible; }
          #printable-class-recap { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          .MuiCard-root { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </Box>
  );
}
