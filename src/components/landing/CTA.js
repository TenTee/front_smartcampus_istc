"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();

  const contactMethods = [
    {
      icon: <PhoneIcon sx={{ fontSize: "2rem", color: "#2563EB" }} />,
      title: "Appel Direct",
      content: "+237 692 563 086",
      action: "tel:+237692563086",
    },
    {
      icon: <EmailIcon sx={{ fontSize: "2rem", color: "#2563EB" }} />,
      title: "Email",
      content: "support@tenteeglobal.com",
      action: "mailto:support@tenteeglobal.com",
    },
  ];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: "#FFFFFF",
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
            Prêt à Transformer Votre Établissement ?
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
            Rejoignez les établissements camerounais qui font confiance à Smart
            Campus
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {contactMethods.map((method, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  boxShadow: "none",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "#CBD5E1",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    transform: "translateY(-4px)"
                  },
                }}
                component="a"
                href={method.action}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{method.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: "#0A2540",
                      mb: 1,
                    }}
                  >
                    {method.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#2563EB",
                      fontWeight: "bold",
                    }}
                  >
                    {method.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Button
            variant="contained"
            size="large"
            disableElevation
            sx={{
              backgroundColor: "#2563EB",
              color: "white",
              fontWeight: "bold",
              py: 1.8,
              px: 4,
              borderRadius: "8px",
              fontSize: "1.1rem",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
            onClick={() => router.push("/login")}
          >
            Accéder au Portail
            <ArrowForwardIcon sx={{ ml: 1 }} />
          </Button>
        </Box>

        <Box
          sx={{
            p: 4,
            backgroundColor: "#F8FAFC",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#0A2540",
              fontWeight: "800",
              mb: 2,
            }}
          >
            Offre Spéciale - Programme Early Bird
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#666666",
              lineHeight: 1.8,
              mb: 2,
            }}
          >
            Bénéficiez de <strong>-15% la première année</strong> sur les tarifs de Smart
            Campus. Les premiers établissements camerounais à nous rejoindre
            profitent de conditions exceptionnelles.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#2563EB",
              fontWeight: "bold",
            }}
          >
            Offre limitée aux 50 premiers établissements
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
