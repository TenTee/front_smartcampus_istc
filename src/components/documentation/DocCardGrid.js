"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import DocPreviewModal from "./DocPreviewModal";

export default function DocCardGrid({ documents, searchTerm, selectedCategory }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenPreview = (doc) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  const handleDownload = (doc, e) => {
    e.stopPropagation();
    const element = document.createElement("a");
    const file = new Blob(
      [
        `SMARTCAMPUS - DOCUMENT OFFICIEL: ${doc.title}\n\n` +
        `Description: ${doc.description}\n` +
        `Catégorie: ${doc.categoryLabel}\n` +
        `Mise à jour: ${doc.updatedDate}\n`
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
    <Box sx={{ py: 6, backgroundColor: "#FFFFFF", minHeight: "500px" }}>
      <Container maxWidth="lg">
        {/* Results Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A" }}>
            Documents ({documents.length})
          </Typography>
          {(searchTerm || selectedCategory !== "all") && (
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Filtres actifs : {searchTerm && `"${searchTerm}"`} {selectedCategory !== "all" && `[Catégorie: ${selectedCategory}]`}
            </Typography>
          )}
        </Box>

        {/* Empty State */}
        {documents.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              backgroundColor: "#F8FAFC",
              borderRadius: "16px",
              border: "1px dashed #CBD5E1",
              maxWidth: 600,
              mx: "auto",
              my: 4,
            }}
          >
            <InsertDriveFileIcon sx={{ fontSize: 60, color: "#94A3B8", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B", mb: 1 }}>
              Aucun document ne correspond à votre recherche
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Essayez de modifier votre mot-clé ou réinitialisez les filtres de catégorie.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3.5}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card
                  elevation={0}
                  onClick={() => handleOpenPreview(doc)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    backgroundColor: "#FFFFFF",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 12px 24px -10px rgba(37, 99, 235, 0.15)",
                      borderColor: "#93C5FD",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Format & Badge Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        {doc.format === "PDF" ? (
                          <PictureAsPdfIcon sx={{ color: "#EF4444", fontSize: 22 }} />
                        ) : (
                          <DescriptionIcon sx={{ color: "#2563EB", fontSize: 22 }} />
                        )}
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569" }}>
                          {doc.format} • {doc.size}
                        </Typography>
                      </Box>
                      <Chip
                        label={doc.badge}
                        size="small"
                        sx={{
                          backgroundColor: doc.badgeColor || "#2563EB",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: 22,
                        }}
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: "#0F172A",
                        mb: 1.5,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 48,
                      }}
                    >
                      {doc.title}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748B",
                        mb: 2.5,
                        fontSize: "0.875rem",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 60,
                      }}
                    >
                      {doc.description}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Metadata Footer */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                          {doc.updatedDate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                          {doc.readingTime}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenPreview(doc)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#CBD5E1",
                        color: "#334155",
                        "&:hover": { borderColor: "#2563EB", backgroundColor: "#EFF6FF", color: "#2563EB" },
                      }}
                    >
                      Aperçu
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      disableElevation
                      startIcon={<FileDownloadIcon />}
                      onClick={(e) => handleDownload(doc, e)}
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        backgroundColor: "#2563EB",
                        "&:hover": { backgroundColor: "#1D4ED8" },
                      }}
                    >
                      Télécharger
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Modal */}
      <DocPreviewModal
        doc={selectedDoc}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
}
