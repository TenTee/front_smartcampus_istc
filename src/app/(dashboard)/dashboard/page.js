'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { etudiantsService, formateursService, filieresV2Service, revenusService, depensesService, preinscriptionsService } from '../../../services/api/services';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import CardSkeletonGrid from '../../../components/common/CardSkeleton';
import ChartSkeleton from '../../../components/common/ChartSkeleton';
import ErrorState from '../../../components/common/ErrorState';

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function sortByMonth(data) {
  return data.sort((a, b) => {
    const parseKey = (name) => {
      const parts = name.split(' ');
      const monthIdx = MONTH_NAMES.indexOf(parts[0]);
      const year = parseInt(parts[1], 10);
      return year * 12 + monthIdx;
    };
    return parseKey(a.name) - parseKey(b.name);
  });
}

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
          <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="body2" color="success.main" fontWeight="bold">
            Dynamique
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          backgroundColor: `${color}15`,
          p: 1.5,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: color,
        }}
      >
        {icon}
      </Box>
    </CardContent>
  </Card>
);

const EmptyChart = ({ message }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
    <Typography variant="body2">{message}</Typography>
  </Box>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const [kpis, setKpis] = useState({ etudiants: 0, formateurs: 0, filieres: 0 });
  const { selectedYear } = useAcademicYear();

  const [inscriptionsData, setInscriptionsData] = useState([]);
  const [financesData, setFinancesData] = useState([]);
  const [filieresData, setFilieresData] = useState([]);

  useEffect(() => {
    setIsClient(true);
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [etudiantsRes, formateursRes, filieresRes, revenusRes, depensesRes, preinsRes] = await Promise.all([
          etudiantsService.list().catch(() => ({ results: [] })),
          formateursService.list().catch(() => ({ results: [] })),
          filieresV2Service.list().catch(() => ({ results: [] })),
          revenusService.list().catch(() => ({ results: [] })),
          depensesService.list().catch(() => ({ results: [] })),
          preinscriptionsService.list().catch(() => ({ results: [] }))
        ]);

        const etudiants = Array.isArray(etudiantsRes) ? etudiantsRes : etudiantsRes?.results || [];
        const formateurs = Array.isArray(formateursRes) ? formateursRes : formateursRes?.results || [];
        const filieres = Array.isArray(filieresRes) ? filieresRes : filieresRes?.results || [];
        const revenus = Array.isArray(revenusRes) ? revenusRes : revenusRes?.results || [];
        const depenses = Array.isArray(depensesRes) ? depensesRes : depensesRes?.results || [];
        const preinscriptions = Array.isArray(preinsRes) ? preinsRes : preinsRes?.results || [];

        setKpis({
            etudiants: etudiants.length,
            formateurs: formateurs.length,
            filieres: filieres.length
        });

        // Pré-inscriptions par mois
        const monthsCount = {};
        preinscriptions.forEach(p => {
             const dateStr = p.created_at;
             if(dateStr) {
                 const d = new Date(dateStr);
                 const m = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
                 monthsCount[m] = (monthsCount[m] || 0) + 1;
             }
        });

        const lineData = sortByMonth(Object.keys(monthsCount).map(k => ({ name: k, inscriptions: monthsCount[k] })));
        setInscriptionsData(lineData);

        // Flux financier mensuel (Revenus vs Dépenses)
        const finMonthCount = {};
        revenus.forEach(r => {
             if(r.statut !== 'Valide') return;
             const d = new Date(r.date_entree || r.created_at);
             const m = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
             if(!finMonthCount[m]) finMonthCount[m] = { name: m, revenus: 0, depenses: 0 };
             finMonthCount[m].revenus += Number(r.montant);
        });
        depenses.forEach(dep => {
             if(dep.statut !== 'Validee') return;
             const date = new Date(dep.date_depense || dep.created_at);
             const m = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`;
             if(!finMonthCount[m]) finMonthCount[m] = { name: m, revenus: 0, depenses: 0 };
             finMonthCount[m].depenses += Number(dep.montant);
        });

        const barData = sortByMonth(Object.values(finMonthCount));
        setFinancesData(barData);

        // Répartition des étudiants par filière
        const fCount = {};
        etudiants.forEach(e => {
            const fName = e.filiere_details?.nom || 'Non assigné';
            fCount[fName] = (fCount[fName] || 0) + 1;
        });
        const pieData = Object.keys(fCount).map(k => ({ name: k, value: fCount[k] }));
        setFilieresData(pieData);

      } catch (err) {
        setError('Erreur lors du chargement des statistiques.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [selectedYear?.id]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Skip rendering charts on server to prevent mismatch
  if (!isClient) return null; 

  return (
    <Box>
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(90deg, #193A7F 0%, #2A52A1 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Aperçu Global et Statistiques
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          Vue d'ensemble analytique des performances de votre centre de formation.
        </Typography>
      </Paper>

      {error && <ErrorState message={error} onRetry={loadDashboardData} />}

      {loading ? (
        <Box>
          <Box sx={{ mb: 4 }}>
            <CardSkeletonGrid count={3} md={4} />
          </Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <ChartSkeleton height={350} titleWidth="50%" />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartSkeleton height={350} titleWidth="60%" />
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartSkeleton height={300} titleWidth="35%" />
            </Grid>
          </Grid>
        </Box>
      ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Étudiants Inscrits"
                  value={kpis.etudiants}
                  icon={<PeopleIcon fontSize="large" />}
                  color="#FF9800"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Formateurs Actifs"
                  value={kpis.formateurs}
                  icon={<PersonIcon fontSize="large" />}
                  color="#4CAF50"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Filières Opérationnelles"
                  value={kpis.filieres}
                  icon={<SchoolIcon fontSize="large" />}
                  color="#2196F3"
                />
              </Grid>
            </Grid>

            {/* CHARTS ROW 1 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      Flux Financier Mensuel (Revenus vs Dépenses)
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      {financesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={financesData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <RechartsTooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} FCFA`} />
                            <Legend />
                            <Bar dataKey="revenus" name="Revenus Validés" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="depenses" name="Dépenses Validées" fill="#F44336" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart message="Aucune donnée financière validée pour cette période." />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      Répartition des étudiants par filière
                    </Typography>
                    <Box sx={{ height: 350, minWidth: 0 }}>
                      {filieresData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filieresData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {filieresData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart message="Aucun étudiant inscrit pour cette année." />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* CHARTS ROW 2 */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                      Évolution des pré-inscriptions
                    </Typography>
                    <Box sx={{ height: 300, minWidth: 0 }}>
                      {inscriptionsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={inscriptionsData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="inscriptions" name="Candidats Pré-inscrits" stroke="#193A7F" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart message="Aucune pré-inscription enregistrée pour cette période." />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>


          </>
      )}
    </Box>
  );
}
