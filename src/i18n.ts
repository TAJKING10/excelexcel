import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      "welcome": "Welcome",
      "login": "Login",
      "logout": "Logout",
      "email": "Email",
      "password": "Password",
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "close": "Close",
      "search": "Search",
      "filter": "Filter",
      "export": "Export",
      "download": "Download",
      "upload": "Upload",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "info": "Information",
      "confirm": "Confirm",
      "yes": "Yes",
      "no": "No",

      // Navigation
      "dashboard": "Dashboard",
      "payslips": "Payslips",
      "profile": "Profile",
      "settings": "Settings",
      "users": "Users",
      "companies": "Companies",
      "employees": "Employees",
      "reports": "Reports",
      "analytics": "Analytics",

      // Payslip related
      "monthlyPayslip": "Monthly Payslip",
      "annualPayslip": "Annual Payslip",
      "createPayslip": "Create Payslip",
      "viewPayslip": "View Payslip",
      "downloadPayslip": "Download Payslip",
      "payslipDetails": "Payslip Details",
      "grossSalary": "Gross Salary",
      "netSalary": "Net Salary",
      "deductions": "Deductions",
      "bonuses": "Bonuses",
      "period": "Period",

      // User related
      "firstName": "First Name",
      "lastName": "Last Name",
      "fullName": "Full Name",
      "role": "Role",
      "status": "Status",
      "active": "Active",
      "inactive": "Inactive",
      "admin": "Administrator",
      "employee": "Employee",

      // Messages
      "loginSuccess": "Login successful",
      "loginError": "Login failed. Please check your credentials.",
      "dataLoaded": "Data loaded successfully",
      "dataError": "Error loading data",
      "saveSuccess": "Saved successfully",
      "saveError": "Error saving data",
      "deleteSuccess": "Deleted successfully",
      "deleteError": "Error deleting data",
    }
  },
  fr: {
    translation: {
      // Common
      "welcome": "Bienvenue",
      "login": "Connexion",
      "logout": "Déconnexion",
      "email": "Email",
      "password": "Mot de passe",
      "submit": "Soumettre",
      "cancel": "Annuler",
      "save": "Enregistrer",
      "delete": "Supprimer",
      "edit": "Modifier",
      "close": "Fermer",
      "search": "Rechercher",
      "filter": "Filtrer",
      "export": "Exporter",
      "download": "Télécharger",
      "upload": "Téléverser",
      "back": "Retour",
      "next": "Suivant",
      "previous": "Précédent",
      "loading": "Chargement...",
      "error": "Erreur",
      "success": "Succès",
      "warning": "Avertissement",
      "info": "Information",
      "confirm": "Confirmer",
      "yes": "Oui",
      "no": "Non",

      // Navigation
      "dashboard": "Tableau de bord",
      "payslips": "Fiches de paie",
      "profile": "Profil",
      "settings": "Paramètres",
      "users": "Utilisateurs",
      "companies": "Entreprises",
      "employees": "Employés",
      "reports": "Rapports",
      "analytics": "Analytique",

      // Payslip related
      "monthlyPayslip": "Fiche de paie mensuelle",
      "annualPayslip": "Fiche de paie annuelle",
      "createPayslip": "Créer une fiche de paie",
      "viewPayslip": "Voir la fiche de paie",
      "downloadPayslip": "Télécharger la fiche de paie",
      "payslipDetails": "Détails de la fiche de paie",
      "grossSalary": "Salaire brut",
      "netSalary": "Salaire net",
      "deductions": "Déductions",
      "bonuses": "Primes",
      "period": "Période",

      // User related
      "firstName": "Prénom",
      "lastName": "Nom",
      "fullName": "Nom complet",
      "role": "Rôle",
      "status": "Statut",
      "active": "Actif",
      "inactive": "Inactif",
      "admin": "Administrateur",
      "employee": "Employé",

      // Messages
      "loginSuccess": "Connexion réussie",
      "loginError": "Échec de la connexion. Veuillez vérifier vos identifiants.",
      "dataLoaded": "Données chargées avec succès",
      "dataError": "Erreur lors du chargement des données",
      "saveSuccess": "Enregistré avec succès",
      "saveError": "Erreur lors de l'enregistrement",
      "deleteSuccess": "Supprimé avec succès",
      "deleteError": "Erreur lors de la suppression",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
