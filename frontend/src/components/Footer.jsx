import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'How it works', path: '/' },
      { label: 'Features', path: '/' },
      { label: 'Pricing', path: '/' },
    ],
    company: [
      { label: 'About us', path: '/' },
      { label: 'Contact', path: '/' },
      { label: 'Careers', path: '/' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/' },
      { label: 'Terms of Service', path: '/' },
      { label: 'Cookie Policy', path: '/' },
    ],
  };

  return (
    <footer style={{
      background: 'var(--clay)',
      color: 'var(--parchment)',
      padding: 'clamp(1rem, 4vw, 2rem) clamp(1rem, 3vw, 3rem)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 2500,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'clamp(1.5rem, 4vw, 3rem)',
      }}>
        {/* Brand */}
        <div>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--parchment)', letterSpacing: '-0.5px' }}>
              Roomzy<span style={{ fontStyle: 'italic', color: 'var(--terra)' }}>.</span>
            </span>
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'var(--clay-4)', lineHeight: 1.6, maxWidth: 220 }}>
            Find your perfect roommate match with smart compatibility scoring and layered trust verification.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--terra)' }}>
            Product
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {footerLinks.product.map((link, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                <Link to={link.path} style={{ fontSize: '0.875rem', color: 'var(--clay-4)', transition: 'color 0.2s' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--terra)' }}>
            Company
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {footerLinks.company.map((link, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                <Link to={link.path} style={{ fontSize: '0.875rem', color: 'var(--clay-4)', transition: 'color 0.2s' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--terra)' }}>
            Legal
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {footerLinks.legal.map((link, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                <Link to={link.path} style={{ fontSize: '0.875rem', color: 'var(--clay-4)', transition: 'color 0.2s' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        maxWidth: 2500,
        margin: '3rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--clay-4)' }}>
          © {currentYear} Roomzy. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['🐦', '📘', '📸', 'in'].map((icon, i) => (
            <span key={i} style={{ fontSize: '1.1rem', cursor: 'pointer', opacity: 0.7, transition: 'opacity 0.2s' }}>
              {icon}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}