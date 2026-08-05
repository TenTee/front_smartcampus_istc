# Documentation des Endpoints de l'API SmartCampus

Ce fichier liste  les appels d'API extraits du projet frontend `smartCampus`, avec leurs méthodes HTTP, leurs rôles et une description pour faciliter leur réutilisation dans un autre projet.

---

baseURL: 'https://apismart.ifpt.dev/',

## 1. Assiduité (`/api/assiduite/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/assiduite/` | Lister | Récupère la liste des présences et absences. Accepte des paramètres de filtrage. |
| **POST** | `/api/assiduite/` | Créer | Enregistre une nouvelle assiduité. |
| **PUT** | `/api/assiduite/{id}/` | Mettre à jour | Modifie une assiduité existante via son identifiant. |
| **DELETE** | `/api/assiduite/{id}/` | Supprimer | Supprime une assiduité spécifique. |

---

## 2. Authentification (`/api/auth/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **POST** | `/api/auth/login/` | Connexion | Connecte un utilisateur (username/password) et renvoie les tokens `access` et `refresh`. |

---

## 3. Congés (`/api/conges/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/conges/` | Lister | Récupère la liste complète de tous les congés. |
| **POST** | `/api/conges/` | Créer | Crée une nouvelle demande de congé. |
| **PUT** | `/api/conges/{id}/` | Mettre à jour | Modifie une demande de congé existante. |
| **DELETE** | `/api/conges/{id}/` | Supprimer | Supprime un congé. |

---

## 4. Demandes et Demandeurs (`/api/demandes/`, `/api/demandeurs/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/demandes/` | Lister | Récupère les demandes (d'articles, etc.) avec filtres potentiels. |
| **POST** | `/api/demandes/` | Créer | Crée une demande (fournir `article_id`, `demandeur_content_type`, `demandeur_object_id`, `statut`). |
| **PUT** | `/api/demandes/{id}/` | Mettre à jour | Met à jour le statut ou d'autres infos d'une demande. |
| **DELETE** | `/api/demandes/{id}/` | Supprimer | Supprime une demande. |
| **GET** | `/api/demandeurs/` | Lister Demandeurs| Récupère la liste de tous les demandeurs (Formateurs + Personnel). |

---

## 5. Dépenses (`/api/depenses/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/depenses/` | Lister | Récupère la liste des dépenses financières. |
| **POST** | `/api/depenses/` | Créer | Enregistre une nouvelle dépense. |
| **PUT** | `/api/depenses/{id}/` | Mettre à jour | Modifie une dépense existante. |
| **DELETE** | `/api/depenses/{id}/` | Supprimer | Supprime une dépense. |

---

## 6. Emploi du temps (`/api/emploi-du-temps/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/emploi-du-temps/` | Lister | Récupère tous les emplois du temps. |
| **POST** | `/api/emploi-du-temps/` | Créer | Crée une nouvelle entrée pour l'emploi du temps. |
| **PUT** | `/api/emploi-du-temps/{id}/` | Mettre à jour | Met à jour une entrée d'emploi du temps. |
| **DELETE** | `/api/emploi-du-temps/{id}/` | Supprimer | Supprime une entrée d'emploi du temps. |

---

## 7. Étudiants (`/api/etudiants/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/etudiants/` | Lister | Récupère la liste des étudiants (supporte des paramètres ex: `filiere`, `module`). |
| **POST** | `/api/etudiants/` | Créer | Ajoute un nouvel étudiant. |
| **PUT** | `/api/etudiants/{id}/` | Mettre à jour | Modifie les données d'un étudiant. |
| **DELETE** | `/api/etudiants/{id}/` | Supprimer | Supprime un étudiant. |
| **GET** | `/api/etudiants/{id}/export-documents/`| Exporter | Exporte les documents d'un étudiant sous forme d'archive ZIP. |
| **POST** | `/api/etudiants/{id}/documents/` | Uploader | Upload un fichier/document (`multipart/form-data`) pour un étudiant. |

---

## 8. Formateurs (`/api/formateurs/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/formateurs/` | Lister | Récupère les formateurs (supporte filtrage ex: `specialite`). |
| **POST** | `/api/formateurs/` | Créer | Ajoute un nouveau formateur. |
| **PUT** | `/api/formateurs/{id}/` | Mettre à jour | Modifie un formateur existant. |
| **DELETE** | `/api/formateurs/{id}/` | Supprimer | Supprime un formateur. |

---

## 9. Formations et Niveaux (`/api/formations/`, `/api/niveaux/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/formations/` | Lister | Récupère toutes les formations (URL complète: `https://apismart.ifpt.dev/api/formations/`). |
| **GET** | `/api/formations/{id}/` | Détail | Récupère une formation spécifique par ID. |
| **POST** | `/api/formations/` | Créer | Crée une nouvelle formation. |
| **PUT** | `/api/formations/{id}/` | Mettre à jour | Modifie une formation. |
| **DELETE** | `/api/formations/{id}/` | Supprimer | Supprime une formation. |
| **PATCH** | `/api/niveaux/{id}/` | Modifier Niveau | Met à jour partiellement un niveau (`https://apismart.ifpt.dev/api/niveaux/{id}/`). |

---

## 10. Inscriptions (`/api/inscriptions/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **POST** | `/api/inscriptions/` | Créer | Inscrit un étudiant à un niveau et une année académique. |

---

## 11. Inventaire (`/api/inventaires/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/inventaires/` | Lister | Récupère la liste brute des articles dispos. |
| **POST** | `/api/inventaires/` | Créer | Ajoute un ou plusieurs articles. La `reference` est auto-générée. |
| **PUT** | `/api/inventaires/{id}/` | Mettre à jour | Modifie les informations d'un article existant. |
| **DELETE** | `/api/inventaires/{id}/` | Supprimer | Supprime un article de l'inventaire. |

---

## 12. Modules (`/api/modules/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/modules/` | Lister | Récupère tous les modules d'enseignement (`https://apismart.ifpt.dev/api/modules/`). |
| **GET** | `/api/modules/{id}/` | Détail | Récupère un module par ID. |
| **POST** | `/api/modules/` | Créer | Ajoute un nouveau module. |
| **PUT** | `/api/modules/{id}/` | Mettre à jour | Modifie un module existant. |
| **DELETE** | `/api/modules/{id}/` | Supprimer | Supprime un module. |

---

## 13. Notes (`/api/notes/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/notes/` | Lister | Liste des notes. Si `summary=true`, renvoie la moyenne générale + mention. |
| **GET** | `/api/notes/{etudiantId}/details/` | Détail Étudiant| Détails des notes d'un étudiant pour tous les modules (selon `session`). |
| **GET** | `/api/notes/par-module/` | Par module | Liste des étudiants et leurs notes pour un `module_id` spécifique et `session`. |
| **GET** | `/api/notes/par-filiere/` | Par formation | Notes finales de tous les étudiants dans chaque module d'une `filiere_id`. |
| **GET** | `/api/notes/par-filiere-niveau/` | Classement | Données des notes par niveau avec classement pour une `filiere_id`. |
| **POST** | `/api/notes/` | Créer | Ajoute une nouvelle note (souvent un tableau d'évaluations/devoirs). |
| **PUT** | `/api/notes/{id}/` | Mettre à jour | Modifie une note. |
| **DELETE** | `/api/notes/{id}/` | Supprimer | Supprime une note. |

---

## 14. Paie (`/api/paie/paies/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/paie/paies/` | Lister | Récupère toutes les fiches de paies/paiements salaires. |
| **POST** | `/api/paie/paies/` | Créer | Crée une nouvelle paie avec upload de justificatif (`multipart/form-data`). |
| **PUT** | `/api/paie/paies/{id}/` | Mettre à jour | Modifie une paie via un payload `multipart/form-data`. |
| **DELETE** | `/api/paie/paies/{id}/` | Supprimer | Supprime une paie de la base de données. |

---

## 15. Paiements (`/api/paiements/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/paiements/` | Historique | Récupère la liste complète (historique détaillé) des paiements de scolarité. |
| **GET** | `/api/paiements/aggregated/` | Agrégé | Liste condensée des paiements (une seule ligne par étudiant/formation). |
| **POST** | `/api/paiements/` | Créer | Enregistre un nouveau paiement. |
| **PUT** | `/api/paiements/{id}/` | Mettre à jour | Modifie l'information d'un paiement. |
| **DELETE** | `/api/paiements/{id}/` | Supprimer | Annule/Supprime un paiement d'étudiant. |

---

## 16. Personnel (`/api/personnels/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/personnels/` | Lister | Récupère la liste (staff, administration, ressource humaine, etc.). |
| **POST** | `/api/personnels/` | Créer | Ajoute un membre du personnel. |
| **PUT** | `/api/personnels/{id}/` | Mettre à jour | Modifie les infos du personnel. |
| **DELETE** | `/api/personnels/{id}/` | Supprimer | Supprime un personnel de la BDD. |

---

## 17. Revenus (`/api/revenus/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/revenus/` | Lister | Liste tous les autres revenus (non-scolarité). |
| **POST** | `/api/revenus/` | Créer | Enregistre un revenu avec un éventuel reçu/fichier (`multipart/form-data`). |
| **PUT** | `/api/revenus/{id}/` | Mettre à jour | Met à jour une entrée de revenu (`multipart/form-data`). |
| **DELETE** | `/api/revenus/{id}/` | Supprimer | Supprime un revenu. |

---

## 18. Utilisateurs et Rôles (`/api/users/`, `/api/users/roles/`)
| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| **GET** | `/api/users/` | Lister | Récupère tous les comptes d'utilisateurs. |
| **POST** | `/api/users/` | Créer | Création d'un nouvel utilisateur système. |
| **PUT** | `/api/users/{id}/` | Mettre à jour | Modifie les identifiants/informations. |
| **DELETE** | `/api/users/{id}/` | Supprimer | Supprime un utilisateur. |
| **POST** | `/api/users/{id}/reset-password/` | Réinitialiser | Force la réinitialisation du mot de passe de l'utilisateur. |
| **GET** | `/api/users/roles/` | Lister Rôles | Liste les rôles applicatifs et permissions. |
| **POST** | `/api/users/roles/` | Créer Rôle | Définit un niveau d'accès/rôle inédit. |
| **PUT** | `/api/users/roles/{id}/` | Mettre à jour | Met une liste de permissions à jour pour le rôle donné. |
| **DELETE** | `/api/users/roles/{id}/` | Supprimer | Efface un rôle spécifique. |
