import { Link } from 'react-router-dom'

export default function Cookies() {
  return (
    <LegalPage title="Politique de gestion des cookies" updated="Mai 2026">

      <Section title="1. Qu'est-ce qu'un cookie ?">
        <p>Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d'un site web. Il permet au site de mémoriser vos actions et préférences (connexion, langue, affichage) sur une période donnée, afin de ne pas avoir à les saisir à chaque visite.</p>
      </Section>

      <Section title="2. Cookies utilisés par The Ultimate Academy">

        <SubSection title="Cookies strictement nécessaires (exemptés de consentement)">
          <p>Ces cookies sont indispensables au fonctionnement du service. Leur dépôt ne nécessite pas votre accord.</p>
          <ul>
            <li><strong>Cookie de session Supabase</strong> — maintient votre connexion à votre compte athlète. Durée : fin de session navigateur.</li>
            <li><strong>Cookie de préférences d'interface</strong> — mémorise vos réglages d'affichage (ex. : semaine active, paramètres d'entraînement). Durée : 30 jours.</li>
            <li><strong>Cookie de consentement cookies</strong> — enregistre votre choix (accepter/refuser) pour ne pas afficher la bannière à chaque visite. Durée : 13 mois.</li>
          </ul>
        </SubSection>

        <SubSection title="Cookies de mesure d'audience (soumis à consentement)">
          <p>Ces cookies nous permettent de comprendre comment les athlètes utilisent l'application afin d'améliorer l'expérience. Ils ne sont déposés qu'avec votre accord.</p>
          <ul>
            <li><strong>Données d'usage anonymisées</strong> — fréquentation des pages, durée de session, parcours utilisateur. Aucun suivi nominatif.</li>
          </ul>
          <p>Si vous refusez ces cookies, votre expérience sur l'application ne sera pas dégradée.</p>
        </SubSection>

        <SubSection title="Cookies tiers (soumis à consentement)">
          <p>Lors de la connexion aux services sportifs tiers, des cookies propres à ces plateformes peuvent être déposés :</p>
          <ul>
            <li><strong>Strava</strong> — lors de l'autorisation OAuth pour l'import de vos activités</li>
            <li><strong>Stripe</strong> — lors du processus de paiement (sécurité, détection de fraude)</li>
          </ul>
          <p>Ces cookies sont soumis aux politiques de confidentialité respectives de Strava et Stripe.</p>
        </SubSection>

      </Section>

      <Section title="3. Comment gérer vos cookies ?">
        <SubSection title="Via la bannière de consentement">
          <p>À votre première visite, une bannière vous propose d'accepter ou de refuser les cookies non essentiels. Vous pouvez modifier ce choix à tout moment en vidant les données de navigation de votre navigateur.</p>
        </SubSection>
        <SubSection title="Via les paramètres de votre navigateur">
          <p>Vous pouvez configurer votre navigateur pour accepter, refuser ou supprimer les cookies. Voici les liens vers les paramètres des principaux navigateurs :</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
          </ul>
          <p>Attention : la désactivation de certains cookies essentiels peut empêcher le bon fonctionnement de l'application (connexion, accès à votre plan).</p>
        </SubSection>
      </Section>

      <Section title="4. Durée de conservation">
        <ul>
          <li>Cookies de session : supprimés à la fermeture du navigateur</li>
          <li>Cookies de préférences : 30 jours</li>
          <li>Cookie de consentement : 13 mois</li>
          <li>Cookies d'audience (si acceptés) : 13 mois maximum</li>
        </ul>
      </Section>

      <Section title="5. Contact">
        <p>Pour toute question relative à notre politique de cookies : <a href="mailto:alexiselie1912@gmail.com">alexiselie1912@gmail.com</a></p>
      </Section>

    </LegalPage>
  )
}

function LegalPage({ title, updated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0C0A18)', color: 'var(--text, rgba(255,255,255,.92))', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', color: 'var(--primary, #8B2FC9)', fontSize: '.875rem', textDecoration: 'none', marginBottom: '2rem' }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '.5rem', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {title}
        </h1>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.35)', marginBottom: '2.5rem' }}>Dernière mise à jour : {updated}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>{children}</div>
        <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.8rem' }}>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Politique de confidentialité</Link>
          <Link to="/terms"   style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>CGV</Link>
          <Link to="/cookies" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>Cookies</Link>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#C084FC' }}>{title}</h2>
      <div style={{ fontSize: '.9rem', lineHeight: 1.8, color: 'rgba(255,255,255,.75)', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }) {
  return (
    <div>
      <p style={{ fontWeight: 600, color: 'rgba(255,255,255,.85)', marginBottom: '.3rem' }}>{title}</p>
      {children}
    </div>
  )
}
