"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Collapse,
  LinearProgress,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Badge,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SendIcon from "@mui/icons-material/Send";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import ImportExportModal from "../../../components/importExport/ImportExportModal";
import CategoryIcon from "@mui/icons-material/Category";
import {
  articlesService,
  exemplairesService,
  mouvementsService,
  inventaireStatsService,
  demandesV2Service,
  demandesStatsService,
  demandeursService,
} from "../../../services/api/services";
import { getApiErrorMessage } from "../../../services/api/client";
import { useUserPermissions } from "../../../utils/permissions";

const CATEGORIES = [
  "Informatique",
  "Mobilier",
  "Électronique",
  "Papeterie",
  "Fourniture",
  "Équipement",
  "Autre",
];
const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "bon", label: "Bon état" },
  { value: "usage", label: "Usagé" },
  { value: "endommage", label: "Endommagé" },
];
const STATUTS_EXEMPLAIRE = [
  { value: "en_stock", label: "En stock", color: "success" },
  { value: "en_utilisation", label: "En utilisation", color: "info" },
  { value: "en_panne", label: "En panne", color: "error" },
  { value: "en_maintenance", label: "En maintenance", color: "warning" },
  { value: "reforme", label: "Réformé", color: "default" },
];
const PRIORITES = [
  { value: "basse", label: "Basse", color: "default" },
  { value: "normale", label: "Normale", color: "primary" },
  { value: "haute", label: "Haute", color: "warning" },
  { value: "urgente", label: "Urgente", color: "error" },
];
const DEMANDE_STEPS = [
  "Brouillon",
  "Soumise",
  "En traitement",
  "Approuvée",
  "Livrée",
];
const DEMANDE_STATUTS = {
  brouillon: { label: "Brouillon", color: "default", step: 0 },
  soumise: { label: "Soumise", color: "info", step: 1 },
  en_cours: { label: "En traitement", color: "warning", step: 2 },
  approuvee: { label: "Approuvée", color: "success", step: 3 },
  livree: { label: "Livrée", color: "success", step: 4 },
  refusee: { label: "Refusée", color: "error", step: -1 },
  annulee: { label: "Annulée", color: "default", step: -1 },
};

export default function InventoryPage() {
  const { canWrite } = useUserPermissions();
  const canWriteLogistique = canWrite('can_manage_logistique');
  const [currentTab, setCurrentTab] = useState(0);
  const [openImportExport, setOpenImportExport] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Articles state
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articlePage, setArticlePage] = useState(0);
  const [articleRowsPerPage, setArticleRowsPerPage] = useState(20);
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [articleExemplaires, setArticleExemplaires] = useState([]);
  const [loadingExemplaires, setLoadingExemplaires] = useState(false);

  // Article form
  const [openArticleForm, setOpenArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    nom: "",
    description: "",
    categorie: "Informatique",
    quantite_initiale: 1,
    seuil_alerte: 5,
    prix_unitaire: 0,
    fournisseur: "",
    condition: "neuf",
    localisation: "",
  });
  const [submittingArticle, setSubmittingArticle] = useState(false);

  // Add stock dialog
  const [openAddStock, setOpenAddStock] = useState(false);
  const [addStockTarget, setAddStockTarget] = useState(null);
  const [addStockForm, setAddStockForm] = useState({
    quantite: 1,
    condition: "neuf",
    localisation: "",
    date_acquisition: "",
  });
  const [submittingStock, setSubmittingStock] = useState(false);

  // Exemplaire actions
  const [openExemplaireAction, setOpenExemplaireAction] = useState(false);
  const [exemplaireAction, setExemplaireAction] = useState({
    type: "",
    exemplaire: null,
    data: {},
  });

  // Exemplaire edit dialog
  const [openEditExemplaire, setOpenEditExemplaire] = useState(false);
  const [editExemplaireForm, setEditExemplaireForm] = useState({
    numero_serie: "",
    notes: "",
  });
  const [editExemplaireTarget, setEditExemplaireTarget] = useState(null);
  const [submittingExemplaire, setSubmittingExemplaire] = useState(false);

  // Demandes state
  const [demandes, setDemandes] = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [demandePage, setDemandePage] = useState(0);
  const [demandeRowsPerPage, setDemandeRowsPerPage] = useState(20);
  const [demandeurs, setDemandeurs] = useState([]);
  const [expandedDemande, setExpandedDemande] = useState(null);

  // Demande form (multi-step)
  const [openDemandeForm, setOpenDemandeForm] = useState(false);
  const [demandeStep, setDemandeStep] = useState(0);
  const [demandeForm, setDemandeForm] = useState({
    objet: "",
    motif: "",
    priorite: "normale",
    demandeur_content_type: "",
    demandeur_object_id: "",
    lignes: [],
  });
  const [submittingDemande, setSubmittingDemande] = useState(false);

  // Ligne temporaire pour ajout d'article dans demande
  const [tempLigne, setTempLigne] = useState({
    article_id: "",
    quantite: 1,
    notes: "",
  });

  // Refus dialog
  const [openRefus, setOpenRefus] = useState(false);
  const [refusTarget, setRefusTarget] = useState(null);
  const [refusComment, setRefusComment] = useState("");

  // Mouvements
  const [mouvements, setMouvements] = useState([]);
  const [loadingMouvements, setLoadingMouvements] = useState(true);
  const [mouvementPage, setMouvementPage] = useState(0);
  const [mouvementRowsPerPage, setMouvementRowsPerPage] = useState(20);

  // Stats
  const [stats, setStats] = useState(null);
  const [demandesStats, setDemandesStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Delete
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load data
  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const data = await articlesService.list();
      setArticles(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchDemandes = async () => {
    setLoadingDemandes(true);
    try {
      const [dData, dmData] = await Promise.all([
        demandesV2Service.list(),
        demandeursService.list(),
      ]);
      setDemandes(Array.isArray(dData) ? dData : dData?.results || []);
      setDemandeurs(Array.isArray(dmData) ? dmData : dmData?.results || []);
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setLoadingDemandes(false);
    }
  };

  const fetchMouvements = async () => {
    setLoadingMouvements(true);
    try {
      const data = await mouvementsService.list();
      setMouvements(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMouvements(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [invStats, demStats] = await Promise.all([
        inventaireStatsService.get(),
        demandesStatsService.get(),
      ]);
      setStats(invStats);
      setDemandesStats(demStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchDemandes();
  }, []);

  useEffect(() => {
    if (currentTab === 2) fetchMouvements();
    if (currentTab === 3) fetchStats();
  }, [currentTab]);

  // Article expand -> load exemplaires
  const handleExpandArticle = async (articleId) => {
    if (expandedArticle === articleId) {
      setExpandedArticle(null);
      return;
    }
    setExpandedArticle(articleId);
    setLoadingExemplaires(true);
    try {
      const data = await articlesService.exemplaires(articleId);
      setArticleExemplaires(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExemplaires(false);
    }
  };

  // Article CRUD
  const handleSaveArticle = async () => {
    if (!articleForm.nom.trim()) {
      setSnack({
        open: true,
        message: "Le nom est requis",
        severity: "warning",
      });
      return;
    }
    setSubmittingArticle(true);
    try {
      if (editingArticle) {
        await articlesService.update(editingArticle.id, {
          nom: articleForm.nom,
          description: articleForm.description,
          categorie: articleForm.categorie,
          seuil_alerte: articleForm.seuil_alerte,
          prix_unitaire: articleForm.prix_unitaire,
          fournisseur: articleForm.fournisseur,
        });
      } else {
        await articlesService.create(articleForm);
      }
      setSnack({ open: true, message: "OK", severity: "success" });
      setOpenArticleForm(false);
      fetchArticles();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setSubmittingArticle(false);
    }
  };

  const handleAddStock = async () => {
    if (!addStockTarget) return;
    if (!addStockForm.date_acquisition) {
      setSnack({
        open: true,
        message: "La date d'acquisition est requise",
        severity: "warning",
      });
      return;
    }
    setSubmittingStock(true);
    try {
      await articlesService.ajouterStock(addStockTarget.id, addStockForm);
      setSnack({ open: true, message: "Stock ajouté", severity: "success" });
      setOpenAddStock(false);
      fetchArticles();
      if (expandedArticle === addStockTarget.id)
        handleExpandArticle(addStockTarget.id);
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setSubmittingStock(false);
    }
  };

  // Exemplaire actions
  const handleExemplaireStatut = async (exemplaireId, statut, motif = "") => {
    try {
      await exemplairesService.changerStatut(exemplaireId, { statut, motif });
      setSnack({
        open: true,
        message: "Statut mis à jour",
        severity: "success",
      });
      if (expandedArticle) handleExpandArticle(expandedArticle);
      fetchArticles();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const handleOpenEditExemplaire = (ex) => {
    setEditExemplaireTarget(ex);
    setEditExemplaireForm({
      numero_serie: ex.numero_serie || "",
      notes: ex.notes || "",
    });
    setOpenEditExemplaire(true);
  };

  const handleSaveExemplaire = async () => {
    if (!editExemplaireTarget) return;
    setSubmittingExemplaire(true);
    try {
      await exemplairesService.patch(editExemplaireTarget.id, {
        numero_serie: editExemplaireForm.numero_serie,
        notes: editExemplaireForm.notes,
      });
      setSnack({
        open: true,
        message: "Exemplaire mis à jour",
        severity: "success",
      });
      setOpenEditExemplaire(false);
      if (expandedArticle) handleExpandArticle(expandedArticle);
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setSubmittingExemplaire(false);
    }
  };

  // Demande workflow
  const handleCreateDemande = async () => {
    if (!demandeForm.objet.trim()) {
      setSnack({
        open: true,
        message: "L'objet est requis",
        severity: "warning",
      });
      return;
    }
    if (!demandeForm.demandeur_content_type) {
      setSnack({
        open: true,
        message: "Sélectionnez un demandeur",
        severity: "warning",
      });
      return;
    }
    if (demandeForm.lignes.length === 0) {
      setSnack({
        open: true,
        message: "Ajoutez au moins un article",
        severity: "warning",
      });
      return;
    }
    setSubmittingDemande(true);
    try {
      await demandesV2Service.create({
        objet: demandeForm.objet,
        motif: demandeForm.motif,
        priorite: demandeForm.priorite,
        demandeur_content_type: demandeForm.demandeur_content_type,
        demandeur_object_id: demandeForm.demandeur_object_id,
        lignes: demandeForm.lignes.map((l) => ({
          article: l.article_id,
          quantite_demandee: l.quantite,
          notes: l.notes || "",
        })),
      });
      setSnack({ open: true, message: "Demande créée", severity: "success" });
      setOpenDemandeForm(false);
      fetchDemandes();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    } finally {
      setSubmittingDemande(false);
    }
  };

  const handleSoumettre = async (id) => {
    try {
      await demandesV2Service.soumettre(id);
      setSnack({ open: true, message: "Demande soumise", severity: "success" });
      fetchDemandes();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const handleApprouver = async (id) => {
    try {
      await demandesV2Service.approuver(id, {});
      setSnack({
        open: true,
        message: "Demande approuvée",
        severity: "success",
      });
      fetchDemandes();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const handleLivrer = async (id) => {
    try {
      await demandesV2Service.livrer(id);
      setSnack({ open: true, message: "Demande livrée", severity: "success" });
      fetchDemandes();
      fetchArticles();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const handleRefuser = async () => {
    if (!refusTarget) return;
    try {
      await demandesV2Service.refuser(refusTarget.id, {
        commentaire: refusComment,
      });
      setSnack({ open: true, message: "Demande refusée", severity: "info" });
      setOpenRefus(false);
      setRefusComment("");
      fetchDemandes();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const handleDeleteArticle = async () => {
    if (!deleteTarget) return;
    try {
      await articlesService.remove(deleteTarget.id);
      setSnack({
        open: true,
        message: "Article supprimé",
        severity: "success",
      });
      setOpenDelete(false);
      fetchArticles();
    } catch (err) {
      setSnack({
        open: true,
        message: getApiErrorMessage(err, "Erreur"),
        severity: "error",
      });
    }
  };

  const getStatutChip = (statut) => {
    const s = STATUTS_EXEMPLAIRE.find((x) => x.value === statut);
    return s ? (
      <Chip label={s.label} color={s.color} size="small" />
    ) : (
      <Chip label={statut} size="small" />
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="primary">
          <InventoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          Gestion du Matériel
        </Typography>
        {currentTab === 0 && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setOpenImportExport(true)}
            >
              Import / Export
            </Button>
            {canWriteLogistique && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingArticle(null);
                  setArticleForm({
                    nom: "",
                    description: "",
                    categorie: "Informatique",
                    quantite_initiale: 1,
                    seuil_alerte: 5,
                    prix_unitaire: 0,
                    fournisseur: "",
                    condition: "neuf",
                    localisation: "",
                  });
                  setOpenArticleForm(true);
                }}
              >
                Nouvel article
              </Button>
            )}
          </Box>
        )}
        {currentTab === 1 && canWriteLogistique && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="secondary"
            onClick={() => {
              setDemandeForm({
                objet: "",
                motif: "",
                priorite: "normale",
                demandeur_content_type: "",
                demandeur_object_id: "",
                lignes: [],
              });
              setDemandeStep(0);
              setOpenDemandeForm(true);
            }}
          >
            Nouvelle demande
          </Button>
        )}
      </Box>

      {openImportExport && (
        <ImportExportModal
          entity="inventaires"
          onComplete={() => {
            setOpenImportExport(false);
            fetchArticles();
          }}
        />
      )}

      <Tabs
        value={currentTab}
        onChange={(e, v) => setCurrentTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label="Articles & Stock"
          icon={<InventoryIcon />}
          iconPosition="start"
        />
        <Tab label="Demandes" icon={<AssignmentIcon />} iconPosition="start" />
        <Tab label="Mouvements" icon={<HistoryIcon />} iconPosition="start" />
        <Tab
          label="Statistiques"
          icon={<TrendingUpIcon />}
          iconPosition="start"
        />
      </Tabs>

      {/* TAB 0: ARTICLES & STOCK */}
      {currentTab === 0 && (
        <Box>
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F5F7FA" }}>
                <TableRow>
                  <TableCell width={40}></TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Référence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Article</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Catégorie</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>En stock</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Utilisés</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>En panne</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Prix unit.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingArticles ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      Aucun article dans l'inventaire.
                    </TableCell>
                  </TableRow>
                ) : (
                  articles
                    .slice(
                      articlePage * articleRowsPerPage,
                      articlePage * articleRowsPerPage + articleRowsPerPage,
                    )
                    .map((art) => (
                      <React.Fragment key={art.id}>
                        <TableRow
                          hover
                          sx={{
                            "& > *": {
                              borderBottom:
                                expandedArticle === art.id ? "none" : undefined,
                            },
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandArticle(art.id)}
                            >
                              {expandedArticle === art.id ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell
                            sx={{ fontWeight: 600, fontFamily: "monospace" }}
                          >
                            {art.reference}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {art.nom}
                              </Typography>
                              {art.fournisseur && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {art.fournisseur}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={art.categorie}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={art.quantite_en_stock}
                              size="small"
                              color={art.stock_bas ? "error" : "success"}
                              variant={art.stock_bas ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={art.quantite_en_utilisation}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={art.quantite_en_panne}
                              size="small"
                              color={
                                art.quantite_en_panne > 0 ? "error" : "default"
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            {art.quantite_totale}
                          </TableCell>
                          <TableCell>
                            {Number(art.prix_unitaire).toLocaleString()} F
                          </TableCell>
                          <TableCell align="right">
                            {canWriteLogistique && (
                              <Tooltip title="Ajouter au stock">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setAddStockTarget(art);
                                    setAddStockForm({
                                      quantite: 1,
                                      condition: "neuf",
                                      localisation: "",
                                      date_acquisition: "",
                                    });
                                    setOpenAddStock(true);
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canWriteLogistique && (
                              <Tooltip title="Modifier">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setEditingArticle(art);
                                    setArticleForm({
                                      nom: art.nom,
                                      description: art.description || "",
                                      categorie: art.categorie,
                                      quantite_initiale: 0,
                                      seuil_alerte: art.seuil_alerte,
                                      prix_unitaire: art.prix_unitaire,
                                      fournisseur: art.fournisseur || "",
                                      condition: "neuf",
                                      localisation: "",
                                    });
                                    setOpenArticleForm(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canWriteLogistique && (
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeleteTarget(art);
                                    setOpenDelete(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={10} sx={{ py: 0, px: 0 }}>
                            <Collapse
                              in={expandedArticle === art.id}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box sx={{ p: 2, bgcolor: "#FAFBFC" }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                  sx={{ mb: 1 }}
                                >
                                  Exemplaires de "{art.nom}" (
                                  {art.quantite_totale} total)
                                </Typography>
                                {loadingExemplaires ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Réf.
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          N° Série
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Statut
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Condition
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Localisation
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Description / Notes
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Attribué à
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{ fontWeight: "bold" }}
                                        >
                                          Actions
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {articleExemplaires.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={8} align="center">
                                            Aucun exemplaire
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        articleExemplaires.map((ex) => (
                                          <TableRow key={ex.id} hover>
                                            <TableCell
                                              sx={{
                                                fontFamily: "monospace",
                                                fontSize: "0.8rem",
                                              }}
                                            >
                                              {ex.reference}
                                            </TableCell>
                                            <TableCell>
                                              {ex.numero_serie || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {getStatutChip(ex.statut)}
                                            </TableCell>
                                            <TableCell>
                                              {CONDITIONS.find(
                                                (c) => c.value === ex.condition,
                                              )?.label || ex.condition}
                                            </TableCell>
                                            <TableCell>
                                              {ex.localisation || "-"}
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                maxWidth: 200,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {ex.notes || "-"}
                                            </TableCell>
                                            <TableCell>
                                              {ex.attributaire_nom || "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                              <Tooltip title="Modifier N° série / Description">
                                                <IconButton
                                                  size="small"
                                                  color="primary"
                                                  onClick={() =>
                                                    handleOpenEditExemplaire(ex)
                                                  }
                                                >
                                                  <EditIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              {ex.statut === "en_stock" && (
                                                <Tooltip title="Marquer en panne">
                                                  <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() =>
                                                      handleExemplaireStatut(
                                                        ex.id,
                                                        "en_panne",
                                                      )
                                                    }
                                                  >
                                                    <BuildIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              {ex.statut ===
                                                "en_utilisation" && (
                                                <Tooltip title="Retourner en stock">
                                                  <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={async () => {
                                                      try {
                                                        await exemplairesService.retourner(
                                                          ex.id,
                                                          {},
                                                        );
                                                        handleExpandArticle(
                                                          art.id,
                                                        );
                                                        fetchArticles();
                                                        setSnack({
                                                          open: true,
                                                          message: "Retourné",
                                                          severity: "success",
                                                        });
                                                      } catch (e) {
                                                        setSnack({
                                                          open: true,
                                                          message: "Erreur",
                                                          severity: "error",
                                                        });
                                                      }
                                                    }}
                                                  >
                                                    <InventoryIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              {ex.statut === "en_panne" && (
                                                <Tooltip title="Remettre en stock">
                                                  <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() =>
                                                      handleExemplaireStatut(
                                                        ex.id,
                                                        "en_stock",
                                                      )
                                                    }
                                                  >
                                                    <CheckCircleIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                              {(ex.statut === "en_panne" ||
                                                ex.statut ===
                                                  "en_maintenance") && (
                                                <Tooltip title="Réformer">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                      handleExemplaireStatut(
                                                        ex.id,
                                                        "reforme",
                                                        "Réforme",
                                                      )
                                                    }
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100]}
              component="div"
              count={articles.length}
              rowsPerPage={articleRowsPerPage}
              page={articlePage}
              onPageChange={(e, n) => setArticlePage(n)}
              onRowsPerPageChange={(e) => {
                setArticleRowsPerPage(parseInt(e.target.value, 10));
                setArticlePage(0);
              }}
              labelRowsPerPage="Lignes :"
            />
          </Paper>
        </Box>
      )}

      {/* TAB 1: DEMANDES */}
      {currentTab === 1 && (
        <Box>
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F5F7FA" }}>
                <TableRow>
                  <TableCell width={40}></TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Référence</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Objet</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Demandeur</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Priorité</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Articles</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingDemandes ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : demandes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      Aucune demande.
                    </TableCell>
                  </TableRow>
                ) : (
                  demandes
                    .slice(
                      demandePage * demandeRowsPerPage,
                      demandePage * demandeRowsPerPage + demandeRowsPerPage,
                    )
                    .map((dem) => {
                      const statutInfo = DEMANDE_STATUTS[dem.statut] || {
                        label: dem.statut,
                        color: "default",
                      };
                      return (
                        <React.Fragment key={dem.id}>
                          <TableRow hover>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setExpandedDemande(
                                    expandedDemande === dem.id ? null : dem.id,
                                  )
                                }
                              >
                                {expandedDemande === dem.id ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                            </TableCell>
                            <TableCell
                              sx={{ fontFamily: "monospace", fontWeight: 600 }}
                            >
                              {dem.reference}
                            </TableCell>
                            <TableCell>{dem.objet}</TableCell>
                            <TableCell>{dem.demandeur_nom || "-"}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  PRIORITES.find(
                                    (p) => p.value === dem.priorite,
                                  )?.label || dem.priorite
                                }
                                color={
                                  PRIORITES.find(
                                    (p) => p.value === dem.priorite,
                                  )?.color || "default"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge
                                badgeContent={
                                  dem.nb_articles || dem.lignes?.length || 0
                                }
                                color="primary"
                              >
                                <CategoryIcon fontSize="small" />
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statutInfo.label}
                                color={statutInfo.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {dem.date_demande
                                ? new Date(dem.date_demande).toLocaleDateString(
                                    "fr-FR",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell align="right">
                              {canWriteLogistique && dem.statut === "brouillon" && (
                                <Tooltip title="Soumettre">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleSoumettre(dem.id)}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canWriteLogistique &&
                                (dem.statut === "soumise" ||
                                  dem.statut === "en_cours") && (
                                  <>
                                    <Tooltip title="Approuver">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleApprouver(dem.id)}
                                      >
                                        <ThumbUpIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Refuser">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          setRefusTarget(dem);
                                          setRefusComment("");
                                          setOpenRefus(true);
                                        }}
                                      >
                                        <ThumbDownIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              {canWriteLogistique && dem.statut === "approuvee" && (
                                <Tooltip title="Livrer">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleLivrer(dem.id)}
                                  >
                                    <LocalShippingIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={9} sx={{ py: 0, px: 0 }}>
                              <Collapse
                                in={expandedDemande === dem.id}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box sx={{ p: 2, bgcolor: "#FAFBFC" }}>
                                  {statutInfo.step >= 0 && (
                                    <Stepper
                                      activeStep={statutInfo.step}
                                      alternativeLabel
                                      sx={{ mb: 2 }}
                                    >
                                      {DEMANDE_STEPS.map((label) => (
                                        <Step key={label}>
                                          <StepLabel>{label}</StepLabel>
                                        </Step>
                                      ))}
                                    </Stepper>
                                  )}
                                  {dem.motif && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Motif :</strong> {dem.motif}
                                    </Typography>
                                  )}
                                  {dem.commentaire_refus && (
                                    <Alert severity="error" sx={{ mb: 1 }}>
                                      Motif de refus : {dem.commentaire_refus}
                                    </Alert>
                                  )}
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight="bold"
                                    sx={{ mt: 1, mb: 0.5 }}
                                  >
                                    Articles demandés :
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Article</TableCell>
                                        <TableCell>Référence</TableCell>
                                        <TableCell>Qté demandée</TableCell>
                                        <TableCell>Qté accordée</TableCell>
                                        <TableCell>Stock dispo</TableCell>
                                        <TableCell>Notes</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {(dem.lignes || []).map((l, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell sx={{ fontWeight: 500 }}>
                                            {l.article_nom}
                                          </TableCell>
                                          <TableCell
                                            sx={{ fontFamily: "monospace" }}
                                          >
                                            {l.article_reference}
                                          </TableCell>
                                          <TableCell>
                                            {l.quantite_demandee}
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: "bold",
                                              color:
                                                l.quantite_accordee > 0
                                                  ? "success.main"
                                                  : "text.secondary",
                                            }}
                                          >
                                            {l.quantite_accordee || "-"}
                                          </TableCell>
                                          <TableCell>
                                            <Chip
                                              label={l.stock_disponible}
                                              size="small"
                                              color={
                                                l.stock_disponible >=
                                                l.quantite_demandee
                                                  ? "success"
                                                  : "error"
                                              }
                                              variant="outlined"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            {l.notes || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100]}
              component="div"
              count={demandes.length}
              rowsPerPage={demandeRowsPerPage}
              page={demandePage}
              onPageChange={(e, n) => setDemandePage(n)}
              onRowsPerPageChange={(e) => {
                setDemandeRowsPerPage(parseInt(e.target.value, 10));
                setDemandePage(0);
              }}
              labelRowsPerPage="Lignes :"
            />
          </Paper>
        </Box>
      )}

      {/* TAB 2: MOUVEMENTS */}
      {currentTab === 2 && (
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F5F7FA" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Référence</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Article</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Exemplaire</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Motif</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Destinataire</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingMouvements ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : mouvements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    Aucun mouvement enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                mouvements
                  .slice(
                    mouvementPage * mouvementRowsPerPage,
                    mouvementPage * mouvementRowsPerPage + mouvementRowsPerPage,
                  )
                  .map((mvt) => (
                    <TableRow key={mvt.id} hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {mvt.reference}
                      </TableCell>
                      <TableCell>{mvt.article_nom}</TableCell>
                      <TableCell
                        sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                      >
                        {mvt.exemplaire_reference}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={mvt.type_display}
                          size="small"
                          color={
                            mvt.type_mouvement === "entree"
                              ? "success"
                              : mvt.type_mouvement === "sortie"
                                ? "warning"
                                : mvt.type_mouvement === "retour"
                                  ? "info"
                                  : mvt.type_mouvement === "reforme"
                                    ? "error"
                                    : "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{mvt.motif || "-"}</TableCell>
                      <TableCell>{mvt.destinataire_nom || "-"}</TableCell>
                      <TableCell>
                        {mvt.date
                          ? new Date(mvt.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[20, 50, 100]}
            component="div"
            count={mouvements.length}
            rowsPerPage={mouvementRowsPerPage}
            page={mouvementPage}
            onPageChange={(e, n) => setMouvementPage(n)}
            onRowsPerPageChange={(e) => {
              setMouvementRowsPerPage(parseInt(e.target.value, 10));
              setMouvementPage(0);
            }}
            labelRowsPerPage="Lignes :"
          />
        </Paper>
      )}

      {/* TAB 3: STATISTIQUES */}
      {currentTab === 3 && (
        <Box>
          {loadingStats ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            stats && (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ borderRadius: 3, borderTop: "4px solid #2196F3" }}
                    >
                      <CardContent>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          ARTICLES RÉFÉRENCÉS
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stats.total_articles}
                        </Typography>
                        <Typography variant="caption">
                          {stats.total_exemplaires} exemplaires au total
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ borderRadius: 3, borderTop: "4px solid #4CAF50" }}
                    >
                      <CardContent>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          EN STOCK
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="success.main"
                        >
                          {stats.en_stock}
                        </Typography>
                        <Typography variant="caption">
                          disponibles à la distribution
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ borderRadius: 3, borderTop: "4px solid #2196F3" }}
                    >
                      <CardContent>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          EN UTILISATION
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="info.main"
                        >
                          {stats.en_utilisation}
                        </Typography>
                        <Typography variant="caption">
                          distribués au personnel
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{ borderRadius: 3, borderTop: "4px solid #F44336" }}
                    >
                      <CardContent>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color="text.secondary"
                        >
                          EN PANNE / RÉFORMÉS
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          color="error.main"
                        >
                          {stats.en_panne + stats.reformes}
                        </Typography>
                        <Typography variant="caption">
                          {stats.en_panne} en panne, {stats.reformes} réformés
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ mb: 1 }}
                        >
                          Valeur du stock
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {Number(stats.valeur_stock).toLocaleString()} FCFA
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ mb: 1 }}
                        >
                          <WarningAmberIcon
                            sx={{
                              verticalAlign: "middle",
                              mr: 0.5,
                              color: "warning.main",
                            }}
                            fontSize="small"
                          />
                          Articles en stock bas
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color={
                            stats.articles_stock_bas > 0
                              ? "error.main"
                              : "success.main"
                          }
                        >
                          {stats.articles_stock_bas}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ mb: 1 }}
                        >
                          Mouvements (30 jours)
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {stats.mouvements_30j}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {stats.par_categorie?.length > 0 && (
                  <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                      >
                        Répartition par catégorie
                      </Typography>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#F5F7FA" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Catégorie
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Articles
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Exemplaires
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.par_categorie.map((cat, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {cat.categorie}
                              </TableCell>
                              <TableCell>{cat.nb_articles}</TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>
                                {cat.nb_exemplaires}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {stats.top_en_utilisation?.length > 0 && (
                  <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                      >
                        Top articles en utilisation
                      </Typography>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#F5F7FA" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Article
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Réf.
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              En utilisation
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Total
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>
                              Taux d'utilisation
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.top_en_utilisation.map((item, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {item.nom}
                              </TableCell>
                              <TableCell sx={{ fontFamily: "monospace" }}>
                                {item.reference}
                              </TableCell>
                              <TableCell>{item.nb_utilisation}</TableCell>
                              <TableCell>{item.quantite_totale}</TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <LinearProgress
                                    variant="determinate"
                                    value={
                                      item.quantite_totale > 0
                                        ? (item.nb_utilisation /
                                            item.quantite_totale) *
                                          100
                                        : 0
                                    }
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                  >
                                    {item.quantite_totale > 0
                                      ? Math.round(
                                          (item.nb_utilisation /
                                            item.quantite_totale) *
                                            100,
                                        )
                                      : 0}
                                    %
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {demandesStats && (
                  <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                      >
                        Statistiques des demandes
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {demandesStats.total}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            En attente
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color="warning.main"
                          >
                            {(demandesStats.par_statut?.soumise || 0) +
                              (demandesStats.par_statut?.en_cours || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Livrées
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color="success.main"
                          >
                            {demandesStats.par_statut?.livree || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Délai moyen
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {demandesStats.delai_moyen_jours
                              ? `${demandesStats.delai_moyen_jours} j`
                              : "-"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {stats.derniers_mouvements?.length > 0 && (
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ mb: 2 }}
                      >
                        Derniers mouvements
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Réf.</TableCell>
                            <TableCell>Article</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Motif</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.derniers_mouvements.map((mvt, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontFamily: "monospace" }}>
                                {mvt.reference}
                              </TableCell>
                              <TableCell>{mvt.article_nom}</TableCell>
                              <TableCell>
                                <Chip
                                  label={mvt.type_display}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{mvt.motif || "-"}</TableCell>
                              <TableCell>
                                {mvt.date
                                  ? new Date(mvt.date).toLocaleDateString(
                                      "fr-FR",
                                    )
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )
          )}
        </Box>
      )}

      {/* === DIALOGS === */}

      {/* Create/Edit Article */}
      <Dialog
        open={openArticleForm}
        onClose={() => setOpenArticleForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingArticle ? "Modifier l'article" : "Nouvel article"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de l'article"
                value={articleForm.nom}
                onChange={(e) =>
                  setArticleForm({ ...articleForm, nom: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={articleForm.description}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={articleForm.categorie}
                  label="Catégorie"
                  onChange={(e) =>
                    setArticleForm({
                      ...articleForm,
                      categorie: e.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Prix unitaire (FCFA)"
                value={articleForm.prix_unitaire}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    prix_unitaire: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fournisseur"
                value={articleForm.fournisseur}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    fournisseur: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Seuil d'alerte"
                value={articleForm.seuil_alerte}
                onChange={(e) =>
                  setArticleForm({
                    ...articleForm,
                    seuil_alerte: e.target.value,
                  })
                }
              />
            </Grid>
            {!editingArticle && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Chip label="Stock initial" size="small" />
                  </Divider>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantité"
                    value={articleForm.quantite_initiale}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        quantite_initiale: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={articleForm.condition}
                      label="Condition"
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          condition: e.target.value,
                        })
                      }
                    >
                      {CONDITIONS.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Localisation"
                    value={articleForm.localisation}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        localisation: e.target.value,
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenArticleForm(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveArticle}
            disabled={submittingArticle}
          >
            {submittingArticle ? <CircularProgress size={20} /> : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock */}
      <Dialog
        open={openAddStock}
        onClose={() => setOpenAddStock(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Ajouter au stock : {addStockTarget?.nom}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Quantité"
                value={addStockForm.quantite}
                onChange={(e) =>
                  setAddStockForm({ ...addStockForm, quantite: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={addStockForm.condition}
                  label="Condition"
                  onChange={(e) =>
                    setAddStockForm({
                      ...addStockForm,
                      condition: e.target.value,
                    })
                  }
                >
                  {CONDITIONS.map((c) => (
                    <MenuItem key={c.value} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Localisation"
                value={addStockForm.localisation}
                onChange={(e) =>
                  setAddStockForm({
                    ...addStockForm,
                    localisation: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date d'acquisition"
                InputLabelProps={{ shrink: true }}
                value={addStockForm.date_acquisition}
                onChange={(e) =>
                  setAddStockForm({
                    ...addStockForm,
                    date_acquisition: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddStock(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddStock}
            disabled={submittingStock}
          >
            {submittingStock ? <CircularProgress size={20} /> : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Demande - Multi-step */}
      <Dialog
        open={openDemandeForm}
        onClose={() => setOpenDemandeForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nouvelle demande d'articles</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={demandeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Informations</StepLabel>
            </Step>
            <Step>
              <StepLabel>Articles</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirmation</StepLabel>
            </Step>
          </Stepper>

          {demandeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Objet de la demande"
                  value={demandeForm.objet}
                  onChange={(e) =>
                    setDemandeForm({ ...demandeForm, objet: e.target.value })
                  }
                  required
                  placeholder="Ex: Besoin de matériel informatique pour la salle B2"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Motif / Justification"
                  value={demandeForm.motif}
                  onChange={(e) =>
                    setDemandeForm({ ...demandeForm, motif: e.target.value })
                  }
                  placeholder="Expliquez pourquoi ce matériel est nécessaire..."
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Demandeur</InputLabel>
                  <Select
                    value={
                      demandeForm.demandeur_content_type
                        ? `${demandeForm.demandeur_content_type}-${demandeForm.demandeur_object_id}`
                        : ""
                    }
                    label="Demandeur"
                    onChange={(e) => {
                      const sel = demandeurs.find(
                        (d) =>
                          `${d.content_type_id}-${d.id}` === e.target.value,
                      );
                      if (sel)
                        setDemandeForm({
                          ...demandeForm,
                          demandeur_content_type: sel.content_type_id,
                          demandeur_object_id: sel.id,
                        });
                    }}
                  >
                    {demandeurs.map((d) => (
                      <MenuItem
                        key={`${d.type}-${d.id}`}
                        value={`${d.content_type_id}-${d.id}`}
                      >
                        {d.nom} ({d.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priorité</InputLabel>
                  <Select
                    value={demandeForm.priorite}
                    label="Priorité"
                    onChange={(e) =>
                      setDemandeForm({
                        ...demandeForm,
                        priorite: e.target.value,
                      })
                    }
                  >
                    {PRIORITES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {demandeStep === 1 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <FormControl sx={{ minWidth: 250 }}>
                  <InputLabel>Article</InputLabel>
                  <Select
                    label="Article"
                    value={tempLigne.article_id}
                    onChange={(e) =>
                      setTempLigne({ ...tempLigne, article_id: e.target.value })
                    }
                  >
                    {articles
                      .filter((a) => a.quantite_en_stock > 0)
                      .map((a) => (
                        <MenuItem key={a.id} value={a.id}>
                          {a.nom} ({a.quantite_en_stock} dispo)
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Qté"
                  value={tempLigne.quantite}
                  onChange={(e) =>
                    setTempLigne({
                      ...tempLigne,
                      quantite: parseInt(e.target.value) || 1,
                    })
                  }
                  sx={{ width: 80 }}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Notes"
                  value={tempLigne.notes}
                  onChange={(e) =>
                    setTempLigne({ ...tempLigne, notes: e.target.value })
                  }
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    if (!tempLigne.article_id) {
                      setSnack({
                        open: true,
                        message: "Sélectionnez un article",
                        severity: "warning",
                      });
                      return;
                    }
                    const art = articles.find(
                      (a) => a.id === tempLigne.article_id,
                    );
                    if (!art) return;
                    if (
                      demandeForm.lignes.find((l) => l.article_id === art.id)
                    ) {
                      setSnack({
                        open: true,
                        message: "Article déjà ajouté",
                        severity: "warning",
                      });
                      return;
                    }
                    setDemandeForm({
                      ...demandeForm,
                      lignes: [
                        ...demandeForm.lignes,
                        {
                          article_id: art.id,
                          article_nom: art.nom,
                          article_ref: art.reference,
                          stock: art.quantite_en_stock,
                          quantite: tempLigne.quantite,
                          notes: tempLigne.notes,
                        },
                      ],
                    });
                    setTempLigne({ article_id: "", quantite: 1, notes: "" });
                  }}
                >
                  Ajouter
                </Button>
              </Box>
              {demandeForm.lignes.length === 0 ? (
                <Alert severity="info">
                  Aucun article ajouté. Sélectionnez un article ci-dessus.
                </Alert>
              ) : (
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#F5F7FA" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Article</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Réf.</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Stock dispo
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Quantité
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Notes</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {demandeForm.lignes.map((l, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {l.article_nom}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {l.article_ref}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={l.stock}
                            size="small"
                            color={l.stock >= l.quantite ? "success" : "error"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={l.quantite}
                            sx={{ width: 70 }}
                            inputProps={{ min: 1 }}
                            onChange={(e) => {
                              const newLignes = [...demandeForm.lignes];
                              newLignes[idx].quantite =
                                parseInt(e.target.value) || 1;
                              setDemandeForm({
                                ...demandeForm,
                                lignes: newLignes,
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>{l.notes || "-"}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setDemandeForm({
                                ...demandeForm,
                                lignes: demandeForm.lignes.filter(
                                  (_, i) => i !== idx,
                                ),
                              });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}

          {demandeStep === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Vérifiez les informations avant de soumettre la demande.
              </Alert>
              <Typography variant="subtitle2">
                <strong>Objet :</strong> {demandeForm.objet}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Motif :</strong> {demandeForm.motif || "Non renseigné"}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Demandeur :</strong>{" "}
                {demandeurs.find(
                  (d) =>
                    d.content_type_id === demandeForm.demandeur_content_type &&
                    d.id === demandeForm.demandeur_object_id,
                )?.nom || "-"}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Priorité :</strong>{" "}
                {PRIORITES.find((p) => p.value === demandeForm.priorite)?.label}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Articles ({demandeForm.lignes.length})
              </Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Article</TableCell>
                    <TableCell>Quantité</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {demandeForm.lignes.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.article_nom}</TableCell>
                      <TableCell>{l.quantite}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDemandeForm(false)}>Annuler</Button>
          {demandeStep > 0 && (
            <Button onClick={() => setDemandeStep(demandeStep - 1)}>
              Précédent
            </Button>
          )}
          {demandeStep < 2 && (
            <Button
              variant="contained"
              onClick={() => {
                if (
                  demandeStep === 0 &&
                  (!demandeForm.objet.trim() ||
                    !demandeForm.demandeur_content_type)
                ) {
                  setSnack({
                    open: true,
                    message: "Remplissez l'objet et le demandeur",
                    severity: "warning",
                  });
                  return;
                }
                if (demandeStep === 1 && demandeForm.lignes.length === 0) {
                  setSnack({
                    open: true,
                    message: "Ajoutez au moins un article",
                    severity: "warning",
                  });
                  return;
                }
                setDemandeStep(demandeStep + 1);
              }}
            >
              Suivant
            </Button>
          )}
          {demandeStep === 2 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleCreateDemande}
              disabled={submittingDemande}
            >
              {submittingDemande ? (
                <CircularProgress size={20} />
              ) : (
                "Créer la demande"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Refus dialog */}
      <Dialog
        open={openRefus}
        onClose={() => setOpenRefus(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Refuser la demande {refusTarget?.reference}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motif du refus"
            value={refusComment}
            onChange={(e) => setRefusComment(e.target.value)}
            placeholder="Expliquez le motif du refus..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRefus(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleRefuser}>
            Refuser
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer "{deleteTarget?.nom}" et tous ses exemplaires ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteArticle}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditExemplaire}
        onClose={() => setOpenEditExemplaire(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifier l&apos;exemplaire {editExemplaireTarget?.reference}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Numéro de série"
                value={editExemplaireForm.numero_serie}
                onChange={(e) =>
                  setEditExemplaireForm((prev) => ({
                    ...prev,
                    numero_serie: e.target.value,
                  }))
                }
                fullWidth
                placeholder="Ex: SN-2024-001234"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description / Notes"
                value={editExemplaireForm.notes}
                onChange={(e) =>
                  setEditExemplaireForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={3}
                placeholder="Description, état particulier, remarques..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenEditExemplaire(false)}
            disabled={submittingExemplaire}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveExemplaire}
            variant="contained"
            disabled={submittingExemplaire}
          >
            {submittingExemplaire ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
