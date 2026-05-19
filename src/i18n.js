import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      sidebar: {
        appName: 'DISTRAC Control',
        home: 'Home',
        users: 'Users',
        roles: 'Roles',
        stock: 'Stock',
        missions: 'Missions',
        orders: 'Orders',
        reports: 'Reports',
        finances: 'Finances',
        exceptions: 'Exceptions',
        settings: 'Settings',
        logistics: 'Logistics',
        catalog: 'Product Catalog',
        support: 'Support',
      },
      login: {
        title: 'Welcome back',
        subtitle: 'Sign in to your control panel',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign In',
        signingIn: 'Signing In...',
      },
      profile: {
        language: 'Language',
        theme: 'Theme',
        signOut: 'Sign out',
        dark: 'Dark',
        light: 'Light',
        accountSettings: 'Account settings',
        deviceManagement: 'Device management',
        activeAccount: 'Active account',
      },
    },
  },
  fr: {
    translation: {
      sidebar: {
        appName: 'DISTRAC Control',
        home: 'Accueil',
        users: 'Utilisateurs',
        roles: 'Roles',
        stock: 'Stock',
        missions: 'Missions',
        orders: 'Commandes',
        reports: 'Rapports',
        finances: 'Finances',
        exceptions: 'Exceptions',
        settings: 'Parametres',
        logistics: 'Logistique',
        catalog: 'Catalogue de produits',
        support: 'Support',
      },
      login: {
        title: 'Heureux de vous revoir',
        subtitle: 'Connectez-vous a votre tableau de bord',
        email: 'E-mail',
        password: 'Mot de passe',
        signIn: 'Se connecter',
        signingIn: 'Connexion...',
      },
      profile: {
        language: 'Langue',
        theme: 'Theme',
        signOut: 'Se deconnecter',
        dark: 'Sombre',
        light: 'Clair',
        accountSettings: 'Parametres du compte',
        deviceManagement: 'Gestion des appareils',
        activeAccount: 'Compte actif',
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
