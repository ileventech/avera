'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import authStyles from '../auth.module.css';
import styles from '../form.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // If onboarding state is incomplete, resume onboarding flow
        const saved = localStorage.getItem('averaOnboardingState');
        let isOnboardingComplete = false;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.currentStep === 4) {
              isOnboardingComplete = true;
            }
          } catch {
            isOnboardingComplete = false;
          }
        }

        if (saved && !isOnboardingComplete) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className={authStyles.topRightAction}>
        <Link href="/register" className="btn-outline">Create Account &rarr;</Link>
      </div>
      <div className={authStyles.formWrapper}>
        <div className={styles.formHeader}>
          <h1>Sign in to Avera</h1>
          <p>Enter your credentials to access your workspace</p>
        </div>
        
        <form style={{width: '100%'}} onSubmit={handleLogin}>
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
            <label htmlFor="login-email">Email Address</label>
            <input 
              id="login-email"
              type="email" 
              className={styles.input} 
              placeholder="you@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'} 
                className={styles.input} 
                placeholder="••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" id="keep-signed-in" />
              Keep me signed in
            </label>
            <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
          </div>

          <div style={{marginTop: '24px'}}>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className={styles.footerText}>
          Don&apos;t have an account? <Link href="/register">Create Account</Link>
        </div>
      </div>
    </>
  );
}
