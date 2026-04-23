import type { en } from "./en";

/**
 * French (fr-CA) translations. Must mirror the keys in `en.ts`.
 * TODO: Translations below are initial working copy by the development team;
 * have a native Canadian French speaker review the trade/tax terminology
 * (especially CRA/CBSA-specific wording) before a public launch.
 */
export const fr: Record<keyof typeof en, string> = {
  // Navigation
  "nav.services": "Services",
  "nav.tools": "Outils",
  "nav.pricing": "Tarifs",
  "nav.resources": "Ressources",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.about": "À propos",
  "nav.clientLogin": "Espace client",
  "nav.registerNow": "Commencer",
  "nav.clientLoginMobile": "Déjà client ? Se connecter →",

  // Footer
  "footer.servicesHeading": "Services",
  "footer.contactHeading": "Contact",
  "footer.legalHeading": "Mentions légales",
  "footer.terms": "Conditions",
  "footer.privacy": "Confidentialité",
  "footer.refunds": "Politique de remboursement",
  "footer.hours": "Lun.–Ven., 9 h–18 h (HE)",
  "footer.secureCheckout": "Paiement sécurisé par Stripe",

  // Hero
  "hero.badge": "Coordination de vos dépôts fiscaux et douaniers canadiens",
  "hero.title_before": "Vos dépôts",
  "hero.title_emphasis": "numéro d'entreprise et TPS/TVH canadiens",
  "hero.title_after": ", coordonnés pour vous.",
  "hero.subtitle":
    "Tarif fixe à partir de 99 $ CA. Nous préparons et soumettons vos dépôts à l'ARC sous autorisation signée. L'ARC délivre généralement les comptes dans un délai de 5 à 10 jours ouvrables suivant le dépôt. Pour entreprises canadiennes et non-résidentes.",
  "hero.cta": "Commencer l'inscription",

  // Common
  "common.learnMore": "En savoir plus",
  "common.getStarted": "Commencer",
  "common.contactUs": "Nous contacter",
  "common.viewPricing": "Voir les tarifs",
  "common.satisfactionGuarantee": "Remboursement avant dépôt",
  "common.guaranteeBody":
    "Remboursement intégral si vous annulez avant que nous soumettions votre dépôt. En cas de refus dû à notre erreur, nous redéposons ou remboursons les frais de service.",

  // Currency toggle
  "currency.cad": "CAD",
  "currency.usd": "USD",

  // Locale toggle
  "locale.toggle": "Langue",
  "locale.en": "English",
  "locale.fr": "Français",
};
