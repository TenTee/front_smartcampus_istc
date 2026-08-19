import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import GradeIcon from '@mui/icons-material/Grade';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentsIcon from '@mui/icons-material/Payments';
import ClassIcon from '@mui/icons-material/Class';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuizIcon from '@mui/icons-material/Quiz';

export const routes = [
  {
    label: 'Tableau de bord',
    path: '/dashboard',
    icon: HomeIcon,
    permission: 'all',
  },
  {
    label: 'Étudiants',
    path: '/students',
    icon: PeopleIcon,
    permission: 'all',
  },
  {
    label: 'Enseignants',
    path: '/formateurs',
    icon: PersonIcon,
    permission: 'all',
  },
  {
    label: 'Pédagogie',
    icon: MenuBookIcon,
    permission: 'all',
    children: [
      {
        label: 'Structure Académique',
        path: '/pedagogy',
        icon: SchoolIcon,
        permission: 'all',
      },
      {
        label: 'Cours',
        path: '/modules',
        icon: MenuBookIcon,
        permission: 'all',
      },
      
      {
        label: 'Notes',
        path: '/grades',
        icon: GradeIcon,
        permission: 'all',
      },
      {
        label: 'Emploi du temps',
        path: '/schedule',
        icon: AccessTimeIcon,
        permission: 'all',
      },
      {
        label: 'Banque d\'épreuves',
        path: '/exams-bank',
        icon: MenuBookIcon,
        permission: 'all',
      },
      {
        label: 'Assiduité',
        path: '/attendance',
        icon: CalendarTodayIcon,
        permission: 'all',
      }
    ]
  },
  {
    label: 'Finances',
    icon: AttachMoneyIcon,
    permission: 'admin',
    children: [
      {
        label: 'Aperçu global',
        path: '/finances',
        icon: AttachMoneyIcon,
        permission: 'admin',
      },
      {
        label: 'Préinscriptions',
        path: '/finances/preinscriptions',
        icon: PersonIcon,
        permission: 'admin',
      },
      {
        label: 'Scolarité',
        path: '/finances/scolarite',
        icon: AttachMoneyIcon,
        permission: 'admin',
      },
      {
        label: 'Salaires Personnel',
        path: '/finances/salaires-personnel',
        icon: PaymentsIcon,
        permission: 'admin',
      },
      {
        label: 'Salaires Formateurs',
        path: '/finances/salaires-formateurs',
        icon: PaymentsIcon,
        permission: 'admin',
      }
    ]
  },
  {
    label: 'Inventaire',
    path: '/inventory',
    icon: InventoryIcon,
    permission: 'all',
  },

  {
    label: 'Personnel',
    icon: BadgeIcon,
    permission: 'all',
    children: [
      {
        label: 'Liste du personnel',
        path: '/staff',
        icon: PersonIcon,
        permission: 'all',
      },
      {
        label: 'Congés et absences',
        path: '/leaves',
        icon: FlightTakeoffIcon,
        permission: 'all',
      }
    ]
  },
];

export const bottomRoutes = [
  {
    label: 'Système',
    path: '/system',
    icon: SecurityIcon,
    permission: 'admin',
  },
];

export const formateurRoutes = [
  {
    label: 'Tableau de bord',
    path: '/formateur-portal',
    icon: HomeIcon,
  },
  {
    label: 'Mes Classes',
    path: '/formateur-portal/classes',
    icon: ClassIcon,
  },
  {
    label: 'Saisie des Notes',
    path: '/formateur-portal/notes',
    icon: GradeIcon,
  },
  {
    label: 'Emploi du temps',
    path: '/formateur-portal/schedule',
    icon: AccessTimeIcon,
  },
  {
    label: 'Mes Cours',
    path: '/formateur-portal/cours',
    icon: UploadFileIcon,
  },
  {
    label: 'Épreuves',
    path: '/formateur-portal/epreuves',
    icon: QuizIcon,
  },
  {
    label: 'Mon Suivi',
    path: '/formateur-portal/suivi',
    icon: AssessmentIcon,
  },
];

export const studentRoutes = [
  {
    label: 'Tableau de bord',
    path: '/portal',
    icon: HomeIcon,
  },
  {
    label: 'Ma Scolarité',
    path: '/portal/finance',
    icon: AttachMoneyIcon,
  },
  {
    label: 'Mes Notes',
    path: '/portal/grades',
    icon: GradeIcon,
  },
  {
    label: 'Assiduité',
    path: '/portal/attendance',
    icon: CalendarTodayIcon,
  },
  {
    label: 'Emploi du temps',
    path: '/portal/schedule',
    icon: AccessTimeIcon,
  },
  {
    label: 'Documents de cours',
    path: '/portal/cours',
    icon: UploadFileIcon,
  },
  {
    label: 'Banque d\'épreuves',
    path: '/portal/exams-bank',
    icon: MenuBookIcon,
  },
  {
    label: 'Discipline',
    path: '/portal/discipline',
    icon: SecurityIcon,
  },
];
