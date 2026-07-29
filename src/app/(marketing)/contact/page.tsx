'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, CheckCircle2, Send } from 'lucide-react';
import styles from '../landing.module.css';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
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
          <Link href="/book-demo" className={styles.navLink}>Book Demo</Link>
          <Link href="/contact" className={`${styles.navLink} ${styles.navLinkActive}`}>Contact</Link>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <Link href="/book-demo" className={styles.signupBtn}>Book a Demo</Link>
        </div>
      </nav>

      {/* ══════════ CONTACT HEADER & FORM ══════════ */}
      <section className={styles.hero} style={{ paddingBottom: '90px' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: '40px' }}>
          <span className={styles.sectionTag}>Get In Touch</span>
          <h1 className={styles.sectionTitle} style={{ fontSize: '42px' }}>We&apos;re Here to Help</h1>
          <p className={styles.sectionSubtitle}>
            Have questions about subscriptions, features, or custom enterprise solutions? Reach out to our team.
          </p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '36px', alignItems: 'start' }}>
          {/* Contact Details Column */}
          <div style={{ textAlign: 'left', background: '#FFFFFF', padding: '36px 28px', borderRadius: '20px', boxShadow: 'var(--shadow-soft)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 850, color: '#0F172A', marginBottom: '24px' }}>Contact Details</h3>
            
            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Email Support</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>support@averacrm.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Phone & WhatsApp</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>+234 (0) 800 2837 227</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Head Office</div>
                <div style={{ fontSize: '14px', color: '#64748B', marginTop: '2px', lineHeight: 1.5 }}>
                  Level 4, Admiralty Way, Lekki Phase 1, Lagos, Nigeria
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          {submitted ? (
            <div className={styles.formCard} style={{ textAlign: 'center', padding: '50px 30px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A', marginBottom: '12px' }}>Message Sent!</h2>
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Thank you for contacting Avera. We have received your query and will reply to <strong>{formData.email}</strong> within 2 business hours.
              </p>
            </div>
          ) : (
            <div className={styles.formCard} style={{ maxWidth: '100%' }}>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Akpan"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@agency.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Enterprise Plan Inquiry"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we help your team?"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>

                <button type="submit" className={styles.ctaPrimary} style={{ width: '100%', justifyContent: 'center' }}>
                  Send Message <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
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
