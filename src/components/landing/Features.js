'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SecurityIcon from '@mui/icons-material/Security';

const features = [
  {
    icon: <SchoolIcon sx={{ fontSize: '2.5rem' }} />,
    title: 'Gestion des Étudiants et Inscriptions',
    description: 'Suivi complet des étudiants : inscriptions, dossiers scolaires et listes par formation.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop&crop=face',
    details: [
      'Gestion des inscriptions',
      'Suivi des dossiers étudiants'
    ]
  },
  {
    icon: <MonetizationOnIcon sx={{ fontSize: '2.5rem' }} />,
    title: 'Suivi Financier',
    description: 'Système de gestion financière pour les paiements des frais de scolarité, bourses et transactions liées aux étudiants.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
    details: [
      'Paiements des frais de scolarité',
      'Suivi des transactions',
      'Gestion des bourses'
    ]
  },
  {
    icon: <PeopleIcon sx={{ fontSize: '2.5rem' }} />,
    title: 'Ressources Humaines & Formateurs',
    description: 'Gestion complète du personnel éducatif et administratif, y compris le suivi des congés et des absences.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop&crop=face',
    details: [
      'Dossiers des formateurs et du personnel',
      'Gestion des congés',
      'Suivi des présences'
    ]
  },
  {
    icon: <AssignmentIcon sx={{ fontSize: '2.5rem' }} />,
    title: 'Notes & Modules',
    description: 'Organisation des cours, des formations et suivi des notes et évaluations des étudiants.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop&crop=face',
    details: [
      'Gestion des modules et cours',
      'Suivi des évaluations et notes',
      'Organisation globale de la pédagogie'
    ]
  },
  {
    icon: <BarChartIcon sx={{ fontSize: '2.5rem' }} />,
    title: 'Emplois du Temps & Présences',
    description: 'Planification des cours et suivi de l\'assiduité globale (étudiants et formateurs).',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    details: [
      'Calendrier et emploi du temps',
      'Suivi de l\'assiduité',
      'Planification des sessions'
    ]
  }
];

export default function Features() {
  return (
    <Box
      id="features"
      sx={{
        py: { xs: 6, md: 10 },
        backgroundColor: '#FFFFFF',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: '800',
              color: '#0A2540',
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Fonctionnalités Complètes & Intelligentes
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666666',
              fontWeight: 300,
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            Des outils puissants conçus spécifiquement pour la gestion optimale de votre établissement. Organisez la scolarité, la finance et les ressources humaines au même endroit.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  boxShadow: 'none',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    borderColor: '#CBD5E1',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Box
                    sx={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: '#DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563EB',
                      mb: 3,
                    }}
                  >
                    {feature.icon}
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#0A2540',
                      mb: 2,
                      fontSize: '1.25rem',
                    }}
                  >
                    {feature.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      lineHeight: 1.6,
                      mb: 2,
                    }}
                  >
                    {feature.description}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 'bold',
                        color: '#2563EB',
                        mb: 1,
                      }}
                    >
                      Fonctionnalités clés :
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {feature.details.map((detail, idx) => (
                        <Typography
                          key={idx}
                          component="li"
                          variant="body2"
                          sx={{
                            color: '#555555',
                            lineHeight: 1.5,
                            mb: 0.5,
                          }}
                        >
                          {detail}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
