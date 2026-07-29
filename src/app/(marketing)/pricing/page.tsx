'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../landing.module.css';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
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
          <Link href="/pricing" className={`${styles.navLink} ${styles.navLinkActive}`}>Pricing</Link>
          <Link href="/book-demo" className={styles.navLink}>Book Demo</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <Link href="/book-demo" className={styles.signupBtn}>Book a Demo</Link>
        </div>
      </nav>

      {/* ══════════ PRICING HEADER ══════════ */}
      <section className={styles.hero} style={{ paddingBottom: '60px' }}>
        <div className={styles.sectionHeader} style={{ marginBottom: '32px' }}>
          <span className={styles.sectionTag}>Plans & Billing</span>
          <h1 className={styles.sectionTitle} style={{ fontSize: '42px' }}>Simple, Transparent Pricing</h1>
          <p className={styles.sectionSubtitle}>
            Scale your real estate operations with confidence. All plans include 14-day free trial & Paystack integration.
          </p>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className={styles.pricingToggle}>
          <span className={styles.toggleLabel} style={{ color: !isAnnual ? '#0F172A' : '#64748B' }}>Monthly Billed</span>
          <div
            className={`${styles.toggleSwitch} ${isAnnual ? styles.toggleSwitchActive : ''}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <div className={`${styles.toggleKnob} ${isAnnual ? styles.toggleKnobActive : ''}`} />
          </div>
          <span className={styles.toggleLabel} style={{ color: isAnnual ? '#0F172A' : '#64748B' }}>Annual Billed</span>
          <span className={styles.discountBadge}>SAVE 20%</span>
        </div>
      </section>

      {/* ══════════ PRICING CARDS ══════════ */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.pricingGrid}>
          {/* Basic (Free) */}
          <div className={styles.pricingCard}>
            <div className={styles.priceTier}>Basic</div>
            <div className={styles.priceAmount}>₦0</div>
            <div className={styles.priceSub}>Free forever for small teams</div>
            <div className={styles.priceDivider} />
            <div className={styles.priceFeatures}>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Up to 5 team members</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Core CRM & Lead Tracking</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Standard Overview Analytics</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Task & Activity Management</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Community Email Support</div>
            </div>
            <Link href="/register" className={`${styles.priceBtn} ${styles.priceBtnOutline}`}>
              Get Started Free
            </Link>
          </div>

          {/* Pro — Popular Plan */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <span className={styles.popularTag}>MOST POPULAR</span>
            <div className={styles.priceTier}>Pro</div>
            <div className={styles.priceAmount}>
              {isAnnual ? '₦20,000' : '₦25,000'}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}> / month</span>
            </div>
            <div className={styles.priceSub}>
              {isAnnual ? 'Billed ₦240,000 annually' : 'Billed monthly, cancel anytime'}
            </div>
            <div className={styles.priceDivider} />
            <div className={styles.priceFeatures}>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Up to 25 team members</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> All 4 Suites (Sales, HR, Finance, Facility)</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Advanced Real-Time Analytics</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Custom Role Permissions (RBAC)</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Paystack Staging & Live Gateways</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Priority 24/7 Support</div>
            </div>
            <Link href="/register" className={`${styles.priceBtn} ${styles.priceBtnPrimary}`}>
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className={styles.pricingCard}>
            <div className={styles.priceTier}>Enterprise</div>
            <div className={styles.priceAmount}>
              {isAnnual ? '₦80,000' : '₦100,000'}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}> / month</span>
            </div>
            <div className={styles.priceSub}>
              {isAnnual ? 'Billed ₦960,000 annually' : 'Billed monthly'}
            </div>
            <div className={styles.priceDivider} />
            <div className={styles.priceFeatures}>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Unlimited team members</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Custom API Integrations</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Dedicated Account Manager</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Custom SLA Guarantees</div>
              <div className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> Dedicated Hosting Options</div>
            </div>
            <Link href="/contact" className={`${styles.priceBtn} ${styles.priceBtnOutline}`}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ACCORDION ══════════ */}
      <section className={styles.section} id="faq">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Questions</span>
          <h2 className={styles.sectionTitle}>Pricing & Billing FAQ</h2>
        </div>

        <div className={styles.faqGrid}>
          {[
            {
              q: 'How does the 14-day free trial work?',
              a: 'You get full access to the Pro tier for 14 days without requiring credit card details. You can upgrade anytime or stay on the Basic free plan.'
            },
            {
              q: 'How do Paystack payments work?',
              a: 'Payments are processed directly via Paystack. We support Nigerian debit/credit cards, bank transfers, USSD codes, and automated recurring billing.'
            },
            {
              q: 'Can I change my plan or add team members later?',
              a: 'Yes, you can upgrade, downgrade, or add staff seats anytime from your organization settings page.'
            }
          ].map((item, idx) => (
            <div key={idx} className={styles.faqItem}>
              <div className={styles.faqQuestion} onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFaq === idx && (
                <div className={styles.faqAnswer}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
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
