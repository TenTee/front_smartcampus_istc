"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ShareIcon from "@mui/icons-material/Share";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import CategoryIcon from "@mui/icons-material/Category";

export default function DocPreviewModal({ doc, open, onClose }) {
  const [toastOpen, setToastOpen] = useState(false);

  if (!doc) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setToastOpen(true);
  };

  const handleDownload = () => {
    // Simulate direct file download
    const element = document.createElement("a");
    const file = new Blob(
      [
        `===================================================\n` +
        `SMARTCAMPUS DOCUMENT OFFICIEL\n` +
        `===================================================\n` +
        `Titre: ${doc.title}\n` +
        `Catégorie: ${doc.categoryLabel}\n` +
        `Version: ${doc.version}\n` +
        `Mise à jour: ${doc.updatedDate}\n` +
        `Public Cible: ${doc.targetAudience}\n\n` +
        `RÉSUMÉ DU DOCUMENT:\n` +
        doc.summary.map((s, i) => `${i + 1}. ${s}`).join("\n") +
        `\n\nSOMMAIRE:\n` +
        doc.tableOfContents.map((t) => `- ${t}`).join("\n") +
        `\n\n© SmartCampus 2026 - Tous droits réservés.`
      ],
      { type: "text/plain;charset=utf-8" }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: { xs: 1, sm: 2 },
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ pr: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
              <Chip
                label={doc.badge}
                size="small"
                sx={{
                  backgroundColor: doc.badgeColor || "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              />
              <Chip
                icon={<CategoryIcon sx={{ fontSize: "14px !important" }} />}
                label={doc.categoryLabel}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.75rem", fontWeight: 600 }}
              />
              <Chip
                label={`Format ${doc.format} • ${doc.size}`}
                size="small"
                sx={{ backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 600, fontSize: "0.75rem" }}
              />
            </Box>

            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>
              {doc.title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#64748B" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Metadata Row */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              backgroundColor: "#F8FAFC",
              p: 2,
              borderRadius: "12px",
              mb: 3,
              border: "1px solid #E2E8F0",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <GroupIcon sx={{ color: "#2563EB", fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                  Public Cible
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B" }}>
                  {doc.targetAudience}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon sx={{ color: "#059669", fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                  Mise à jour
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B" }}>
                  {doc.updatedDate} ({doc.version})
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InsertDriveFileIcon sx={{ color: "#D97706", fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                  Temps de lecture estimé
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B" }}>
                  ~{doc.readingTime}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Description */}
          <Typography variant="body1" sx={{ color: "#334155", mb: 3, lineHeight: 1.6 }}>
            {doc.description}
          </Typography>

          {/* Key Summary Points */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            📌 Aperçu & Points Clés du Document
          </Typography>
          <List disablePadding sx={{ mb: 3 }}>
            {doc.summary.map((point, idx) => (
              <ListItem key={idx} sx={{ px: 0, py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon sx={{ color: "#2563EB", fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={point}
                  primaryTypographyProps={{ fontSize: "0.92rem", color: "#475569", fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Table of Contents */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            📖 Sommaire de la Structure
          </Typography>
          <Box sx={{ backgroundColor: "#F1F5F9", p: 2, borderRadius: "10px" }}>
            {doc.tableOfContents.map((section, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: "#334155", mb: 0.8, fontWeight: 500 }}>
                {section}
              </Typography>
            ))}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Button
            startIcon={<ShareIcon />}
            onClick={handleShare}
            variant="outlined"
            sx={{ textTransform: "none", color: "#475569", borderColor: "#CBD5E1" }}
          >
            Copier le lien
          </Button>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button onClick={onClose} variant="text" sx={{ textTransform: "none", color: "#64748B" }}>
              Fermer
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                backgroundColor: "#2563EB",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                px: 3,
                "&:hover": { backgroundColor: "#1D4ED8" },
              }}
            >
              Télécharger ({doc.format})
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Lien du document copié dans le presse-papiers !
        </Alert>
      </Snackbar>
    </>
  );
}
