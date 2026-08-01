import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <LegalPage title="Politique de confidentialité" updated="Mai 2026">

      <Section title="1. Responsable du traitement">
        <p>Le responsable du traitement des données personnelles collectées via The Ultimate Academy est :</p>
        <ul>
          <li><strong>Alexis Elie</strong>, auto-entrepreneur</li>
          <li>The Ultimate Academy</li>
          <li>Email : <a href="mailto:alexiselie1912@gmail.com">alexiselie1912@gmail.com</a></li>
          <li>Activité : coaching running et trail personnalisé</li>
        </ul>
      </Section>

      <Section title="2. Données collectées">
        <p>Dans le cadre de la fourniture du service, les données suivantes sont collectées :</p>
        <SubSection title="Données d'identification">
          <ul>
            <li>Nom, prénom, adresse email</li>
            <li>Photo de profil (optionnelle)</li>
          </ul>
        </SubSection>
        <SubSection title="Données sportives et de santé">
          <ul>
            <li>VMA (vitesse maximale aérobie), niveau sportif, objectifs de course</li>
            <li>Fréquence cardiaque, RPE (effort perçu), commentaires de séance</li>
            <li>Historique de blessures, jours d'entraînement disponibles</li>
            <li>Données Garmin importées avec le consentement explicite de l'athlète</li>
            <li>Données du cycle menstruel (uniquement si l'athlète active cette option de son plein gré)</li>
          </ul>
        </SubSection>
        <SubSection title="Données de paiement">
          <ul>
            <li>Les paiements sont gérés exclusivement par <strong>Stripe</strong>, certifié PCI DSS</li>
            <li>The Ultimate Academy ne stocke aucune donnée de carte bancaire</li>
            <li>Seul le statut d'abonnement est conservé</li>
          </ul>
        </SubSection>
        <SubSection title="Données de navigation">
          <ul>
            <li>Cookies de session et de préférences (voir la <Link to="/cookies">Politique cookies</Link>)</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="3. Finalités du traitement">
        <ul>
          <li><strong>Personnalisation des plans d'entraînement</strong> — générer des programmes adaptés au profil de chaque athlète</li>
          <li><strong>Suivi de la progression sportive</strong> — analyser les données de séance pour adapter la charge</li>
          <li><strong>Gestion des abonnements et paiements</strong> — facturation, accès au service, résiliation</li>
          <li><strong>Communication coach-athlète</strong> — messagerie intégrée, analyses hebdomadaires</li>
          <li><strong>Amélioration du service</strong> — analyse anonymisée des usages</li>
        </ul>
      </Section>

      <Section title="4. Base légale">
        <ul>
          <li><strong>Exécution du contrat</strong> — traitement nécessaire pour fournir le service d'entraînement personnalisé</li>
          <li><strong>Consentement explicite</strong> — pour les données de santé sensibles (cycle menstruel, blessures) et la connexion aux services tiers (Garmin)</li>
          <li><strong>Intérêt légitime</strong> — amélioration du service et sécurité de la plateforme</li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul>
          <li><strong>Données actives</strong> : conservées pendant toute la durée de l'abonnement actif</li>
          <li><strong>Après résiliation</strong> : 3 ans maximum à compter de la fin de l'abonnement, puis suppression définitive</li>
          <li><strong>Données de paiement</strong> : selon les obligations légales et fiscales en vigueur (10 ans pour les factures)</li>
          <li><strong>Données de navigation</strong> : 13 mois maximum pour les cookies</li>
        </ul>
      </Section>

      <Section title="6. Partage des données">
        <p>Les données peuvent être transmises aux sous-traitants suivants, dans le strict cadre de la prestation :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement de la base de données (serveurs en Europe)</li>
          <li><strong>Vercel</strong> — hébergement de l'application (serveurs en Europe)</li>
          <li><strong>Stripe</strong> — traitement des paiements (certifié PCI DSS)</li>
          <li><strong>Anthropic</strong> — génération IA des plans et analyses (données anonymisées)</li>
          <li><strong>Garmin</strong> — uniquement si connexion explicitement autorisée par l'athlète</li>
        </ul>
        <p>Aucune donnée n'est vendue ni partagée à des fins commerciales.</p>
      </Section>

      <Section title="7. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> — s'opposer à certains traitements</li>
          <li><strong>Droit de retrait du consentement</strong> — à tout moment, sans rétroactivité</li>
        </ul>
        <p>Pour exercer ces droits : <a href="mailto:alexiselie1912@gmail.com">alexiselie1912@gmail.com</a>. Réponse sous 30 jours.</p>
        <p>En cas de litige, vous pouvez saisir la <strong>CNIL</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a></p>
      </Section>

      <Section title="8. Sécurité">
        <p>The Ultimate Academy met en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données : chiffrement des communications (HTTPS), contrôle d'accès, hébergement sécurisé en Europe.</p>
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
