import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <LegalPage title="Conditions Générales de Vente" updated="Mai 2026">

      <Section title="1. Objet et acceptation">
        <p>Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre <strong>Alexis Elie</strong>, auto-entrepreneur opérant sous le nom <strong>The Ultimate Academy</strong>, et tout utilisateur souscrivant à un abonnement de coaching running et trail personnalisé.</p>
        <p>Toute souscription implique l'acceptation pleine et entière des présentes CGV.</p>
      </Section>

      <Section title="2. Services proposés">
        <p>The Ultimate Academy propose les services suivants :</p>
        <ul>
          <li>Élaboration d'un plan d'entraînement personnalisé (running, trail) en fonction du profil sportif de l'athlète</li>
          <li>Suivi hebdomadaire de la progression et ajustement du plan en temps réel</li>
          <li>Messagerie directe coach-athlète via l'application</li>
          <li>Analyses de performance hebdomadaires automatisées</li>
          <li>Accès à des ressources complémentaires (nutrition, préparation physique)</li>
        </ul>
        <p>Les services sont accessibles via l'application web à l'adresse <strong>theultimateacademy.fr</strong> après création d'un compte et activation d'un abonnement.</p>
      </Section>

      <Section title="3. Prix et paiement">
        <SubSection title="Tarifs">
          <p>Les tarifs en vigueur sont affichés sur la page d'accueil de l'application avant toute souscription. Tous les prix sont indiqués en euros (€) TTC.</p>
        </SubSection>
        <SubSection title="Modalités de paiement">
          <ul>
            <li>Les paiements sont traités exclusivement via <strong>Stripe</strong>, plateforme sécurisée certifiée PCI DSS</li>
            <li>L'abonnement est prélevé mensuellement à date anniversaire</li>
            <li>Aucune donnée de carte bancaire n'est stockée par The Ultimate Academy</li>
          </ul>
        </SubSection>
        <SubSection title="Facturation">
          <p>Un récapitulatif de paiement est transmis par email à chaque renouvellement. Les factures sont conservées conformément aux obligations légales (10 ans).</p>
        </SubSection>
      </Section>

      <Section title="4. Durée et résiliation">
        <SubSection title="Durée">
          <p>L'abonnement est souscrit sans engagement de durée minimale. Il est renouvelé automatiquement chaque mois jusqu'à résiliation.</p>
        </SubSection>
        <SubSection title="Résiliation">
          <ul>
            <li>L'athlète peut résilier à tout moment depuis son espace profil ou en envoyant un email à <a href="mailto:alexiselie1912@gmail.com">alexiselie1912@gmail.com</a></li>
            <li>La résiliation prend effet à la fin de la période de facturation en cours</li>
            <li>Aucun remboursement n'est accordé pour la période déjà payée, sauf en cas de droit légal de rétractation</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="5. Droit de rétractation">
        <p>Conformément à l'article L221-18 du Code de la consommation, l'athlète dispose d'un délai de <strong>14 jours</strong> à compter de la souscription pour exercer son droit de rétractation, sans justification.</p>
        <p>Pour exercer ce droit : <a href="mailto:alexiselie1912@gmail.com">alexiselie1912@gmail.com</a>. Le remboursement sera effectué dans les 14 jours suivant la rétractation.</p>
        <p><strong>Exception</strong> : le droit de rétractation ne s'applique plus si l'athlète a explicitement demandé la mise à disposition immédiate du service (accès au plan d'entraînement dès la souscription) et que ce service a été fourni en totalité.</p>
      </Section>

      <Section title="6. Obligations des parties">
        <SubSection title="Obligations de The Ultimate Academy">
          <ul>
            <li>Fournir les services décrits avec professionnalisme et dans les délais annoncés</li>
            <li>Assurer la disponibilité de l'application (hors maintenance planifiée)</li>
            <li>Protéger les données personnelles conformément au RGPD</li>
            <li>Répondre aux demandes de l'athlète dans un délai raisonnable</li>
          </ul>
        </SubSection>
        <SubSection title="Obligations de l'athlète">
          <ul>
            <li>Fournir des informations exactes lors de la création du profil (niveau sportif, antécédents médicaux pertinents)</li>
            <li>Consulter un médecin avant de débuter un programme d'entraînement intensif</li>
            <li>Utiliser le service à des fins personnelles et non commerciales</li>
            <li>Ne pas partager ses identifiants de connexion</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="7. Responsabilité">
        <p>The Ultimate Academy est tenu à une <strong>obligation de moyens</strong> dans la fourniture du service de coaching. L'athlète reconnaît que les performances sportives dépendent de nombreux facteurs individuels (condition physique, hygiène de vie, respect du programme).</p>
        <p>The Ultimate Academy ne saurait être tenu responsable :</p>
        <ul>
          <li>Des blessures survenant lors de la pratique sportive</li>
          <li>Des interruptions de service liées à des tiers (hébergeur, réseau)</li>
          <li>Des résultats sportifs non atteints malgré le suivi du programme</li>
        </ul>
        <p>Il est fortement recommandé à tout athlète de consulter un médecin du sport avant de débuter un programme d'entraînement.</p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>L'ensemble des contenus de The Ultimate Academy (plans d'entraînement, analyses, interface, textes, logos) est protégé par le droit d'auteur et appartient exclusivement à Alexis Elie.</p>
        <p>Toute reproduction, diffusion ou utilisation commerciale sans autorisation préalable est interdite.</p>
      </Section>

      <Section title="9. Modifications des CGV">
        <p>The Ultimate Academy se réserve le droit de modifier les présentes CGV à tout moment. L'athlète sera informé par email au moins 30 jours avant l'entrée en vigueur des nouvelles conditions. La poursuite de l'utilisation du service vaut acceptation.</p>
      </Section>

      <Section title="10. Droit applicable et litiges">
        <p>Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.</p>
        <p>Conformément aux articles L611-1 et suivants du Code de la consommation, l'athlète peut recourir gratuitement à un médiateur de la consommation.</p>
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
