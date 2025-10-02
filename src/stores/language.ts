import { create } from 'zustand'
import i18n from '@/i18n'

export type Language = 'fr' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

// Legacy inline translations kept as a fallback only.
const translations = {
  fr: {
    // Auth
    'auth.title': 'Advensys Paie',
    'auth.username': 'Identifiant',
    'auth.password': 'Mot de passe',
    'auth.login': 'Connexion',
    'auth.error': 'Identifiants invalides',

    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.employees': 'Employés',
    'nav.companies': 'Entreprises',
    'nav.individuals': 'Individus',
    'nav.payslips': 'Fiches de paie',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',

    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.managePayslips': 'Gérer les fiches de paie pour les entreprises et les individus',
    'dashboard.companiesManaged': 'Entreprises que vous gérez',
    'dashboard.totalEmployees': 'Total des employés',
    'dashboard.totalPayslipsCreated': 'Total des fiches de paie créées',
    'dashboard.clientCompanies': 'Entreprises Clientes',
    'dashboard.clientCompaniesDesc': 'Créer et gérer des entreprises, puis ajouter des employés et des fiches de paie',
    'dashboard.viewDetails': 'Voir les Détails',
    'dashboard.quickActions': 'Actions Rapides',
    'dashboard.createCompany': 'Créer une Entreprise',
    'dashboard.viewAllPayslips': 'Voir Toutes les Fiches de Paie',
    'dashboard.addIndividual': 'Ajouter un Individu',
    'dashboard.employees': 'Nombre d\'employés Advensys',
    'dashboard.companies': 'Nombre d\'entreprises',
    'dashboard.payslips': 'Fiches de paie ce mois',
    'dashboard.payroll': 'Masse salariale totale ce mois',

    // Employees
    'employees.title': 'Employés',
    'employees.add': 'Ajouter un employé',
    'employees.name': 'Nom',
    'employees.firstname': 'Prénom',
    'employees.email': 'Email',
    'employees.status': 'Statut',
    'employees.salary': 'Salaire de base',
    'employees.actions': 'Actions',
    'employees.edit': 'Modifier',
    'employees.delete': 'Supprimer',
    'employees.reset': 'Réinitialiser mot de passe',

    // Companies
    'companies.title': 'Entreprises',
    'companies.add': 'Ajouter entreprise',
    'companies.name': 'Nom',
    'companies.details': 'Voir détails',
    'companies.overview': 'Aperçu',
    'companies.analytics': 'Analytique',

    // Individuals
    'individuals.title': 'Individus',
    'individuals.create': 'Créer fiche de paie immédiate',

    // Payslips
    'payslips.title': 'Fiches de paie',
    'payslips.create': 'Créer fiche de paie',
    'payslips.viewAndManage': 'Voir et gérer toutes les fiches de paie',
    'payslips.period': 'Période',
    'payslips.employee': 'Employé',
    'payslips.company': 'Entreprise',
    'payslips.save': 'Enregistrer',
    'payslips.export.pdf': 'Exporter PDF',
    'payslips.export.excel': 'Exporter Excel',

    // Profile
    'profile.title': 'Profil',

    // Common
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.unknown': 'Inconnu',
    'common.search': 'Rechercher...',
    'common.confirm': 'Confirmer',
    'common.close': 'Fermer',
  },
  en: {
    // Auth
    'auth.title': 'Advensys Payroll',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.login': 'Login',
    'auth.error': 'Invalid credentials',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Employees',
    'nav.companies': 'Companies',
    'nav.individuals': 'Individuals',
    'nav.payslips': 'Payslips',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.managePayslips': 'Manage payslips for companies and individuals',
    'dashboard.companiesManaged': 'Companies you manage',
    'dashboard.totalEmployees': 'Total employees',
    'dashboard.totalPayslipsCreated': 'Total payslips created',
    'dashboard.clientCompanies': 'Client Companies',
    'dashboard.clientCompaniesDesc': 'Create and manage companies, then add employees and payslips',
    'dashboard.viewDetails': 'View Details',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.createCompany': 'Create Company',
    'dashboard.viewAllPayslips': 'View All Payslips',
    'dashboard.addIndividual': 'Add Individual',
    'dashboard.employees': 'Number of Advensys employees',
    'dashboard.companies': 'Number of companies',
    'dashboard.payslips': 'Payslips this month',
    'dashboard.payroll': 'Total payroll this month',

    // Employees
    'employees.title': 'Employees',
    'employees.add': 'Add employee',
    'employees.name': 'Last name',
    'employees.firstname': 'First name',
    'employees.email': 'Email',
    'employees.status': 'Status',
    'employees.salary': 'Base salary',
    'employees.actions': 'Actions',
    'employees.edit': 'Edit',
    'employees.delete': 'Delete',
    'employees.reset': 'Reset password',

    // Companies
    'companies.title': 'Companies',
    'companies.add': 'Add Company',
    'companies.name': 'Name',
    'companies.details': 'View details',
    'companies.overview': 'Overview',
    'companies.analytics': 'Analytics',

    // Individuals
    'individuals.title': 'Individuals',
    'individuals.create': 'Create immediate payslip',

    // Payslips
    'payslips.title': 'Payslips',
    'payslips.create': 'Create payslip',
    'payslips.viewAndManage': 'View and manage all payslips',
    'payslips.period': 'Period',
    'payslips.employee': 'Employee',
    'payslips.company': 'Company',
    'payslips.save': 'Save',
    'payslips.export.pdf': 'Export PDF',
    'payslips.export.excel': 'Export Excel',

    // Profile
    'profile.title': 'Profile',

    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.unknown': 'Unknown',
    'common.search': 'Search...',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
  }
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: (i18n.language as Language) || 'fr',
  setLanguage: (lang: Language) => {
    // Sync with i18next and local store
    i18n.changeLanguage(lang)
    set({ language: lang })
  },
  t: (key: string) => {
    // Prefer i18next resources; fall back to legacy map if missing
    const translated = i18n.t(key)
    if (translated && translated !== key) return translated

    const { language } = get()
    return (translations[language] as Record<string, string>)[key] || key
  }
}))
