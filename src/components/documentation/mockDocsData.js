export const docCategories = [
  { id: "all", label: "Tous les documents", icon: "Apps" },
  { id: "guides", label: "Guides & Manuels", icon: "MenuBook" },
  { id: "reglements", label: "Règlements & Textes", icon: "Gavel" },
  { id: "finances", label: "Finances & Tarifs", icon: "AccountBalance" },
  { id: "formulaires", label: "Formulaires & Procédures", icon: "Assignment" },
  { id: "technique", label: "Support & Technique", icon: "Build" },
];

export const mockDocuments = [
  {
    id: "doc-1",
    title: "Guide de bienvenue & Manuel de l'Étudiant SmartCampus",
    category: "guides",
    categoryLabel: "Guides & Manuels",
    format: "PDF",
    size: "2.4 Mo",
    updatedDate: "15 Janvier 2026",
    readingTime: "8 min",
    badge: "OFFICIEL",
    badgeColor: "#2563EB",
    description: "Manuel complet expliquant l'accès au portail étudiant, la consultation des notes, l'emploi du temps en temps réel et la gestion des réclamations.",
    targetAudience: "Étudiants, Parents, Nouveaux Inscrits",
    version: "v3.2",
    summary: [
      "Activation et sécurisation du compte étudiant SmartCampus.",
      "Consultation des notes de CC, TP et Examens de synthèse.",
      "Suivi des présences et justification d'absences en ligne.",
      "Accès aux cours téléchargeables et ressources bibliothécaires.",
      "Paiement des tranches de scolarité via Mobile Money / Carte."
    ],
    tableOfContents: [
      "1. Introduction & Présentation de l'Écosystème SmartCampus",
      "2. Premiers pas : Connexion et Configuration de profil",
      "3. Module Académique (Emploi du temps & Notes)",
      "4. Module Financier & Justificatifs de Paiement",
      "5. Assistance & Contacts utiles"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-2",
    title: "Règlement Intérieur & Charte de Conduite Académique",
    category: "reglements",
    categoryLabel: "Règlements & Textes",
    format: "PDF",
    size: "1.8 Mo",
    updatedDate: "10 Octobre 2025",
    readingTime: "12 min",
    badge: "OBLIGATOIRE",
    badgeColor: "#DC2626",
    description: "Document officiel régissant les règles de présence, de discipline, les principes de civisme et les modalités d'évaluation au sein de l'établissement.",
    targetAudience: "Ensemble du personnel et des étudiants",
    version: "v2025-2026",
    summary: [
      "Règles d'assiduité, retards et motifs d'absence autorisés.",
      "Directives relatives à la tenue et au comportement sur le campus.",
      "Politique anti-plagiat et sanctions disciplinaires.",
      "Utilisation des équipements informatiques et matériels de laboratoire.",
      "Modalités d'organisation des contrôles continus et épreuves de synthèse."
    ],
    tableOfContents: [
      "Titre I : Dispositions Générales",
      "Titre II : Assiduité et Ponctualité",
      "Titre III : Discipline et Sanctions",
      "Titre IV : Évaluations Académiques & Conseil de Discipline"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-3",
    title: "Grille Tarifaire & Modalités de Réglement des Frais 2025-2026",
    category: "finances",
    categoryLabel: "Finances & Tarifs",
    format: "PDF",
    size: "1.1 Mo",
    updatedDate: "05 Décembre 2025",
    readingTime: "5 min",
    badge: "FINANCES",
    badgeColor: "#059669",
    description: "Tableau détaillé de la scolarité par filière et cycle (BTS, Licence, Master), calendrier de versement des tranches et moyens de paiement autorisés.",
    targetAudience: "Étudiants, Tuteurs, Service Comptabilité",
    version: "2025-2026",
    summary: [
      "Échéancier de paiement en 3 ou 4 tranches selon la formation.",
      "Modalités d'octroi de bourses d'excellence et réductions d'effectif familial.",
      "Procédures d'émission et de vérification des reçus numérisés.",
      "Frais annexes (Tenues, Assurance, Matériel de laboratoire, Soutenance)."
    ],
    tableOfContents: [
      "1. Tarification globale par spécialité",
      "2. Calendrier d'échéance des tranches de scolarité",
      "3. Guides de paiement via Orange Money, MTN MoMo & Banques",
      "4. Politique d'annulation et pénalités de retard"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-4",
    title: "Manuel d'Utilisation du E-Portal Formateur",
    category: "guides",
    categoryLabel: "Guides & Manuels",
    format: "PDF",
    size: "3.5 Mo",
    updatedDate: "20 Janvier 2026",
    readingTime: "10 min",
    badge: "FORMATEUR",
    badgeColor: "#7C3AED",
    description: "Guide pas-à-pas destiné aux enseignants pour la saisie des notes, le renseignement des cahiers de texte numérisés et l'appel électronique.",
    targetAudience: "Corps Enseignant & Formateurs Vacataires",
    version: "v4.0",
    summary: [
      "Pointage électronique de présence et gestion du cahier de texte.",
      "Saisie sécurisée des notes de CC et examens avec validation automatique des moyennes.",
      "Mise en ligne des supports de cours (PDF, Slides, Dévoirs).",
      "Communication directe avec les délégués et responsables de filières."
    ],
    tableOfContents: [
      "1. Prise en main de l'espace Formateur",
      "2. Gestion des cours et téléversement de supports",
      "3. Module de Saisie des Évaluations & Grilles de notation",
      "4. Statistiques de suivi des étudiants"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-5",
    title: "Formulaire Officiel de Demande d'Attestation & Diplôme",
    category: "formulaires",
    categoryLabel: "Formulaires & Procédures",
    format: "DOCX",
    size: "650 Ko",
    updatedDate: "02 Février 2026",
    readingTime: "3 min",
    badge: "FORMULAIRE",
    badgeColor: "#D97706",
    description: "Fiche téléchargeable et imprimable pour formuler une demande d'attestation de réussite, de relevé de notes officiel ou de duplicata de carte d'étudiant.",
    targetAudience: "Étudiants diplômés ou en cours de cursus",
    version: "v1.5",
    summary: [
      "Informations administratives de l'étudiant.",
      "Pièces à joindre (Quittance de décharge, Copie CNI, Photo).",
      "Délais de traitement (48h pour attestation, 7 jours pour relevé officiel)."
    ],
    tableOfContents: [
      "Section A : Identité du Demandeur",
      "Section B : Type de Document sollicité",
      "Section C : Visa du Service de la Scolarité & Caisse"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-6",
    title: "Guide Technique d'Intégration API & SSO SmartCampus",
    category: "technique",
    categoryLabel: "Support & Technique",
    format: "PDF",
    size: "4.2 Mo",
    updatedDate: "18 Février 2026",
    readingTime: "15 min",
    badge: "DEV / IT",
    badgeColor: "#4B5563",
    description: "Spécification technique des endpoints REST API, authentification JWT, webhooks de synchronisation et architecture des données du portail.",
    targetAudience: "Équipe Informatique, Administrateurs Système",
    version: "v2.1",
    summary: [
      "Authentication OAuth2 / Bearer Token API Key.",
      "Endpoints pour l'extraction des emplois du temps et présences.",
      "Webhooks de notification de paiements en temps réel.",
      "Normes de sécurité, chiffrement SSL et limitations de requêtes (Rate Limiting)."
    ],
    tableOfContents: [
      "1. Architecture Système & Authentification",
      "2. Endpoints Académiques (/api/v1/schedule, /api/v1/grades)",
      "3. Endpoints Financiers & Webhooks",
      "4. Gestion des erreurs et codes HTTP"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-7",
    title: "Charte de Sécurité & Protection des Données Personnelles",
    category: "reglements",
    categoryLabel: "Règlements & Textes",
    format: "PDF",
    size: "1.4 Mo",
    updatedDate: "01 Novembre 2025",
    readingTime: "6 min",
    badge: "CONFORMITÉ",
    badgeColor: "#0284C7",
    description: "Politique de protection des données privées (RGPD / Réglementation Nationale), gestion de la confidentialité des notes et enregistrements vidéos.",
    targetAudience: "Tous les utilisateurs de la plateforme",
    version: "v1.2",
    summary: [
      "Politique de collecte et d'utilisation des données biométriques et académiques.",
      "Droits d'accès, de rectification et de suppression d'informations.",
      "Politique de conservation des archives scolaires."
    ],
    tableOfContents: [
      "1. Périmètre de collecte des données",
      "2. Utilisation et non-divulgation à des tiers",
      "3. Procédure d'exercice du droit d'accès"
    ],
    downloadUrl: "#",
  },
  {
    id: "doc-8",
    title: "Fiche de Préinscription & Candidature 2026-2027",
    category: "formulaires",
    categoryLabel: "Formulaires & Procédures",
    format: "PDF",
    size: "820 Ko",
    updatedDate: "12 Mars 2026",
    readingTime: "4 min",
    badge: "NOUVEAU",
    badgeColor: "#10B981",
    description: "Document d'orientation et formulaire officiel pour les nouveaux bacheliers souhaitant postuler à l'une des filières de l'établissement.",
    targetAudience: "Futurs étudiants, Lycéens",
    version: "2026",
    summary: [
      "Choix des options de filières (Informatique, Gestion, Réseaux, Génie Civil).",
      "Dossier de candidature physique & en ligne.",
      "Calendrier du concours ou de la sélection sur dossier."
    ],
    tableOfContents: [
      "Fiche 1 : Voeux d'orientation académique",
      "Fiche 2 : Relevés du BAC & Bulletins de Terminale",
      "Fiche 3 : Reçu de frais de concours"
    ],
    downloadUrl: "#",
  }
];

export const docFaqs = [
  {
    question: "Comment puis-je télécharger les formulaires administratifs ?",
    answer: "Tous les formulaires officiels (demandes d'attestation, réclamations, préinscription) sont directement téléchargeables au format PDF ou Word depuis cette page. Il vous suffit de cliquer sur le bouton 'Télécharger' présent sur chaque carte de document."
  },
  {
    question: "Les documents présents sur ce portail sont-ils officiels et certifiés ?",
    answer: "Oui, l'ensemble des règlements intérieurs, grilles tarifaires et manuels d'utilisation diffusés sur le Centre de Documentation SmartCampus sont certifiés par la direction académique et régulièrement mis à jour."
  },
  {
    question: "Comment consulter mon règlement intérieur spécifique à ma filière ?",
    answer: "Vous pouvez utiliser la barre de recherche en haut de page en tapant le nom de votre filière ou sélectionner la catégorie 'Règlements & Textes' pour consulter le document cadre et ses annexes."
  },
  {
    question: "Que faire si je ne trouve pas un document spécifique ?",
    answer: "Si le document recherché n'apparaît pas dans les catégories, vous pouvez contacter directement le service de la scolarité via le bouton WhatsApp en haut de page ou envoyer une demande à l'adresse support@smartcampus.cm."
  }
];
