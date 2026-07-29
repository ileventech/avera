'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from '../landing.module.css';

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    teamSize: '5-20',
    preferredDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.pageContainer}>
      {/* ══════════ NAVBAR ══════════ */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>A</span>
          Avera
        </Link>
        <div className={styles.navCenter}>
          <Link href="/#features" className={styles.navLink}>Features</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/book-demo" className={`${styles.navLink} ${styles.navLinkActive}`}>Book Demo</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <Link href="/book-demo" className={styles.signupBtn}>Book a Demo</Link>
        </div>
      </nav>

      {/* ══════════ BOOK DEMO HEADER & FORM ══════════ */}
      <section className={styles.hero} style={{ paddingBottom: '90px' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: '40px' }}>
          <span className={styles.sectionTag}>Live Product Walkthrough</span>
          <h1 className={styles.sectionTitle} style={{ fontSize: '42px' }}>Book a Personalized Demo</h1>
          <p className={styles.sectionSubtitle}>
            See how Avera CRM can be tailored specifically to your real estate team&apos;s sales, workforce HR, and financial workflows.
          </p>
        </div>

        {submitted ? (
          <div className={styles.formCard} style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A', marginBottom: '12px' }}>Demo Request Scheduled!</h2>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 28px' }}>
              Thank you, <strong>{formData.fullName || 'there'}</strong>. One of our senior product specialists will contact you at <strong>{formData.email}</strong> shortly to confirm your live walkthrough.
            </p>
            <Link href="/" className={styles.ctaPrimary}>
              Return to Homepage <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Adebayo"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company / Agency Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Apex Realty Ltd"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Team Size</label>
                  <select
                    value={formData.teamSize}
                    onChange={e => setFormData({ ...formData, teamSize: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="1-5">1 - 5 Members</option>
                    <option value="5-20">5 - 20 Members</option>
                    <option value="20-50">20 - 50 Members</option>
                    <option value="50+">50+ Members</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Preferred Demo Date</label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Specific Questions or Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your current sales process or features you're most interested in..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className={styles.formTextarea}
                />
              </div>

              <button type="submit" className={styles.ctaPrimary} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                Schedule My Live Demo <Calendar size={16} />
              </button>
            </form>
          </div>
        )}
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.logo} style={{ color: '#1E3A8A' }}>
              <span className={styles.logoMark}>A</span>
              Avera
            </div>
            <p className={styles.footerBrandDesc}>
              The modern CRM built for real estate enterprises and sales teams.
            </p>
          </div>
          <div>
            <div className={styles.footerColTitle}>Product</div>
            <div className={styles.footerLinks}>
              <Link href="/#features" className={styles.footerLink}>Features</Link>
              <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
              <Link href="/book-demo" className={styles.footerLink}>Book Demo</Link>
              <Link href="/contact" className={styles.footerLink}>Contact Us</Link>
            </div>
          </div>

          <div>
            <div className={styles.footerColTitle}>Legal & Security</div>
            <div className={styles.footerLinks}>
              <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
              <Link href="#" className={styles.footerLink}>Terms of Service</Link>
              <Link href="#" className={styles.footerLink}>Security</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Avera CRM. All rights reserved.</span>
          <span>Built for real estate teams that move fast.</span>
        </div>
      </footer>
    </div>
  );
}
