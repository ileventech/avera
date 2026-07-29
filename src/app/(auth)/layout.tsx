'use client';
import styles from './auth.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';

const bannerContent: Record<string, { headline: string; description: string }> = {
  '/login': {
    headline: 'Welcome back',
    description: 'Sign in to access your dashboard, manage your properties, and keep your team in sync — all from one place.',
  },
  '/register': {
    headline: 'Get started with Avera',
    description: 'Join thousands of real estate professionals who use Avera to manage sales, HR, and finance in one powerful platform.',
  },
  '/forgot-password': {
    headline: 'Reset your password',
    description: 'No worries — it happens. Enter your email and we\'ll send you instructions to get back on track.',
  },

  '/payment': {
    headline: 'Secure checkout',
    description: 'Your subscription is protected with enterprise-grade encryption. Start your free trial risk-free.',
  },
  '/onboarding': {
    headline: 'Let\'s set you up',
    description: 'A few quick steps to customize Avera for your team and workflows.',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const content = bannerContent[pathname] || bannerContent['/login'];

  const fullPageRoutes = ['/payment','/onboarding'];
  const isFullPage = fullPageRoutes.includes(pathname);
  if (isFullPage) {
    return (
      <ToastProvider>
        <div className={styles.fullPageContainer}>
          {children}
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className={styles.authContainer}>
        <div className={styles.authBanner}>
          <Link href="/" className={styles.logo}>Avera</Link>

          <div className={styles.bannerContent}>
            <h1 className={styles.bannerHeadline}>{content.headline}</h1>
            <p className={styles.bannerDescription}>{content.description}</p>
          </div>

          {/* Dashboard Preview Illustration */}
          <div className={styles.dashboardPreview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewDot}></span>
              <span className={styles.previewDot}></span>
              <span className={styles.previewDot}></span>
            </div>
            <div className={styles.previewStats}>
              <div className={styles.previewStat}>
                <div className={styles.previewStatValue}>₦2.4M</div>
                <div className={styles.previewStatLabel}>Revenue</div>
              </div>
              <div className={styles.previewStat}>
                <div className={styles.previewStatValue}>186</div>
                <div className={styles.previewStatLabel}>Properties</div>
              </div>
              <div className={styles.previewStat}>
                <div className={styles.previewStatValue}>94%</div>
                <div className={styles.previewStatLabel}>Retention</div>
              </div>
            </div>
            <div className={styles.previewChart}>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
              <div className={styles.chartBar}></div>
            </div>
          </div>
        </div>

        <div className={styles.authContent}>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
