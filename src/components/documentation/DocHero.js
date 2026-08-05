"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function DocHero({ searchSearchTerm, setSearchTerm, totalDocsCount }) {
  const quickSearches = [
    "Guide Étudiant",
    "Règlement",
    "Grille Tarifaire",
    "Attestation",
    "Formateur",
    "API",
  ];

  return (
    <Box
      sx={{
        background: "linear-[#1E3A8A]",
        backgroundImage: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 40%, #2563EB 100%)",
        color: "white",
        py: { xs: 6, md: 9 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
        <Box sx={{ textAlign: "center", maxWidth: 840, mx: "auto" }}>
          {/* Badge top */}
          <Chip
            icon={<MenuBookIcon sx={{ color: "#60A5FA !important", fontSize: 18 }} />}
            label="Centre de Documentation Officiel SmartCampus"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#E2E8F0",
              fontWeight: 600,
              fontSize: "0.85rem",
              backdropFilter: "blur(8px)",
              mb: 3,
              px: 1,
              py: 0.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          />

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2rem", sm: "2.8rem", md: "3.4rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Tous les documents & guides de votre établissement en un seul endroit
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: "#CBD5E1",
              fontWeight: 400,
              fontSize: { xs: "1rem", sm: "1.15rem" },
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Consultez, téléchargez et prévisualisez les règlements, manuels d'utilisation,
            fiches financières et formulaires administratifs numérisés.
          </Typography>

          {/* Search Box */}
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              borderRadius: "16px",
              p: 1,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              maxWidth: 680,
              mx: "auto",
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder="Rechercher un document, un guide, un règlement, un tarif..."
              value={searchSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start" sx={{ pl: 1.5 }}>
                    <SearchIcon sx={{ color: "#2563EB", fontSize: 28 }} />
                  </InputAdornment>
                ),
                endAdornment: searchSearchTerm && (
                  <InputAdornment position="end" sx={{ pr: 1 }}>
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: "#1E293B",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  fontWeight: 500,
                  py: 0.5,
                },
              }}
            />
          </Box>

          {/* Quick Search Suggestions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "#94A3B8", mr: 1, fontWeight: 500 }}>
              Suggestions :
            </Typography>
            {quickSearches.map((term) => (
              <Chip
                key={term}
                label={term}
                size="small"
                onClick={() => setSearchTerm(term)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    transform: "translateY(-1px)",
                  },
                }}
              />
            ))}
          </Box>

          {/* Quick Stats Badges */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: { xs: 2, sm: 5 },
              mt: 5,
              pt: 3,
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MenuBookIcon sx={{ color: "#60A5FA", fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#F1F5F9" }}>
                {totalDocsCount} Documents disponibles
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VerifiedUserIcon sx={{ color: "#34D399", fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#F1F5F9" }}>
                Certifiés Officiels
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, display: { xs: "none", sm: "flex" } }}>
              <FileDownloadIcon sx={{ color: "#FBBF24", fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#F1F5F9" }}>
                Téléchargement Libre PDF
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
