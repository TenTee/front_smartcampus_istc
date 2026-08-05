"use client";

import React from "react";
import { Box, Container, Typography, Button, Grid } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";

export default function HomeHero() {
  const router = useRouter();

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        color: "#0A2540",
        py: { xs: 6, md: 10 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={6}
          alignItems="center"
          position="relative"
          zIndex={1}
        >
          <Grid item xs={12} md={6}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: "800",
                lineHeight: 1.2,
                mb: 3,
                letterSpacing: "-0.02em",
              }}
            >
              Transformez votre établissement avec{" "}
              <Box component="span" sx={{ color: "#2563EB" }}>
                Smart Campus
              </Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: "1rem", md: "1.25rem" },
                fontWeight: 400,
                lineHeight: 1.6,
                mb: 4,
                color: "#475569",
              }}
            >
              La solution complète de gestion scolaire pensée pour les
              établissements camerounais. Intelligence, efficacité et
              simplicité, tout en un.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                size="large"
                disableElevation
                sx={{
                  backgroundColor: "#2563EB",
                  color: "white",
                  fontWeight: "bold",
                  py: 1.5,
                  px: 4,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "#1D4ED8",
                  },
                }}
                onClick={() => router.push("/login")}
              >
                Accéder au Portail
                <ArrowForwardIcon sx={{ ml: 1, fontSize: "1.2rem" }} />
              </Button>

              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: "#0A2540",
                  borderColor: "#E2E8F0",
                  fontWeight: "bold",
                  py: 1.5,
                  px: 4,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#CBD5E1",
                  },
                }}
                onClick={() => router.push("/preinscription")}
              >
                Se préinscrire
              </Button>
            </Box>

            <Box
              sx={{
                mt: 5,
                pt: 4,
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500 }}>
                ✔️ Sécurisé • ✔️ Confidentiel • ✔️ Support Local au Cameroun
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ position: "relative" }}>
            <Box
              component="img"
              src="/landingbanner.jpg"
              alt="Étudiants camerounais sur un campus universitaire"
              sx={{
                width: "100%",
                height: "auto",
                objectFit: "cover",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)",
              }}
            />
            
            <Box
              sx={{
                position: "absolute",
                bottom: "40px",
                left: "-20px",
                backgroundColor: "white",
                borderRadius: "16px",
                p: 3,
                boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                display: { xs: "none", sm: "block" },
              }}
            >
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  color: "#2563EB",
                  mb: 0.5,
                }}
              >
                100%
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#475569", fontWeight: 500 }}>
                Adapté aux réalités<br />locales
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
