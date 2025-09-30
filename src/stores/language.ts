import { create } from 'zustand'

export type Language = 'fr' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

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
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    
    // Dashboard
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
    'companies.details': 'Voir détails',
    'companies.overview': 'Aperçu',
    'companies.analytics': 'Analytique',
    
    // Individuals
    'individuals.title': 'Individus',
    'individuals.create': 'Créer fiche de paie immédiate',
    
    // Payslips
    'payslips.title': 'Fiches de paie',
    'payslips.create': 'Créer fiche de paie',
    'payslips.period': 'Période',
    'payslips.employee': 'Employé',
    'payslips.company': 'Entreprise',
    'payslips.save': 'Enregistrer',
    'payslips.export.pdf': 'Exporter PDF',
    'payslips.export.excel': 'Exporter Excel',
    
    // Common
    'common.search': 'Rechercher...',
    'common.cancel': 'Annuler',
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
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Dashboard
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
    'companies.details': 'View details',
    'companies.overview': 'Overview',
    'companies.analytics': 'Analytics',
    
    // Individuals
    'individuals.title': 'Individuals',
    'individuals.create': 'Create immediate payslip',
    
    // Payslips
    'payslips.title': 'Payslips',
    'payslips.create': 'Create payslip',
    'payslips.period': 'Period',
    'payslips.employee': 'Employee',
    'payslips.company': 'Company',
    'payslips.save': 'Save',
    'payslips.export.pdf': 'Export PDF',
    'payslips.export.excel': 'Export Excel',
    
    // Common
    'common.search': 'Search...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
  }
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'fr',
  setLanguage: (lang: Language) => set({ language: lang }),
  t: (key: string) => {
    const { language } = get()
    return (translations[language] as Record<string, string>)[key] || key
  }
}))
