"use client";

import React from "react";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

const steps = [
  {
    number: "01",
    icon: <ComputerIcon sx={{ fontSize: "3rem", color: "#2563EB" }} />,
    title: "Démonstration & Audit",
    description: "Nous évaluons vos besoins spécifiques et vous présentons comment Smart Campus peut s'adapter parfaitement à votre établissement.",
  },
  {
    number: "02",
    icon: <CloudUploadIcon sx={{ fontSize: "3rem", color: "#2563EB" }} />,
    title: "Configuration & Import",
    description: "Nous importons vos données existantes (étudiants, profs, notes passées) et paramétrons la plateforme selon vos règles de gestion.",
  },
  {
    number: "03",
    icon: <RocketLaunchIcon sx={{ fontSize: "3rem", color: "#2563EB" }} />,
    title: "Formation & Lancement",
    description: "Votre équipe est formée par nos experts locaux. Vous êtes prêts à démarrer avec un support continu disponible 24/7.",
  },
];

export default function HowItWorks() {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: "#FFFFFF",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "800",
              color: "#0A2540",
              mb: 2,
              fontSize: { xs: "2rem", md: "2.5rem" },
              letterSpacing: "-0.02em"
            }}
          >
            Passez au digital en toute simplicité
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              fontWeight: 300,
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            Une intégration sans douleur. Notre équipe s'occupe de tout pour vous garantir une transition rapide et efficace.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ position: "relative" }}>
          {/* Ligne de connexion pour les grands écrans */}
          <Box
            sx={{
              position: "absolute",
              top: "120px",
              left: "15%",
              right: "15%",
              height: "2px",
              backgroundColor: "#E2E8F0",
              display: { xs: "none", md: "block" },
              zIndex: 0,
            }}
          />

          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={index} sx={{ position: "relative", zIndex: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: "center",
                  p: 4,
                  height: "100%",
                  backgroundColor: "transparent",
                }}
              >
                <Box
                  sx={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px auto",
                    border: "4px solid #FFFFFF",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    position: "relative",
                  }}
                >
                  {step.icon}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#0A2540",
                      color: "white",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                    }}
                  >
                    {step.number}
                  </Box>
                </Box>
                
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    color: "#0A2540",
                    mb: 2,
                  }}
                >
                  {step.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#64748B",
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
