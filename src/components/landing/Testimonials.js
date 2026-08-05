"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

const testimonials = [
  {
    name: "Marie-Claire Ngo",
    role: "Directrice - Lycée Bilingue de Yaoundé",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    content:
      "Smart Campus a révolutionné notre gestion scolaire. Les parents reçoivent maintenant les bulletins en temps réel, et notre suivi financier est impeccable.",
    rating: 5,
  },
  {
    name: "Dr. Joseph Mbarga",
    role: "Proviseur - Collège Saint-Paul de Douala",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content:
      "L'intelligence artificielle de Smart Campus nous aide à identifier précocement les difficultés des élèves. Nos résultats ont augmenté de 25% cette année.",
    rating: 5,
  },
  {
    name: "Sophie Abega",
    role: "Enseignante - École Primaire Excellence",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    content:
      "La communication avec les parents est désormais fluide. Plus besoin de réunions interminables, tout se fait via la plateforme.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: "#FFFFFF",
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "#193A7F",
              mb: 2,
              fontSize: { xs: "2rem", md: "2.8rem" },
            }}
          >
            Ils nous font confiance
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#666666",
              fontWeight: 300,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Découvrez comment Smart Campus transforme la gestion scolaire au
            Cameroun
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid rgba(25, 58, 127, 0.1)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0px 12px 32px rgba(25, 58, 127, 0.15)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                  >
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon
                        key={i}
                        sx={{ color: "#FF9800", fontSize: "1.2rem" }}
                      />
                    ))}
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "#555555",
                      lineHeight: 1.6,
                      mb: 3,
                      fontStyle: "italic",
                    }}
                  >
                    "{testimonial.content}"
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Avatar
                      src={testimonial.image}
                      alt={testimonial.name}
                      sx={{
                        width: 60,
                        height: 60,
                        border: "3px solid #FF9800",
                      }}
                    />
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          color: "#193A7F",
                        }}
                      >
                        {testimonial.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.85rem",
                        }}
                      >
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            mt: 8,
            p: 4,
            backgroundColor: "#193A7F",
            borderRadius: "16px",
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
            📈 Impact Mesuré
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#FF9800" }}
              >
                +40%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Réduction du temps administratif
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#FF9800" }}
              >
                +25%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Amélioration des résultats scolaires
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#FF9800" }}
              >
                98%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Satisfaction des utilisateurs
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
