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
  Skeleton,
} from "@mui/material";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { styled } from "@mui/material/styles";
import BadgeIcon from "@mui/icons-material/Badge";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SchoolIcon from "@mui/icons-material/School";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import {
  etudiantsService,
  filieresV2Service,
  levelsV2Service,
  classesService,
  facultesService,
  inscriptionsV2Service,
  paiementsService,
  paiementAlertsService,
  paiementPlansService,
  studentScheduleService,
} from "../../../services/api/services";
import { getApiErrorMessage, getMediaUrl } from "../../../services/api/client";
import { ConfigContext } from "../../../theme/ThemeRegistry";
import CertificateScolariteTemplate from "../../../components/certificates/CertificateScolariteTemplate";
import * as XLSX from "xlsx";

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function FileUploadButton({ label, onChange, multiple, files }) {
  const fileArray = files ? (files.length ? Array.from(files) : [files]) : [];
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Button
        component="label"
        variant="outlined"
        color="primary"
        fullWidth
        startIcon={<CloudUploadIcon />}
        sx={{
          borderRadius: 2,
          padding: "10px",
          textTransform: "none",
          borderStyle: "dashed",
          borderWidth: 2,
          justifyContent: "flex-start",
          color: "text.secondary",
          bgcolor: "rgba(25, 58, 127, 0.02)",
          "&:hover": {
            borderStyle: "dashed",
            borderWidth: 2,
            bgcolor: "rgba(25, 58, 127, 0.05)",
          },
        }}
      >
        {fileArray.length > 0
          ? `${fileArray.length} fichier(s)`
          : "Parcourir..."}
        <VisuallyHiddenInput
          type="file"
          multiple={multiple}
          onChange={onChange}
        />
      </Button>
      {fileArray.map(
        (f, i) =>
          f && (
            <Typography
              key={i}
              variant="caption"
              sx={{
                display: "flex",
                alignItems: "center",
                mt: 0.5,
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <AttachFileIcon sx={{ fontSize: 14, mr: 0.5 }} /> {f.name}
            </Typography>
          ),
      )}
    </Box>
  );
}

function normalizeDateForApi(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const stringValue = String(value).trim();
  if (!stringValue) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }
  const slashMatch = stringValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime())
    ? stringValue
    : parsed.toISOString().slice(0, 10);
}

function paymentDateFieldProps() {
  return {
    type: "text",
    placeholder: "YYYY-MM-DD",
    inputProps: { inputMode: "numeric", maxLength: 10 },
    helperText: "Format attendu: YYYY-MM-DD",
  };
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
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
  matricule: "",
  nom: "",
  date_naissance: "",
  contact: "",
  indicatif: "+241",
  email: "",
  nom_parent: "",
  whatsapp_parent: "",
  filiere: "",
  niveau: "",
  classe: "",
};
const initialPaymentPlanForm = {
  mode: "FOUR_INSTALLMENTS",
  monthly_start_date: "",
  monthly_due_day: 28,
};

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("Tous");
  const [classFilter, setClassFilter] = useState("Tous");
  const [universityFilter, setUniversityFilter] = useState("Tous");
  const [levelFilter, setLevelFilter] = useState("Tous");
  const [students, setStudents] = useState([]);
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
  const [filieres, setFilieres] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const { selectedYear } = useAcademicYear();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [loadingStudentPayments, setLoadingStudentPayments] = useState(false);
  const [studentPaymentPlan, setStudentPaymentPlan] = useState(null);
  const [studentPaymentAlerts, setStudentPaymentAlerts] = useState([]);
  const [loadingStudentPlan, setLoadingStudentPlan] = useState(false);
  const [openPaymentPlanDialog, setOpenPaymentPlanDialog] = useState(false);
  const [paymentPlanForm, setPaymentPlanForm] = useState(
    initialPaymentPlanForm,
  );
  const [submittingPaymentPlan, setSubmittingPaymentPlan] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [files, setFiles] = useState({
    photo: null,
    acte_naissance: null,
    cni: null,
    diplomes: [],
  });

  const [openCardDialog, setOpenCardDialog] = useState(false);
  const [cardStudent, setCardStudent] = useState(null);

  const [openCertDialog, setOpenCertDialog] = useState(false);
  const [certStudent, setCertStudent] = useState(null);

  const config = React.useContext(ConfigContext);
  const schoolName = config?.nom || "IFPT SMART CAMPUS";
  const logoUrl = getMediaUrl(config?.logo_entete || config?.logo) || "/LOGO SMART CAMPUS.svg";
  const directeurTitre = config?.titre_directeur || "Le Directeur Général";
  const directeurNom = config?.nom_directeur || "";
  const signatureUrl = getMediaUrl(config?.signature_directeur);
  const schoolVille = config?.ville || "Douala";
  const schoolTel = config?.telephone || "(+237) 6xx xxx xxx";
  const schoolEmail = config?.email || "contact@smartcampus.com";
  const primaryColor = config?.couleur_primaire || "#193A7F";
  const secondaryColor = config?.couleur_secondaire || "#0D1B2A";

  const openCertificate = (student) => {
    setCertStudent(student);
    setOpenCertDialog(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await etudiantsService.list();
      setStudents(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(
          error,
          "Chargement des étudiants impossible.",
        ),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicData = async () => {
    try {
      const [fils, lvls, clss, facs] = await Promise.all([
        filieresV2Service.list(),
        levelsV2Service.list(),
        classesService.list(),
        facultesService.list(),
      ]);
      setFilieres(toList(fils));
      setLevels(toList(lvls));
      setClasses(toList(clss));
      setFacultes(toList(facs));
    } catch (error) {
      console.error("Erreur données académiques:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchAcademicData();
  }, [selectedYear?.id]);

  useEffect(() => {
    if (!isEditing && form.filiere && filieres.length > 0) {
      const filiereObj = filieres.find((f) => f.id === form.filiere);
      if (filiereObj) {
        const prefix = (filiereObj.nom || "").substring(0, 4).toUpperCase();
        const year = new Date().getFullYear();
        const order = (students.length + 1).toString().padStart(4, "0");
        setForm((prev) => ({
          ...prev,
          matricule: `${prefix}-${year}-${order}`,
        }));
      }
    }
  }, [form.filiere, filieres, isEditing, students.length]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = student.nom || "";

      // Extraction sécurisée des IDs et noms pour le filtrage
      const currentInscription =
        student.inscriptions && student.inscriptions.length > 0
          ? student.inscriptions[0]
          : null;

      const studentFiliereId =
        student.filiere?.id ||
        student.filiere ||
        currentInscription?.filiere?.id ||
        currentInscription?.filiere ||
        currentInscription?.formation_id;
      const studentFiliereNom =
        student.filiere?.nom ||
        student.filiere_nom ||
        currentInscription?.filiere_nom ||
        currentInscription?.filiere?.nom ||
        currentInscription?.formation_nom;

      const studentLevelNom =
        currentInscription?.niveau_nom || currentInscription?.niveau?.nom;
      const studentLevelId =
        currentInscription?.niveau_id ||
        currentInscription?.niveau?.id ||
        currentInscription?.niveau;

      const matchesSearch =
        !searchTerm ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (student.matricule || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filtrage par filière : compare soit l'ID (stringifié), soit le nom de la filière sélectionnée
      const selectedFiliereObj = filieres.find(
        (f) => String(f.id) === String(courseFilter),
      );
      const matchesCourse =
        courseFilter === "Tous" ||
        String(studentFiliereId) === String(courseFilter) ||
        (selectedFiliereObj && studentFiliereNom === selectedFiliereObj.nom) ||
        studentFiliereNom === courseFilter;

      // Filtrage par classe
      const studentClasseId =
        currentInscription?.classe_id ||
        currentInscription?.classe?.id ||
        currentInscription?.classe;
      const studentClasseNom =
        currentInscription?.classe_nom || currentInscription?.classe?.nom;
      const matchesClass =
        classFilter === "Tous" ||
        String(studentClasseId) === String(classFilter) ||
        studentClasseNom === classFilter;

      // Filtrage par université de tutelle (robuste: compare id et nom)
      const studentFiliereObj = filieres.find(
        (f) => String(f.id) === String(studentFiliereId),
      );
      const studentFaculteObj = facultes.find(
        (fac) =>
          String(fac.id) ===
          String(studentFiliereObj?.faculte?.id || studentFiliereObj?.faculte),
      );

      // Collect many possible tutelle sources (student, filiere_details, filiere, faculte, inscription)
      const possibleTutelles = [];
      const pushIf = (v) => {
        if (v === null || v === undefined) return;
        possibleTutelles.push(v);
      };

      pushIf(student.universite_tutelle);
      pushIf(student.universite_tutelle_nom);
      // filiere_details (some responses use this key)
      pushIf(student.filiere_details?.universite_tutelle);
      pushIf(student.filiere_details?.universite_tutelle_nom);
      // filiere object returned in student or via lookup
      pushIf(studentFiliereObj?.universite_tutelle);
      pushIf(studentFiliereObj?.universite_tutelle_nom);
      pushIf(student.filiere?.universite_tutelle);
      pushIf(student.filiere?.universite_tutelle_nom);
      // faculte
      pushIf(studentFaculteObj?.universite_tutelle);
      pushIf(studentFaculteObj?.universite_tutelle_nom);
      // inscription nested fields
      pushIf(currentInscription?.filiere?.universite_tutelle);
      pushIf(currentInscription?.filiere?.universite_tutelle_nom);

      // Normalize values: if object, take .nom or .id; else string
      const norm = (v) => {
        if (v === null || v === undefined) return "";
        if (typeof v === "object")
          return String(v?.nom || v?.universite_tutelle_nom || v?.id || "")
            .trim()
            .toLowerCase();
        return String(v).trim().toLowerCase();
      };

      const filterNorm = norm(universityFilter);
      const matchesUniv =
        universityFilter === "Tous" ||
        possibleTutelles.some((t) => norm(t) === filterNorm);

      // Filtrage par niveau : compare soit l'ID (stringifié), soit le nom
      const matchesLevel =
        levelFilter === "Tous" ||
        String(studentLevelId) === String(levelFilter) ||
        studentLevelNom === levelFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesClass &&
        matchesUniv &&
        matchesLevel
      );
    });
  }, [
    students,
    searchTerm,
    courseFilter,
    classFilter,
    universityFilter,
    levelFilter,
    filieres,
    facultes,
  ]);

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map((student) => ({
      Matricule: student.matricule || "",
      Nom: student.nom || "",
      Email: student.email || "",
      Contact: student.contact || "",
      Filière:
        student.inscriptions && student.inscriptions.length > 0
          ? student.inscriptions[0].filiere_nom ||
            student.inscriptions[0].filiere?.nom
          : "Indéfini",
      Niveau:
        student.inscriptions && student.inscriptions.length > 0
          ? student.inscriptions[0].niveau_nom ||
            student.inscriptions[0].niveau?.nom
          : "Indéfini",
      Classe:
        student.inscriptions && student.inscriptions.length > 0
          ? student.inscriptions[0].classe_nom ||
            student.inscriptions[0].classe?.nom
          : "Non assignée",
      Statut:
        student.inscriptions && student.inscriptions.length > 0
          ? student.inscriptions[0].statut
          : "Inactif",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Etudiants");
    XLSX.writeFile(wb, "Liste_Etudiants_Filtree.xlsx");
  };

  const downloadCardAsPdf = async () => {
    const cardElement = document.getElementById("student-card-preview");
    if (!cardElement) return;
    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "credit-card"); // ~86x54mm
      pdf.addImage(imgData, "PNG", 0, 0, 86, 54);
      pdf.save(
        `Carte_Etudiant_${cardStudent?.matricule || "SansMatricule"}.pdf`,
      );
    } catch (error) {
      console.error("Erreur PDF:", error);
      setToast({
        open: true,
        message: "Erreur lors de la génération du PDF.",
        severity: "error",
      });
    }
  };

  const openStudentCard = (student) => {
    setCardStudent(student);
    setOpenCardDialog(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = "Le nom est requis";
    if (!form.date_naissance.trim())
      errors.date_naissance = "La date naissance est requise";
    if (!form.email.trim()) errors.email = "L'email est requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Email invalide";
    if (!form.contact.trim()) errors.contact = "Le contact est requis";
    else if (!/^[0-9+\s\-]+$/.test(form.contact))
      errors.contact =
        "Caractères non valides (chiffres, + et - acceptés uniquement)";
    if (!form.filiere_details?.id) {
      errors.filiere_details = "La filière est requise";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setFiles({ photo: null, acte_naissance: null, cni: null, diplomes: [] });
    setOpenCreate(true);
  };

  const handleEdit = (student) => {
    setIsEditing(true);
    const latestInscription = student.inscriptions?.[0];
    const { indicatif, numero } = parseContactWithIndicatif(student.contact);
    setForm({
      id: student.id,
      matricule: student.matricule || "",
      nom: student.nom || "",
      date_naissance: student.date_naissance || "",
      contact: numero,
      indicatif: indicatif,
      email: student.email || "",
      nom_parent: student.nom_parent || "",
      whatsapp_parent: student.whatsapp_parent || "",
      filiere_details: student.filiere_details || null,

      inscriptions: [
        {
          niveau: latestInscription?.niveau || "",
          classe: latestInscription?.classe || "",
        },
      ],
      documents_existants: student.documents || [],
    });
    setFiles({ photo: null, acte_naissance: null, cni: null, diplomes: [] });
    setOpenCreate(true);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await etudiantsService.remove(studentToDelete.id);
      setToast({
        open: true,
        message: "Étudiant supprimé avec succès.",
        severity: "success",
      });
      fetchStudents();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Suppression impossible."),
        severity: "error",
      });
    } finally {
      setOpenDelete(false);
      setStudentToDelete(null);
    }
  };

  const fetchStudentPayments = async (studentId) => {
    setLoadingStudentPayments(true);
    try {
      const data = await paiementsService.list({ etudiant: studentId });
      setStudentPayments(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      setStudentPayments([]);
      setToast({
        open: true,
        message: getApiErrorMessage(
          error,
          "Chargement de l’historique des paiements impossible.",
        ),
        severity: "error",
      });
    } finally {
      setLoadingStudentPayments(false);
    }
  };

  const fetchStudentPaymentPlan = async (student) => {
    setLoadingStudentPlan(true);
    try {
      const [scheduleData, alertsData] = await Promise.all([
        studentScheduleService.get(student.id),
        paiementAlertsService.list({ etudiant: student.id }),
      ]);
      const alerts = Array.isArray(alertsData)
        ? alertsData
        : alertsData?.results || [];
      setStudentPaymentPlan(scheduleData);
      setStudentPaymentAlerts(alerts);
    } catch (error) {
      setStudentPaymentPlan(null);
      setStudentPaymentAlerts([]);
      setToast({
        open: true,
        message: getApiErrorMessage(
          error,
          "Chargement de l’echeancier impossible.",
        ),
        severity: "error",
      });
    } finally {
      setLoadingStudentPlan(false);
    }
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setOpenDrawer(true);
    fetchStudentPayments(student.id);
    fetchStudentPaymentPlan(student);
  };

  const paymentSummary = useMemo(() => {
    const totalPaid = studentPayments.reduce(
      (sum, payment) => sum + Number(payment.montant_paye || 0),
      0,
    );
    const firstDue = studentPayments.reduce(
      (sum, payment) => sum + Number(payment.montant_du || 0),
      0,
    );
    const latestBalance =
      studentPayments.length > 0
        ? Number(
            studentPayments[studentPayments.length - 1]?.solde_restant || 0,
          )
        : 0;

    return {
      totalPaid,
      totalDue: firstDue,
      latestBalance,
    };
  }, [studentPayments]);

  const handleOpenPaymentPlanDialog = () => {
    if (!selectedStudent) return;
    setPaymentPlanForm({
      tranches: studentPaymentPlan?.source === "personal"
        ? (studentPaymentPlan.installments || []).map(i => ({ label: i.label, montant: String(i.amount_due), date: i.due_date }))
        : [{ label: 'Tranche 1', montant: '', date: '' }, { label: 'Tranche 2', montant: '', date: '' }],
    });
    setOpenPaymentPlanDialog(true);
  };

  const handleSavePaymentPlan = async () => {
    if (!selectedStudent) return;
    setSubmittingPaymentPlan(true);
    try {
      const installments = paymentPlanForm.tranches
        .filter(t => Number(t.montant) > 0 && t.date)
        .map((t, i) => ({ order: i + 1, label: t.label, due_date: t.date, amount_due: t.montant }));
      const total_amount = installments.reduce((s, i) => s + Number(i.amount_due), 0);
      await studentScheduleService.createOverride(selectedStudent.id, { installments, total_amount });
      await fetchStudentPaymentPlan(selectedStudent);
      setOpenPaymentPlanDialog(false);
      setToast({ open: true, message: "Echeancier personnalise enregistre.", severity: "success" });
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Enregistrement de l'echeancier impossible."),
        severity: "error",
      });
    } finally {
      setSubmittingPaymentPlan(false);
    }
  };

  const handleRevertToGlobal = async () => {
    if (!selectedStudent) return;
    setLoadingStudentPlan(true);
    try {
      await studentScheduleService.deleteOverride(selectedStudent.id);
      await fetchStudentPaymentPlan(selectedStudent);
      setToast({ open: true, message: "Revenu a l'echeancier global.", severity: "success" });
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Impossible de revenir au global."),
        severity: "error",
      });
    } finally {
      setLoadingStudentPlan(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      // L'API attend "filiere_id" et non "filiere"
      const fullContact = `${form.indicatif} ${form.contact}`.trim();
      const payload = {
        ...form,
        contact: fullContact,
        filiere_id: form.filiere_details?.id,
      };
      delete payload.filiere;
      delete payload.indicatif;

      let studentId = form.id;
      if (isEditing) {
        await etudiantsService.update(payload.id, payload);
      } else {
        const response = await etudiantsService.create(payload);
        studentId = response?.id || response?.results?.id;

        // Création de l'inscription si une classe est sélectionnée
        if (studentId && form.classe) {
          try {
            await inscriptionsV2Service.create({
              etudiant: studentId,
              classe: form.classe,
              niveau: form.niveau,
            });
          } catch (e) {
            console.error("Erreur lors de la création de l'inscription:", e);
          }
        }
      }

      // Upload des documents s'il y en a et qu'un ID existe
      if (studentId) {
        const uploadPromises = [];
        const processUpload = (file, type) => {
          if (!file) return;
          const formData = new FormData();
          formData.append("fichier", file);
          formData.append("type_document", type);
          formData.append("etudiant", studentId);
          uploadPromises.push(
            etudiantsService.uploadDocument(studentId, formData),
          );
        };

        processUpload(files.photo, "Photo");
        processUpload(files.acte_naissance, "Acte de Naissance");
        processUpload(files.cni, "CNI");

        if (files.diplomes && files.diplomes.length > 0) {
          Array.from(files.diplomes).forEach((doc) => {
            processUpload(doc, "Diplôme");
          });
        }

        if (uploadPromises.length > 0) {
          await Promise.allSettled(uploadPromises);
        }
      }

      setToast({
        open: true,
        message: isEditing
          ? "Étudiant mis à jour avec succès."
          : "Étudiant et documents ajoutés.",
        severity: "success",
      });
      setOpenCreate(false);
      setForm(initialForm);
      setFiles({ photo: null, acte_naissance: null, cni: null, diplomes: [] });
      fetchStudents();
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
    // Empêche la saisie de caractères alphabétiques (seulement des +, -, espaces et chiffres)
    const val = e.target.value;
    if (val === "" || /^[0-9+\s\-]+$/.test(val)) {
      setForm((prev) => ({ ...prev, contact: val }));
    }
  };
  const universities = useMemo(() => {
    // Collecte des universités de tutelle depuis les filières
    const unisFromFilieres = filieres.map((f) => {
      const ut = f.universite_tutelle || f.universite_tutelle_nom;
      return typeof ut === "object" ? ut?.nom : ut;
    });

    // Collecte des universités de tutelle depuis les facultés
    const unisFromFacultes = facultes
      .map((fac) => fac.universite_tutelle || fac.universite)
      .map((ut) => (typeof ut === "object" ? ut?.nom : ut));

    const allUnis = [...unisFromFilieres, ...unisFromFacultes].filter(
      (u) => u && String(u).trim() !== "",
    );

    return Array.from(new Set(allUnis)).sort();
  }, [filieres, facultes]);

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
          Liste des étudiants
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2 }}
            onClick={handleExportExcel}
          >
            Exporter (Excel)
          </Button>
          {/* <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
            onClick={handleOpenCreate}
          >
            Ajouter un étudiant
          </Button> */}
        </Box>
      </Box>

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
            sx={{ minWidth: 460 }}
            size="small"
            placeholder="Rechercher un étudiant..."
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon color="action" />
                </InputAdornment>
              }
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Tous">filières</MenuItem>
              {filieres.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon color="action" />
                </InputAdornment>
              }
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Tous">classes</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon color="action" />
                </InputAdornment>
              }
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="Tous">Tutelle</MenuItem>
              {universities.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (!universityFilter || universityFilter === "Tous") {
                setToast({
                  open: true,
                  message: "Sélectionnez une tutelle avant d'exporter.",
                  severity: "warning",
                });
                return;
              }
              const studentsToExport = filteredStudents;
              if (studentsToExport.length === 0) {
                setToast({
                  open: true,
                  message: "Aucun étudiant pour cette tutelle.",
                  severity: "info",
                });
                return;
              }

              const dataToExport = studentsToExport.map((student) => ({
                Matricule: student.matricule || "",
                Nom: student.nom || "",
                Email: student.email || "",
                Contact: student.contact || "",
                Filière:
                  student.inscriptions && student.inscriptions.length > 0
                    ? student.inscriptions[0].filiere_nom ||
                      student.inscriptions[0].filiere?.nom
                    : "Indéfini",
                Niveau:
                  student.inscriptions && student.inscriptions.length > 0
                    ? student.inscriptions[0].niveau_nom ||
                      student.inscriptions[0].niveau?.nom
                    : "Indéfini",
                Classe:
                  student.inscriptions && student.inscriptions.length > 0
                    ? student.inscriptions[0].classe_nom ||
                      student.inscriptions[0].classe?.nom
                    : "Non assignée",
              }));

              const ws = XLSX.utils.json_to_sheet(dataToExport);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Etudiants");
              const safeName = String(universityFilter)
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_\-]/g, "");
              XLSX.writeFile(wb, `Liste_Etudiants_Tutelle_${safeName}.xlsx`);
            }}
            sx={{ height: 40 }}
          >
            Exporter par Tutelle
          </Button>
        </Box>
      </Card>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#F5F7FA" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Matricule</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Nom complet</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Filière</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Classe</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
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
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              filteredStudents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>{student.matricule || "-"}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {student.nom || "-"}
                    </TableCell>
                    <TableCell>
                      {student.contact ? (
                        <a
                          href={`tel:${student.contact.replace(/\s/g, "")}`}
                          style={{
                            textDecoration: "none",
                            color: "#1976d2",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          {student.contact}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{student.email || "-"}</TableCell>
                    <TableCell>
                      {(() => {
                        const currentInscription =
                          student.inscriptions &&
                          student.inscriptions.length > 0
                            ? student.inscriptions[0]
                            : null;
                        return (
                          student.filiere?.nom ||
                          student.filiere_nom ||
                          currentInscription?.filiere_nom ||
                          currentInscription?.filiere?.nom ||
                          currentInscription?.formation_nom ||
                          "-"
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {student.inscriptions && student.inscriptions.length > 0
                        ? student.inscriptions[0].classe_nom || "-"
                        : "-"}
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 250 }}>
                      <IconButton
                        size="small"
                        sx={{ color: "#4f46e5" }}
                        onClick={() => openCertificate(student)}
                        title="Certificat de scolarité"
                      >
                        <SchoolIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => openStudentCard(student)}
                        title="Carte Étudiant"
                      >
                        <BadgeIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(student)}
                        title="Voir détails"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleEdit(student)}
                        title="Modifier"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(student)}
                        title="Supprimer"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
            {!loading && filteredStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  Aucun étudiant trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={filteredStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes par page:"
      />

      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {isEditing ? "Modifier un étudiant" : "Ajouter un étudiant"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Colonne Gauche - Informations */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informations Personnelles
              </Typography>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Matricule"
                disabled
                value={form.matricule}
                helperText="Généré automatiquement"
              />
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
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Date de naissance"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date_naissance}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    date_naissance: e.target.value,
                  }))
                }
                error={Boolean(formErrors.date_naissance)}
                helperText={formErrors.date_naissance}
              />
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
                  label="Numéro de téléphone"
                  value={form.contact}
                  onChange={handlePhoneChange}
                  error={Boolean(formErrors.contact)}
                  helperText={formErrors.contact || "Ex: 07 12 34 56"}
                  placeholder="07 12 34 56"
                />
              </Box>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
              />

              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}
              >
                Informations du Parent / Tuteur
              </Typography>
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="Nom du parent / tuteur"
                value={form.nom_parent}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nom_parent: e.target.value }))
                }
              />
              <TextField
                margin="dense"
                size="small"
                fullWidth
                label="WhatsApp du parent"
                placeholder="Ex: +237 6XX XXX XXX"
                value={form.whatsapp_parent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    whatsapp_parent: e.target.value,
                  }))
                }
              />

              <Typography
                variant="subtitle2"
                color="primary"
                sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}
              >
                Informations Académiques
              </Typography>

              <FormControl
                fullWidth
                size="small"
                margin="dense"
                error={Boolean(formErrors.filiere_details)}
              >
                <Select
                  displayEmpty
                  value={form.filiere_details?.id || ""}
                  onChange={(e) => {
                    const filiere = filieres.find(
                      (f) => Number(f.id) === Number(e.target.value),
                    );

                    setForm((prev) => ({
                      ...prev,
                      filiere_details: filiere || null,
                      inscriptions: [
                        {
                          ...(prev.inscriptions?.[0] || {}),
                          niveau: "",
                          classe: "",
                        },
                      ],
                    }));
                  }}
                >
                  <MenuItem value="" disabled>
                    Sélectionner une filière
                  </MenuItem>

                  {filieres.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.nom}
                    </MenuItem>
                  ))}
                </Select>

                {formErrors.filiere_details && (
                  <Typography variant="caption" color="error">
                    {formErrors.filiere_details}
                  </Typography>
                )}
              </FormControl>

              <FormControl
                fullWidth
                size="small"
                margin="dense"
                disabled={!form.filiere_details?.id}
              >
                <Select
                  displayEmpty
                  value={form.inscriptions?.[0]?.niveau || ""}
                  onChange={(e) => {
                    const selectedNiveau = Number(e.target.value);

                    const matchingClasse = classes.find(
                      (c) =>
                        Number(c.niveau?.id || c.niveau) === selectedNiveau &&
                        Number(c.filiere?.id || c.filiere) ===
                          Number(form.filiere_details?.id),
                    );

                    setForm((prev) => ({
                      ...prev,
                      inscriptions: [
                        {
                          ...(prev.inscriptions?.[0] || {}),
                          niveau: selectedNiveau,
                          classe: matchingClasse?.id || null,
                        },
                      ],
                    }));
                  }}
                >
                  <MenuItem value="" disabled>
                    Sélectionner un niveau
                  </MenuItem>

                  {levels
                    .filter(
                      (l) =>
                        Number(l.filiere_id) ===
                        Number(form.filiere_details?.id),
                    )
                    .map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.nom}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {form.classe && (
                <Typography
                  variant="caption"
                  color="success.main"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  Classe attribuée automatiquement :{" "}
                  {classes.find((c) => c.id === form.classe)?.nom ||
                    form.classe}
                </Typography>
              )}
            </Grid>

            {/* Colonne Droite - Documents */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Documents à fournir
              </Typography>

              {isEditing && form.documents_existants?.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "rgba(0,0,0,0.03)",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Documents existants :
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {form.documents_existants.map((doc) => (
                      <Chip
                        key={doc.id}
                        label={doc.type_document || "Document"}
                        component="a"
                        href={doc.fichier}
                        target="_blank"
                        clickable
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Les nouveaux fichiers téléchargés ci-dessous seront ajoutés.
                  </Typography>
                </Box>
              )}

              <FileUploadButton
                label="Photo d'identité"
                files={files.photo}
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, photo: e.target.files[0] }))
                }
              />
              <FileUploadButton
                label="Acte de naissance"
                files={files.acte_naissance}
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    acte_naissance: e.target.files[0],
                  }))
                }
              />
              <FileUploadButton
                label="CNI / Passeport"
                files={files.cni}
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, cni: e.target.files[0] }))
                }
              />
              <FileUploadButton
                label="Diplômes précédents (plusieurs possibles)"
                multiple
                files={files.diplomes}
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, diplomes: e.target.files }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer l'étudiant {studentToDelete?.nom} ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Détails de l'étudiant
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {selectedStudent && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Matricule"
                  secondary={selectedStudent.matricule || "-"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Nom complet"
                  secondary={selectedStudent.nom || "-"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Date de naissance"
                  secondary={formatDate(selectedStudent.date_naissance)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Contact"
                  secondary={
                    selectedStudent.contact ? (
                      <a
                        href={`tel:${selectedStudent.contact.replace(/\s/g, "")}`}
                        style={{ textDecoration: "none", color: "#1976d2" }}
                      >
                        {selectedStudent.contact}
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={selectedStudent.email || "-"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Nom du parent"
                  secondary={selectedStudent.nom_parent || "-"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="WhatsApp du parent"
                  secondary={selectedStudent.whatsapp_parent || "-"}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Formation"
                  secondary={
                    selectedStudent.filiere?.intitule ||
                    selectedStudent.filiere ||
                    "-"
                  }
                />
              </ListItem>
              {selectedStudent.inscriptions &&
                selectedStudent.inscriptions.length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Date d'inscription"
                      secondary={formatDate(
                        selectedStudent.inscriptions[0]?.date_inscription,
                      )}
                    />
                  </ListItem>
                )}
              {selectedStudent.documents?.length > 0 ? (
                <ListItem>
                  <ListItemText
                    primary="Documents"
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mt: 1,
                        }}
                      >
                        {selectedStudent.documents.map((doc) => (
                          <Chip
                            key={doc.id}
                            label={doc.type_document}
                            size="small"
                            component="a"
                            href={doc.fichier}
                            target="_blank"
                            clickable
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ) : (
                <ListItem>
                  <ListItemText
                    primary="Documents"
                    secondary="Aucun document"
                  />
                </ListItem>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight="bold"
                sx={{ px: 2 }}
              >
                Accès Portail Étudiant
              </Typography>
              <ListItem>
                <ListItemText
                  primary="Nom d'utilisateur"
                  secondary={
                    selectedStudent.username ||
                    "Généré à la prochaine création..."
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Mot de passe initial"
                  secondary={
                    selectedStudent.initial_password ||
                    "Non disponible ou déjà modifié"
                  }
                />
              </ListItem>
            </List>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Historique des paiements
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Card sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F7F9FC" }}>
                <Typography variant="caption" color="text.secondary">
                  Total verse
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="success.main"
                >
                  {paymentSummary.totalPaid.toLocaleString("fr-FR")} FCFA
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F7F9FC" }}>
                <Typography variant="caption" color="text.secondary">
                  Montant initial
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {paymentSummary.totalDue.toLocaleString("fr-FR")} FCFA
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F7F9FC" }}>
                <Typography variant="caption" color="text.secondary">
                  Solde restant
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color={
                    paymentSummary.latestBalance > 0
                      ? "warning.main"
                      : "success.main"
                  }
                >
                  {paymentSummary.latestBalance.toLocaleString("fr-FR")} FCFA
                </Typography>
              </Card>
            </Grid>
          </Grid>
          {loadingStudentPayments ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : studentPayments.length > 0 ? (
            <List sx={{ p: 0 }}>
              {studentPayments
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.date_paiement) - new Date(a.date_paiement),
                )
                .map((payment) => (
                  <ListItem
                    key={payment.id}
                    sx={{ px: 0, alignItems: "flex-start" }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {payment.paiement_type === "INSCRIPTION"
                              ? "Frais d’inscription"
                              : "Frais de formation"}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="success.main"
                          >
                            {Number(payment.montant_paye || 0).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            FCFA
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            {formatDateTime(payment.date_paiement)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Moyen: {payment.moyen_paiement || "Non precise"}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Solde apres paiement:{" "}
                            {Number(payment.solde_restant || 0).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            FCFA
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucun paiement enregistre pour cet etudiant.
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Echeancier et alertes
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={handleOpenPaymentPlanDialog}
            >
              Configurer
            </Button>
          </Box>
          {loadingStudentPlan ? (
            <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} />
            </Box>
          ) : studentPaymentPlan?.source ? (
            <>
              <Card sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: "#F7F9FC" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip size="small" label={studentPaymentPlan.source === "personal" ? "Personnel" : "Global"} color={studentPaymentPlan.source === "personal" ? "secondary" : "primary"} />
                  {studentPaymentPlan.is_overdue && (
                    <Chip size="small" label={`${Number(studentPaymentPlan.overdue_amount || 0).toLocaleString('fr-FR')} FCFA en retard`} color="error" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Total: {Number(studentPaymentPlan.total_paid || 0).toLocaleString('fr-FR')} / {Number(studentPaymentPlan.total_due || 0).toLocaleString('fr-FR')} FCFA
                </Typography>
                {studentPaymentPlan.source === "personal" && (
                  <Button size="small" color="warning" sx={{ mt: 0.5, p: 0 }} onClick={handleRevertToGlobal}>Revenir au global</Button>
                )}
              </Card>
              <List sx={{ p: 0, mb: 2 }}>
                {(studentPaymentPlan.installments || []).map((installment, idx) => (
                  <ListItem
                    key={idx}
                    sx={{ px: 0, alignItems: "flex-start" }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {installment.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={installment.status}
                            color={
                              installment.status === "OVERDUE"
                                ? "error"
                                : installment.status === "PAID"
                                  ? "success"
                                  : installment.status === "PARTIAL"
                                    ? "warning"
                                    : "default"
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            Echeance: {formatDate(installment.due_date)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Montant: {Number(installment.amount_due || 0).toLocaleString('fr-FR')} FCFA
                          </Typography>
                          <Typography variant="caption" display="block">
                            Paye: {Number(installment.amount_paid || 0).toLocaleString('fr-FR')} FCFA
                          </Typography>
                          {installment.days_overdue > 0 && (
                            <Typography variant="caption" color="error.main" display="block">
                              {installment.days_overdue} jour(s) de retard
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              {studentPaymentAlerts.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Alertes actives
                  </Typography>
                  {studentPaymentAlerts.map((alert) => (
                    <Alert
                      key={alert.installment_id}
                      severity={alert.severity === "high" ? "error" : "warning"}
                      icon={<WarningAmberIcon fontSize="inherit" />}
                      sx={{ mb: 1 }}
                    >
                      <strong>{alert.label}</strong> - {alert.message}
                    </Alert>
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucun echeancier configure pour cet etudiant.
            </Typography>
          )}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button variant="outlined" onClick={() => setOpenDrawer(false)}>
              Fermer
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={openPaymentPlanDialog}
        onClose={() => setOpenPaymentPlanDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Echeancier personnalise</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Definissez les tranches personnalisees pour cet etudiant. Cela remplacera l'echeancier global.
          </Typography>
          {(paymentPlanForm.tranches || []).map((tr, idx) => (
            <Grid container spacing={1} key={idx} sx={{ mb: 1 }} alignItems="center">
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Libelle" value={tr.label} onChange={(e) => { const t = [...paymentPlanForm.tranches]; t[idx] = { ...t[idx], label: e.target.value }; setPaymentPlanForm({ ...paymentPlanForm, tranches: t }); }} />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth size="small" label="Montant" type="number" value={tr.montant} onChange={(e) => { const t = [...paymentPlanForm.tranches]; t[idx] = { ...t[idx], montant: e.target.value }; setPaymentPlanForm({ ...paymentPlanForm, tranches: t }); }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Echeance" type="date" InputLabelProps={{ shrink: true }} value={tr.date} onChange={(e) => { const t = [...paymentPlanForm.tranches]; t[idx] = { ...t[idx], date: e.target.value }; setPaymentPlanForm({ ...paymentPlanForm, tranches: t }); }} />
              </Grid>
              <Grid item xs={1}>
                {paymentPlanForm.tranches.length > 1 && <IconButton size="small" color="error" onClick={() => { const t = paymentPlanForm.tranches.filter((_, i) => i !== idx); setPaymentPlanForm({ ...paymentPlanForm, tranches: t }); }}><DeleteIcon fontSize="small" /></IconButton>}
              </Grid>
            </Grid>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => { const n = (paymentPlanForm.tranches || []).length + 1; setPaymentPlanForm({ ...paymentPlanForm, tranches: [...(paymentPlanForm.tranches || []), { label: `Tranche ${n}`, montant: '', date: '' }] }); }}>Ajouter une tranche</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentPlanDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePaymentPlan}
            disabled={submittingPaymentPlan || !(paymentPlanForm.tranches || []).some(t => Number(t.montant) > 0 && t.date)}
          >
            {submittingPaymentPlan ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Carte Etudiant Dialog */}
      <Dialog
        open={openCardDialog}
        onClose={() => setOpenCardDialog(false)}
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Carte Étudiant</span>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            p: 4,
            bgcolor: "#f0f2f5",
          }}
        >
          {cardStudent && (
            <Box
              id="student-card-preview"
              sx={{
                width: 325, // ~86mm
                height: 204, // ~54mm
                bgcolor: "white",
                borderRadius: 2,
                boxShadow: 3,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "sans-serif",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  bgcolor: primaryColor,
                  color: "white",
                  py: 1,
                  px: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {schoolName.toUpperCase()}
                </Typography>
                <Typography variant="caption" sx={{ letterSpacing: 1 }}>
                  CARTE D'ÉTUDIANT
                </Typography>
              </Box>

              {/* Body */}
              <Box sx={{ p: 2, display: "flex", gap: 2, flex: 1 }}>
                {/* Photo Placeholder */}
                <Box
                  sx={{
                    width: 70,
                    height: 90,
                    bgcolor: "grey.200",
                    borderRadius: 1,
                    border: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {cardStudent.documents &&
                  cardStudent.documents.find(
                    (d) => d.type_document === "Photo",
                  ) ? (
                    <img
                      src={
                        cardStudent.documents.find(
                          (d) => d.type_document === "Photo",
                        ).fichier
                      }
                      alt="Photo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <BadgeIcon sx={{ fontSize: 40, color: "grey.400" }} />
                  )}
                </Box>

                {/* Info */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    flex: 1,
                    pt: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {cardStudent.nom?.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Né(e) le : {formatDate(cardStudent.date_naissance)}{" "}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: "bold",
                        color: "primary.main",
                        mb: 0.5,
                      }}
                    >
                      MATRICULE : {cardStudent.matricule || "N/A"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", lineHeight: 1.2 }}
                    >
                      Formation:{" "}
                      {typeof cardStudent.filiere === "object"
                        ? cardStudent.filiere?.intitule
                        : filieres.find((f) => f.id === cardStudent.filiere)
                            ?.intitule ||
                          cardStudent.filiere ||
                          "-"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", lineHeight: 1.2 }}
                    >
                      Niveau:{" "}
                      {cardStudent.inscriptions &&
                      cardStudent.inscriptions.length > 0
                        ? cardStudent.inscriptions[0].niveau_nom
                        : "-"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", lineHeight: 1.2 }}
                    >
                      Année Ac.:{" "}
                      {cardStudent.inscriptions &&
                      cardStudent.inscriptions.length > 0
                        ? cardStudent.inscriptions[0].annee_academique
                        : "2025/2026"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ bgcolor: "primary.main", height: 8, width: "100%" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCardDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadCardAsPdf}
            color="secondary"
          >
            Télécharger en PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* CERTIFICATE DIALOG */}
      <Dialog
        open={openCertDialog}
        onClose={() => setOpenCertDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Certificat de Scolarité
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintCertificate}
            sx={{
              bgcolor: "#4f46e5",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
            className="no-print-cert"
          >
            Imprimer
          </Button>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            bgcolor: "#f0f2f5",
            py: 4,
          }}
        >
          {certStudent &&
            (() => {
              if (certStudent) {
                const studentInscription = certStudent.inscriptions?.[0] || {};
                const studentFiliere = certStudent.filiere_details?.nom || certStudent.filiere?.nom || filieres.find((f) => f.id === (certStudent.filiere?.id || certStudent.filiere))?.nom || "—";
                return <CertificateScolariteTemplate
                  student={certStudent}
                  inscription={studentInscription}
                  school={{
                    logo: logoUrl,
                    telephone: schoolTel,
                    email: schoolEmail,
                    adresse: config?.adresse,
                    ville: schoolVille,
                    directeurNom,
                    filiere: studentFiliere,
                  }}
                />;
              }
              const inscription = certStudent.inscriptions?.[0];
              const filiereNom =
                certStudent.filiere_details?.nom ||
                certStudent.filiere?.nom ||
                filieres.find(
                  (f) =>
                    f.id === (certStudent.filiere?.id || certStudent.filiere),
                )?.nom ||
                "-";
              const niveauNom = inscription?.niveau_nom || "-";
              const anneeAcad =
                inscription?.annee_academique ||
                inscription?.annee_academique_ref_libelle ||
                "2024-2025";
              const today = new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <Box
                  id="printable-certificate"
                  sx={{
                    width: "210mm",
                    minHeight: "297mm",
                    bgcolor: "white",
                    color: "black",
                    position: "relative",
                    boxSizing: "border-box",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    pb: "40px",
                  }}
                >
                  {/* Header - Same as Releve */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: primaryColor,
                      color: "#fff",
                      px: 4,
                      py: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <img
                        src={logoUrl}
                        alt="Logo"
                        style={{ height: 55, width: 55, objectFit: "contain", borderRadius: 4, background: "#fff", padding: 3 }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: "16px", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                          {schoolName.toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>
                          Excellence - Formation - Développement
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
                        CERTIFICAT DE SCOLARITÉ
                      </Typography>
                      <Box sx={{ bgcolor: secondaryColor, px: 2, py: 0.4, borderRadius: 1, mt: 0.5, display: "inline-block" }}>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#fff" }}>
                          ANNÉE ACADÉMIQUE {anneeAcad}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>
                        {config?.adresse || ""}{schoolVille ? `, ${schoolVille}` : ""}
                      </Typography>
                      <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>
                        Tél: {schoolTel}
                      </Typography>
                      <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>
                        {schoolEmail}
                      </Typography>
                      {config?.site_web && (
                        <Typography sx={{ fontSize: "9px", color: "rgba(255,255,255,0.9)" }}>
                          {config.site_web}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Certificate Number */}
                  <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
                    <Typography sx={{ fontSize: "12px", color: "#666" }}>
                      N° {certStudent.matricule}/SC/{new Date().getFullYear()}
                    </Typography>
                  </Box>

                  {/* Body */}
                  <Box sx={{ px: 6, mt: 4 }}>
                    <Typography sx={{ fontSize: "14px", lineHeight: 2.2, textAlign: "justify" }}>
                      {directeurTitre} de <strong>{schoolName}</strong>, soussigné, certifie que l&apos;étudiant(e) :
                    </Typography>

                    <Box
                      sx={{
                        my: 4,
                        mx: 2,
                        p: 3,
                        borderLeft: `4px solid ${primaryColor}`,
                        bgcolor: "#f8fafc",
                        borderRadius: "0 8px 8px 0",
                      }}
                    >
                      <Box sx={{ display: "flex", mb: 1.5 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, minWidth: 160 }}>Nom & Prénom :</Typography>
                        <Typography sx={{ fontSize: "15px", fontWeight: 800 }}>{certStudent.nom}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", mb: 1.5 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, minWidth: 160 }}>Matricule :</Typography>
                        <Typography sx={{ fontSize: "14px" }}>{certStudent.matricule}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", mb: 1.5 }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, minWidth: 160 }}>Filière :</Typography>
                        <Typography sx={{ fontSize: "14px" }}>{filiereNom}</Typography>
                      </Box>
                      <Box sx={{ display: "flex" }}>
                        <Typography sx={{ fontSize: "13px", fontWeight: 700, minWidth: 160 }}>Niveau :</Typography>
                        <Typography sx={{ fontSize: "14px" }}>{niveauNom}</Typography>
                      </Box>
                    </Box>

                    <Typography sx={{ fontSize: "14px", lineHeight: 2.2, textAlign: "justify" }}>
                      Est régulièrement inscrit(e) au sein de notre établissement pour le compte de l&apos;année académique <strong>{anneeAcad}</strong>.
                    </Typography>

                    <Typography sx={{ fontSize: "14px", lineHeight: 2.2, textAlign: "justify", mt: 2 }}>
                      En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
                    </Typography>
                  </Box>

                  {/* Signature */}
                  <Box sx={{ mt: 8, px: 6, textAlign: "right" }}>
                    <Typography sx={{ fontSize: "13px" }}>
                      Fait à {schoolVille}, le {today}
                    </Typography>
                    <Box sx={{ mt: 4, textAlign: "center", width: 250, ml: "auto" }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700 }}>
                        {directeurTitre}
                      </Typography>
                      <Box sx={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", my: 1 }}>
                        {signatureUrl ? (
                          <img
                            src={signatureUrl}
                            alt="Signature"
                            style={{ maxHeight: "100%", maxWidth: "100%" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <Box sx={{ width: 150, height: 50, borderBottom: "1px solid black" }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: "12px", fontWeight: 600 }}>
                        {directeurNom}
                      </Typography>
                      <Typography sx={{ fontSize: "10px", fontStyle: "italic", color: "#666" }}>
                        (Cachet et Signature)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Footer / Slogan - fixed at bottom */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: primaryColor,
                      py: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#FFD700", fontStyle: "italic" }}>
                      {config?.slogan || "Former aujourd'hui, construire demain."}
                    </Typography>
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
        <DialogActions className="no-print-cert">
          <Button onClick={() => setOpenCertDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .no-print-cert { display: none !important; }
          .MuiDialog-root .MuiDialogTitle-root { display: none !important; }
          .MuiDialog-root .MuiDialogActions-root { display: none !important; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .MuiDialog-paper { box-shadow: none !important; overflow: visible !important; }
        }
      `}</style>
    </Box>
  );
}
