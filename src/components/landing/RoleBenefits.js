"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from "@mui/material";
import AssuredWorkloadIcon from "@mui/icons-material/AssuredWorkload";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const rolesData = [
  {
    id: "directors",
    label: "Pour les Directeurs",
    icon: <AssuredWorkloadIcon />,
    title: "Pilotez votre établissement avec une vision claire",
    description: "Obtenez un contrôle total sur l'administration, les finances et la pédagogie depuis un seul tableau de bord.",
    benefits: [
      "Suivi financier en temps réel et relances automatiques",
      "Vue d'ensemble sur l'assiduité et les performances globales",
      "Gestion centralisée du personnel (congés, absences)",
      "Rapports détaillés d'aide à la décision"
    ],
    image: "/nqobile-vundla-zOt6a59k2BE-unsplash.jpg",
  },
  {
    id: "teachers",
    label: "Pour les Enseignants",
    icon: <MenuBookIcon />,
    title: "Libérez-vous des tâches chronophages",
    description: "Concentrez-vous sur l'essentiel : transmettre le savoir. Smart Campus simplifie tout le reste.",
    benefits: [
      "Saisie rapide des notes et calcul automatique des moyennes",
      "Appel en ligne fluide en quelques clics",
      "Partage de ressources et supports de cours",
      "Communication directe avec les parents"
    ],
    image: "/study-group-african-people (3).jpg",
  },
  {
    id: "parents",
    label: "Pour Parents & Étudiants",
    icon: <FamilyRestroomIcon />,
    title: "Un suivi scolaire transparent et rassurant",
    description: "Restez connectés à la vie de l'établissement et suivez la progression académique à tout moment.",
    benefits: [
      "Accès aux bulletins de notes et historiques",
      "Consultation de l'emploi du temps à jour en temps réel",
      "Notification immédiate en cas d'absence",
      "Paiement des frais de scolarité en ligne (Mobile Money)"
    ],
    image: "/close-up-father-teaching-kid-write.jpg",
  }
];

export default function RoleBenefits() {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const activeData = rolesData[activeTab];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: "#F1F5F9",
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
            Une Solution, Plusieurs Gagnants
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
            Smart Campus est conçu pour faciliter le quotidien de toutes les parties prenantes de votre établissement.
          </Typography>
        </Box>

        <Box sx={{ width: '100%', mb: 6 }}>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: { xs: 'flex-start', sm: 'center' },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#2563EB',
                height: '4px',
                borderRadius: '4px 4px 0 0',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 'bold',
                color: '#64748B',
                minHeight: '60px',
                '&.Mui-selected': {
                  color: '#2563EB',
                },
              }
            }}
          >
            {rolesData.map((role) => (
              <Tab 
                key={role.id} 
                icon={role.icon} 
                iconPosition="start" 
                label={role.label} 
              />
            ))}
          </Tabs>
        </Box>

        <Card 
          sx={{ 
            borderRadius: "24px", 
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            overflow: "hidden",
            border: "none",
          }}
        >
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  p: { xs: 4, md: 6 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: "800", color: "#0A2540", mb: 2 }}>
                  {activeData.title}
                </Typography>
                <Typography variant="body1" sx={{ color: "#475569", mb: 4, fontSize: "1.1rem" }}>
                  {activeData.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeData.benefits.map((benefit, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <CheckCircleOutlineIcon sx={{ color: "#10B981", mt: 0.2 }} />
                      <Typography variant="body1" sx={{ color: "#1E293B", fontWeight: 500 }}>
                        {benefit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={activeData.image}
                alt={activeData.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: "400px",
                  objectFit: "cover",
                }}
              />
            </Grid>
          </Grid>
        </Card>

      </Container>
    </Box>
  );
}
