'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import authStyles from '../auth.module.css';
import styles from '../form.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quick validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className={authStyles.topRightAction}>
        <Link href="/login" className="btn-outline">Back to Sign In &rarr;</Link>
      </div>
      <div className={authStyles.formWrapper}>
        {!sent ? (
          <>
            <div className={styles.formHeader}>
              <h1>Forgot your password?</h1>
              <p>Enter your email address and we&apos;ll send you a link to reset it.</p>
            </div>

            <form style={{width: '100%'}} onSubmit={handleSubmit}>
              {error && (
                <div style={{ 
                  color: '#EF4444', 
                  marginBottom: '16px', 
                  fontSize: '14px', 
                  background: '#FEE2E2', 
                  padding: '10px 14px', 
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
                  <span style={{ flex: 1 }}>{error}</span>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label htmlFor="reset-email">Email Address</label>
                <input 
                  id="reset-email"
                  type="email" 
                  className={styles.input} 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className={styles.footerText}>
              Remember your password? <Link href="/login">Sign In</Link>
            </div>
          </>
        ) : (
          <div className={styles.confirmationCard}>
            <div className={styles.confirmationIcon}>📧</div>
            <h2>Check your email</h2>
            <p>We&apos;ve sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the link to reset your password.</p>
            <div style={{marginTop: '24px'}}>
              <Link href="/login" className={`btn-primary ${styles.submitBtn}`} style={{display: 'inline-flex', padding: '14px 32px', textDecoration: 'none', justifyContent: 'center'}}>
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
