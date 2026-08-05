"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SpeedIcon from "@mui/icons-material/Speed";
import PublicIcon from "@mui/icons-material/Public";

const benefits = [
  {
    icon: <TrendingUpIcon sx={{ fontSize: "3rem" }} />,
    title: "Augmentez la Performance",
    description:
      "Améliorcez les résultats académiques avec des outils d'analyse intelligents et des rapports détaillés sur les performances des étudiants.",
  },
  {
    icon: <SpeedIcon sx={{ fontSize: "3rem" }} />,
    title: "Gagnez du Temps",
    description:
      "Automatisez les tâches administratives répétitives et libérez du temps pour vous concentrer sur ce qui compte vraiment.",
  },
  {
    icon: <CheckCircleIcon sx={{ fontSize: "3rem" }} />,
    title: "Réduisez les Erreurs",
    description:
      "Éliminez les procédures manuelles source d'erreurs. Tout est centralisé, sécurisé et vérifiable.",
  },
  {
    icon: <PublicIcon sx={{ fontSize: "3rem" }} />,
    title: "Accédez Partout, Anytime",
    description:
      "Connectez-vous 24/7 depuis n'importe quel appareil. Même sans connexion, l'appli continue de fonctionner.",
  },
];

export default function Benefits() {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: "#F8FAFC",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
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
            Avantages
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              fontWeight: 300,
              maxWidth: "700px",
              margin: "0 auto",
              mb: 4,
            }}
          >
            Conçu pour les réalités du terrain camerounais : solution
            résiliente, abordable et adaptée aux infrastructures locales.
          </Typography>

          <Box
            component="img"
            src="/kojo-kwarteng-KUzlAah2dog-unsplash.jpg"
            alt="Étudiants camerounais dans une salle de classe moderne"
            sx={{
              width: "100%",
              maxWidth: "800px",
              height: "400px",
              objectFit: "cover",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)",
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "none",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    borderColor: "#CBD5E1",
                    transform: "translateY(-4px)"
                  },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 3 }}>
                  <Box
                    sx={{
                      minWidth: "80px",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                    }}
                  >
                    {benefit.icon}
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "#0A2540",
                        mb: 1,
                      }}
                    >
                      {benefit.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#666666",
                        lineHeight: 1.6,
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 8,
            p: 6,
            backgroundColor: "#0A2540",
            borderRadius: "24px",
            color: "white",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              mb: 2,
            }}
          >
            Support & Infrastructure 100% Local
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Infrastructure hébergée au Cameroun avec équipe support locale.
            Données sécurisées, conformité CNDP, et assistance en français.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
