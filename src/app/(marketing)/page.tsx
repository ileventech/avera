'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  CreditCard,
  Building2,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Bell,
  Search,
  FolderOpen,
  ClipboardList,
  Settings,
  BarChart3
} from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
  const [activeRealNav, setActiveRealNav] = useState<'dashboard' | 'sales' | 'hr' | 'finance' | 'facility'>('dashboard');
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [hasIncompleteOnboarding, setHasIncompleteOnboarding] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const saved = localStorage.getItem('averaOnboardingState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep !== undefined && parsed.currentStep < 4) {
          setHasIncompleteOnboarding(true);
        }
      } catch {}
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className={styles.pageContainer}>
      {/* ══════════ NAVBAR ══════════ */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>A</span>
          Avera
        </Link>
        <div className={styles.navCenter}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/book-demo" className={styles.navLink}>Book Demo</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <Link href="/book-demo" className={styles.signupBtn}>Book a Demo</Link>
        </div>
      </nav>

      {/* ══════════ CENTERED HERO SECTION ══════════ */}
      <section className={styles.hero}>
        <div className={styles.heroCenteredContainer}>
          <h1 className={styles.heroTitle}>
            Manage Properties, Sales &amp; Operations in One Place
          </h1>
          <p className={styles.heroSub}>
            Eliminate fragmented spreadsheets. Streamline lead pipelines, workforce HR, financial ledgers, and facility assets with enterprise-grade security.
          </p>
          <div className={styles.heroCtas}>
            <Link href={hasIncompleteOnboarding ? "/onboarding" : "/register"} className={styles.ctaPrimary}>
              {hasIncompleteOnboarding ? "Resume Setup" : "Start Free Trial"} <ArrowRight size={16} />
            </Link>
            <Link href="/book-demo" className={styles.ctaSecondary}>
              Book a Demo
            </Link>
          </div>

          <div className={styles.heroStatsCentered}>
            <div className={styles.statItem}>
              <div className={styles.statVal}>₦42.8M+</div>
              <div className={styles.statLabel}>Monthly Revenue Tracked</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>99.9%</div>
              <div className={styles.statLabel}>Uptime Guarantee</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>15 Mins</div>
              <div className={styles.statLabel}>Average Setup Time</div>
            </div>
          </div>
        </div>

        {/* ── REAL CRM DASHBOARD MOCKUP ── */}
        <div className={styles.mockupContainer}>
          <div className={styles.realAppLayout}>
            {/* Sidebar with 9 Menu Items */}
            <div className={styles.realSidebar}>
              <div className={styles.realBrand}>
                <span className={styles.logoMark} style={{ width: '26px', height: '26px', fontSize: '13px' }}>A</span>
                Avera
              </div>
              <div className={styles.realNavList}>
                {[
                  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', key: 'dashboard' },
                  { icon: <Briefcase size={15} />, label: 'Sales & Deals', key: 'sales' },
                  { icon: <Users size={15} />, label: 'Workforce HR', key: 'hr' },
                  { icon: <CreditCard size={15} />, label: 'Finance', key: 'finance' },
                  { icon: <Building2 size={15} />, label: 'Facility & Assets', key: 'facility' },
                  { icon: <BarChart3 size={15} />, label: 'Reports', key: 'dashboard' },
                  { icon: <FolderOpen size={15} />, label: 'Projects', key: 'dashboard' },
                  { icon: <ClipboardList size={15} />, label: 'Tasks', key: 'dashboard' },
                  { icon: <Settings size={15} />, label: 'Settings', key: 'dashboard' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.realNavItem} ${
                      activeRealNav === item.key && item.key !== 'dashboard'
                        ? styles.realNavActive
                        : activeRealNav === 'dashboard' && item.label === 'Dashboard'
                        ? styles.realNavActive
                        : ''
                    }`}
                    onClick={() => setActiveRealNav(item.key as typeof activeRealNav)}
                  >
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Area */}
            <div className={styles.realMain}>
              {/* Clean Top Header — Search + Bell + User Avatar Only */}
              <div className={styles.realTopHeader}>
                <div className={styles.realSearchBar}>
                  <Search size={14} style={{ color: '#94A3B8' }} />
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>Search deals, staff, assets...</span>
                </div>
                <div className={styles.realUserArea}>
                  <Bell size={16} style={{ color: '#64748B', cursor: 'pointer' }} />
                  <div className={styles.realAvatar}>AU</div>
                </div>
              </div>

              {/* Content Area */}
              <div className={styles.realContentArea}>
                {activeRealNav === 'dashboard' && (
                  <>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>Overview</div>
                    <div className={styles.kpiGrid}>
                      {[
                        { t: 'Total Revenue', v: '₦42,850,000', s: '+14.2% this month', c: '#10B981' },
                        { t: 'Deals Closed', v: '36 Won', s: '24% conversion rate', c: '#3B82F6' },
                        { t: 'Active Staff', v: '48 Members', s: '96% checked in today', c: '#7C3AED' },
                        { t: 'Active Assets', v: '184 Units', s: 'All operational', c: '#F59E0B' },
                      ].map((k) => (
                        <div key={k.t} className={styles.kpiCard}>
                          <div className={styles.kpiTitle}>{k.t}</div>
                          <div className={styles.kpiValue}>{k.v}</div>
                          <div className={styles.kpiSub} style={{ color: k.c }}>{k.s}</div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.panelGrid}>
                      <div className={styles.panelCard}>
                        <div className={styles.panelHeader}>
                          Monthly Revenue Trend
                          <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>6 Months</span>
                        </div>
                        <div className={styles.chartBars}>
                          {[
                            { m: 'Feb', h: 55 }, { m: 'Mar', h: 70 }, { m: 'Apr', h: 62 },
                            { m: 'May', h: 85 }, { m: 'Jun', h: 78 }, { m: 'Jul', h: 100 },
                          ].map((b) => (
                            <div key={b.m} className={styles.barGroup}>
                              <div className={styles.barFill} style={{ height: `${b.h}%` }} />
                              <div className={styles.barLabel}>{b.m}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.panelCard}>
                        <div className={styles.panelHeader}>Pipeline Breakdown</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          {[
                            { stage: 'Closed Won', pct: 36, color: '#10B981' },
                            { stage: 'Negotiation', pct: 24, color: '#3B82F6' },
                            { stage: 'Site Visit', pct: 22, color: '#7C3AED' },
                            { stage: 'New Lead', pct: 18, color: '#F59E0B' },
                          ].map((s) => (
                            <div key={s.stage}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                                <span>{s.stage}</span><span>{s.pct}%</span>
                              </div>
                              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${s.pct * 2.5}%`, background: s.color, borderRadius: '99px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeRealNav === 'sales' && (
                  <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>Sales &amp; Deals Pipeline</div>
                    <table className={styles.dataTable}>
                      <thead><tr><th>Deal Title</th><th>Contact</th><th>Value</th><th>Stage</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Victoria Island Commercial Complex</td>
                          <td>Chief O. Adebayo</td><td>₦450,000,000</td>
                          <td><span className={styles.badgeSuccess}>Closed Won</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Lekki Phase 1 Residential</td>
                          <td>Dr. Sandra Eke</td><td>₦85,000,000</td>
                          <td><span className={styles.badgeWarning}>Inspection</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Banana Island Penthouse</td>
                          <td>Mr. Tunde Bello</td><td>₦350,000,000</td>
                          <td><span className={styles.badgeSuccess}>Proposal</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeRealNav === 'hr' && (
                  <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>Staff Directory &amp; Attendance</div>
                    <table className={styles.dataTable}>
                      <thead><tr><th>Employee</th><th>Department</th><th>Check-In</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Michael Johnson</td><td>Sales</td><td>08:30 AM</td>
                          <td><span className={styles.badgeSuccess}>Present</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Sarah Akpan</td><td>Finance</td><td>08:45 AM</td>
                          <td><span className={styles.badgeSuccess}>Present</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>David Eze</td><td>HR</td><td>—</td>
                          <td><span className={styles.badgeWarning}>On Leave</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeRealNav === 'finance' && (
                  <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>Financial Ledger</div>
                    <table className={styles.dataTable}>
                      <thead><tr><th>Transaction</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Pro Plan Renewal</td><td>PST_9482014</td><td>₦25,000</td>
                          <td><span className={styles.badgeSuccess}>Paid</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Site Office Rent</td><td>EXP_0049</td><td>₦450,000</td>
                          <td><span className={styles.badgeWarning}>Expense</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeRealNav === 'facility' && (
                  <div className={styles.panelCard}>
                    <div className={styles.panelHeader}>Asset &amp; Facility Register</div>
                    <table className={styles.dataTable}>
                      <thead><tr><th>Asset</th><th>Location</th><th>Category</th><th>Status</th></tr></thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Industrial Generator 500kVA</td><td>Lekki Site</td><td>Machinery</td>
                          <td><span className={styles.badgeSuccess}>Operational</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Toyota Hilux Van</td><td>HQ Lagos</td><td>Vehicle</td>
                          <td><span className={styles.badgeWarning}>Maintenance</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES — HORIZONTAL SCROLL WITH COMPONENT SNIPPETS ══════════ */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Core Features</span>
          <h2 className={styles.sectionTitle}>Built for Real Estate Operations</h2>
          <p className={styles.sectionSubtitle}>
            Unified management suites designed specifically for real estate teams.
          </p>
        </div>

        <div className={styles.featureScrollTrack}>
          {/* Card 1: Sales & Deal Pipeline */}
          <div className={styles.featureCardSimple}>
            <div className={styles.featureCardHeader}>
              <div className={styles.featureCardIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className={styles.featureCardTitle}>Sales &amp; Deal Pipeline</h3>
                <p className={styles.featureCardDesc}>
                  Track every prospect from initial site visit to closed contract with stage-by-stage deal cards.
                </p>
              </div>
            </div>
            <div className={styles.componentSnippetBox}>
              <Image
                src="/comp-sales.png"
                alt="Sales Pipeline Component"
                width={360}
                height={220}
                className={styles.componentSnippetImg}
              />
            </div>
          </div>

          {/* Card 2: Workforce & HR Suite */}
          <div className={styles.featureCardSimple}>
            <div className={styles.featureCardHeader}>
              <div className={styles.featureCardIcon} style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <Users size={22} />
              </div>
              <div>
                <h3 className={styles.featureCardTitle}>Workforce &amp; HR Suite</h3>
                <p className={styles.featureCardDesc}>
                  Monitor team attendance rates, approve staff leave, and keep employee directories updated.
                </p>
              </div>
            </div>
            <div className={styles.componentSnippetBox}>
              <Image
                src="/comp-hr.png"
                alt="HR Attendance Component"
                width={360}
                height={220}
                className={styles.componentSnippetImg}
              />
            </div>
          </div>

          {/* Card 3: Finance & Ledger Control */}
          <div className={styles.featureCardSimple}>
            <div className={styles.featureCardHeader}>
              <div className={styles.featureCardIcon} style={{ background: '#ECFDF5', color: '#059669' }}>
                <CreditCard size={22} />
              </div>
              <div>
                <h3 className={styles.featureCardTitle}>Finance &amp; Ledger Control</h3>
                <p className={styles.featureCardDesc}>
                  Real-time income tracking, Paystack payment references, expenditure logs, and profit summaries.
                </p>
              </div>
            </div>
            <div className={styles.componentSnippetBox}>
              <div className={styles.miniComponentCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Total Monthly Revenue</span>
                  <span className={styles.badgeSuccess}>+14.2%</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A', marginBottom: '14px' }}>₦42,850,000</div>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Pro Subscription Renewal</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>PST_9482014 Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Facility & Asset Register */}
          <div className={styles.featureCardSimple}>
            <div className={styles.featureCardHeader}>
              <div className={styles.featureCardIcon} style={{ background: '#FFFBEB', color: '#D97706' }}>
                <Building2 size={22} />
              </div>
              <div>
                <h3 className={styles.featureCardTitle}>Facility &amp; Asset Register</h3>
                <p className={styles.featureCardDesc}>
                  Maintain full equipment history, site machinery records, and active maintenance statuses.
                </p>
              </div>
            </div>
            <div className={styles.componentSnippetBox}>
              <div className={styles.miniComponentCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Active Site Assets</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563EB' }}>184 Units</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Generator 500kVA (Lekki)</span>
                    <span className={styles.badgeSuccess}>Operational</span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>Toyota Hilux Van (HQ)</span>
                    <span className={styles.badgeWarning}>Maintenance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FULL-WIDTH PRICING PREVIEW ══════════ */}
      <div className={styles.fullWidthPricingWrapper}>
        <div className={styles.fullWidthPricingInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Transparent Plans</span>
            <h2 className={styles.sectionTitle}>Simple Pricing for Every Team</h2>
            <p className={styles.sectionSubtitle}>
              Choose your plan. Upgrade or cancel anytime with Paystack billing.
            </p>
          </div>

          <div className={styles.pricingToggle}>
            <span className={styles.toggleLabel} style={{ color: !isAnnual ? '#0F172A' : '#64748B' }}>Monthly</span>
            <div className={`${styles.toggleSwitch} ${isAnnual ? styles.toggleSwitchActive : ''}`} onClick={() => setIsAnnual(!isAnnual)}>
              <div className={`${styles.toggleKnob} ${isAnnual ? styles.toggleKnobActive : ''}`} />
            </div>
            <span className={styles.toggleLabel} style={{ color: isAnnual ? '#0F172A' : '#64748B' }}>Annual</span>
            <span className={styles.discountBadge}>SAVE 20%</span>
          </div>

          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.priceTier}>Basic</div>
              <div className={styles.priceAmount}>₦0</div>
              <div className={styles.priceSub}>Free forever for small teams</div>
              <div className={styles.priceDivider} />
              <div className={styles.priceFeatures}>
                {['Up to 5 team members', 'Core CRM & Lead Tracking', 'Standard Analytics', 'Task Management'].map(f => (
                  <div key={f} className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> {f}</div>
                ))}
              </div>
              <Link href="/register" className={`${styles.priceBtn} ${styles.priceBtnOutline}`}>Get Started Free</Link>
            </div>

            <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
              <span className={styles.popularTag}>MOST POPULAR</span>
              <div className={styles.priceTier}>Pro</div>
              <div className={styles.priceAmount}>{isAnnual ? '₦20,000' : '₦25,000'}<span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}> /mo</span></div>
              <div className={styles.priceSub}>{isAnnual ? 'Billed ₦240,000 annually' : 'Billed monthly'}</div>
              <div className={styles.priceDivider} />
              <div className={styles.priceFeatures}>
                {['Up to 25 members', 'All 4 Suites', 'Advanced Analytics', 'RBAC Permissions', 'Paystack Integration', 'Priority Support'].map(f => (
                  <div key={f} className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> {f}</div>
                ))}
              </div>
              <Link href="/register" className={`${styles.priceBtn} ${styles.priceBtnPrimary}`}>Start 14-Day Free Trial</Link>
            </div>

            <div className={styles.pricingCard}>
              <div className={styles.priceTier}>Enterprise</div>
              <div className={styles.priceAmount}>{isAnnual ? '₦80,000' : '₦100,000'}<span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}> /mo</span></div>
              <div className={styles.priceSub}>{isAnnual ? 'Billed annually' : 'Billed monthly'}</div>
              <div className={styles.priceDivider} />
              <div className={styles.priceFeatures}>
                {['Unlimited team members', 'Custom API Integrations', 'Dedicated Account Manager', 'Custom SLA Guarantees', 'Dedicated Hosting'].map(f => (
                  <div key={f} className={styles.priceFeatureItem}><Check size={14} style={{ color: '#10B981' }} /> {f}</div>
                ))}
              </div>
              <Link href="/pricing" className={`${styles.priceBtn} ${styles.priceBtnOutline}`}>View Full Details</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ FAQ ══════════ */}
      <section className={styles.section} id="faq">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Questions</span>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        </div>
        <div className={styles.faqGrid}>
          {[
            { q: 'How fast can our team get started?', a: 'You can register and set up your workspace in under 5 minutes. Inviting staff members and importing records takes less than 15 minutes.' },
            { q: 'How does subscription billing work?', a: 'Avera supports Paystack card, bank transfer, and USSD payments. Start on our Basic plan or upgrade directly in your organization settings.' },
            { q: 'Is our real estate data safe?', a: 'Yes. Avera uses PostgreSQL Row-Level Security (RLS). Every organization\'s data is fully isolated with row-level encryption.' },
            { q: 'Can we assign different permissions per staff?', a: 'Yes. Avera\'s RBAC engine supports Admin, Manager, Staff, and Agent roles, plus custom permission rules per module.' },
          ].map((item, idx) => (
            <div key={idx} className={styles.faqItem}>
              <div className={styles.faqQuestion} onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFaq === idx && <div className={styles.faqAnswer}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.ctaBanner}>
          <h2 className={styles.ctaBannerTitle}>Ready to Transform Your Real Estate Business?</h2>
          <p className={styles.ctaBannerSub}>
            Join real estate companies managing properties, staff, and deals seamlessly on Avera.
          </p>
          <div className={styles.ctaBannerActions}>
            <Link href="/register" className={styles.signupBtn} style={{ padding: '14px 32px', fontSize: '15px' }}>
              Start Free Trial <ArrowRight size={16} style={{ display: 'inline', marginLeft: '6px' }} />
            </Link>
            <Link href="/book-demo" className={styles.loginBtn} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px', fontSize: '15px' }}>
              Book a Demo
            </Link>
          </div>
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
              <Link href="#features" className={styles.footerLink}>Features</Link>
              <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
              <Link href="/book-demo" className={styles.footerLink}>Book Demo</Link>
              <Link href="/contact" className={styles.footerLink}>Contact Us</Link>
            </div>
          </div>
          <div>
            <div className={styles.footerColTitle}>Legal &amp; Security</div>
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
