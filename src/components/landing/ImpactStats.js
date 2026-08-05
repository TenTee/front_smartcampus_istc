"use client";

import React from "react";
import { Box, Container, Grid, Typography, Paper } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const stats = [
  {
    icon: <SchoolIcon sx={{ fontSize: "2.5rem", color: "#2563EB" }} />,
    value: "50+",
    label: "Écoles Partenaires",
  },
  {
    icon: <PeopleIcon sx={{ fontSize: "2.5rem", color: "#2563EB" }} />,
    value: "10 000+",
    label: "Étudiants Gérés",
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: "2.5rem", color: "#2563EB" }} />,
    value: "40%",
    label: "De Temps Gagné",
  },
  {
    icon: <SecurityIcon sx={{ fontSize: "2.5rem", color: "#2563EB" }} />,
    value: "100%",
    label: "Sécurisé & Local",
  },
];

export default function ImpactStats() {
  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: "center",
                  p: 3,
                  backgroundColor: "transparent",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{stat.icon}</Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "800",
                    color: "#0A2540",
                    mb: 1,
                    fontSize: { xs: "2rem", md: "2.5rem" },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#64748B",
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
