'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  CircularProgress,
  Paper,
  Stack,
  Button
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GradeIcon from '@mui/icons-material/Grade';
import { etudiantsService } from '../../../services/api/services';
import { useRouter } from 'next/navigation';

import { formatDate } from '../../../utils/formatters';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await etudiantsService.getSituation();
        if (data.etudiant) {
          setStudent(data.etudiant);
          setSituation(data);
        } else {
          // Fallback if the endpoint returns the direct profile (in case of old backend)
          setStudent(data);
        }
      } catch (error) {
        console.error("Erreur profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Impossible de charger votre profil.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>Réessayer</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Bienvenue, {student.nom}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Portail Étudiant Smart Campus
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Avatar 
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
              >
                {student.nom?.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">{student.nom}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>{student.matricule}</Typography>
              <Box sx={{ mt: 2, width: '100%' }}>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Filière</Typography>
                    <Typography variant="caption" fontWeight="bold">{student.filiere_details?.nom || '-'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Classe</Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {student.inscriptions?.[0]?.classe_nom || 'Non assigné'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Contact</Typography>
                    <Typography variant="caption" fontWeight="bold">{student.contact}</Typography>
                  </Box>
                </Stack>
                
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Links / Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {[
              { 
                label: 'Scolarité', 
                icon: AttachMoneyIcon, 
                color: '#4CAF50', 
                desc: situation?.finances?.solde > 0 ? `Reste à payer : ${situation.finances.solde.toLocaleString()} FCFA` : 'Scolarité à jour', 
                link: '/portal/finance' 
              },
              { 
                label: 'Notes & Bulletins', 
                icon: GradeIcon, 
                color: '#2196F3', 
                desc: situation?.notes_summary?.length > 0 ? `${situation.notes_summary.length} note(s) récente(s)` : 'Aucune note', 
                link: '/portal/grades'
              },
              { 
                label: 'Assiduité', 
                icon: CalendarTodayIcon, 
                color: '#FF9800', 
                desc: `${situation?.assiduite?.absences || 0} absence(s), ${situation?.assiduite?.retards || 0} retard(s)`, 
                link: '/portal/attendance' 
              },
              { 
                label: 'Emploi du temps', 
                icon: SchoolIcon, 
                color: '#9C27B0', 
                desc: 'Votre planning hebdomadaire', 
                link: '/portal/schedule' 
              },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper 
                  elevation={0}
                     onClick={() => router.push(item.link)}
                  sx={{ 
                    p: 3, 
                    borderRadius: 4, 
                    border: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${item.color}15`, color: item.color }}>
                    <item.icon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Announcements / Notifications placeholder */}
          <Card sx={{ mt: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Actualités du campus</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Aucune nouvelle annonce pour le moment.</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
