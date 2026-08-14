import React from 'react';
import { parametresGlobauxService } from '../../services/api/services';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,Alert ,
  CircularProgress
} from '@mui/material';

export default function GradeFormModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  formErrors,
  submitting,
  students,
  modules,
  classes
}) {
  const filteredModules = React.useMemo(() => {
    if (!form.etudiant) return modules;
    const student = students.find(s => Number(s.id) === Number(form.etudiant));
    if (!student) return modules;

    // Get the class ID from the student's latest inscription
    const latestInscription = student.inscriptions?.[0];
    const classeId = latestInscription?.classe;
    
    if (!classeId) return modules;

    return modules.filter(m => {
      const isLinkedToClasse = (m.attributions || []).some(attr => Number(attr.classe_id) === Number(classeId));
      
      // Also check if linked via CourseAssignment path (Filiere/Cycle/Niveau)
      const isLinkedViaPath = (m.attributions || []).some(attr => 
        attr.filiere_nom === latestInscription.filiere_nom &&
        attr.cycle_nom === latestInscription.cycle_nom &&
        attr.niveau_nom === latestInscription.niveau_nom
      );

      return isLinkedToClasse || isLinkedViaPath;
    });
  }, [form.etudiant, students, modules]);



  const [ccMax, setCcMax] = React.useState(30);
  const [snMax, setSnMax] = React.useState(70);

  React.useEffect(() => {
    let mounted = true;
    parametresGlobauxService.getStats().then((res) => {
      if (!res) return;
      if (mounted) {
        setCcMax(res.pourcentage_cc ?? 30);
        setSnMax(res.pourcentage_sn ?? 70);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{form.id ? 'Modifier les notes' : 'Ajouter des notes'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>

          <Grid item xs={12}>
  <Alert severity="info">
    Saisir la note CC sur {ccMax} et la note SN sur {snMax} — la note finale sera calculée sur 100.
  </Alert>
</Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.etudiant)}>
              
              <InputLabel>Étudiant</InputLabel>
              <Select
                value={form.etudiant || ''}
                label="Étudiant"
                onChange={(e) => {
                  const val = e.target.value;
                  const student = students.find(s => Number(s.id) === Number(val));
                  const classeId = student?.inscriptions?.[0]?.classe || '';
                  setForm({ ...form, etudiant: val, classe: classeId, module: '' });
                }}
              >
                {students?.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nom} {s.prenom ? s.prenom : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.module)}>
              <InputLabel>Matière</InputLabel>
              <Select
                value={form.module || ''}
                label="Matière"
                onChange={(e) => setForm({ ...form, module: e.target.value })}
              >
                {filteredModules?.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.intitule || m.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
         
          <Grid item xs={12} sm={6}>
            <TextField
  fullWidth
  size="small"
  type="number"
  label={`Note CC (/${ccMax})`}
  placeholder={`Ex: ${Math.max(0, (ccMax/2).toFixed(2))}`}
  inputProps={{ min: 0, max: ccMax, step: 0.25 }}
  helperText={formErrors.note_cc || `Note sur ${ccMax}`}
  value={form.note_cc !== undefined && form.note_cc !== null && !Number.isNaN(form.note_cc) ? form.note_cc : ''}
  onChange={(e) => {
    let valStr = e.target.value;
    if (valStr === '') {
      setForm({ ...form, note_cc: '' });
      return;
    }
    let value = parseFloat(valStr);
    if (!isNaN(value)) {
      if (value > ccMax) value = ccMax;
      if (value < 0) value = 0;
      setForm({ ...form, note_cc: value });
    }
  }}
  error={Boolean(formErrors.note_cc)}
/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
  fullWidth
  size="small"
  type="number"
  label={`Note SN (/${snMax})`}
  placeholder={`Ex: ${Math.max(0, (snMax/2).toFixed(2))}`}
  inputProps={{ min: 0, max: snMax, step: 0.25 }}
  helperText={formErrors.note_sn || `Note sur ${snMax}`}
  value={form.note_sn !== undefined && form.note_sn !== null && !Number.isNaN(form.note_sn) ? form.note_sn : ''}
  onChange={(e) => {
    let valStr = e.target.value;
    if (valStr === '') {
      setForm({ ...form, note_sn: '' });
      return;
    }
    let value = parseFloat(valStr);
    if (!isNaN(value)) {
      if (value > snMax) value = snMax;
      if (value < 0) value = 0;
      setForm({ ...form, note_sn: value });
    }
  }}
  error={Boolean(formErrors.note_sn)}
/>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onSave} disabled={submitting}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
