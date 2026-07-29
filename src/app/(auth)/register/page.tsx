'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import authStyles from '../auth.module.css';
import styles from '../form.module.css';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Dynamic password validation rules
  const meetsLength = password.length >= 8;
  const meetsNumber = /\d/.test(password);
  const meetsSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = meetsLength && meetsNumber && meetsSpecial;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify fields
    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirement criteria.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className={authStyles.topRightAction}>
        <Link href="/login" className="btn-outline">Sign In &rarr;</Link>
      </div>
      <div className={authStyles.formWrapper}>
        <div className={styles.formHeader}>
          <h1>Get started with Avera</h1>
          <p>Start your free trial — no credit card required.</p>
        </div>
        
        <form style={{width: '100%'}} onSubmit={handleRegister}>
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
            <label htmlFor="reg-name">Full Name</label>
            <input 
              id="reg-name"
              type="text" 
              className={styles.input} 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reg-email">Work Email</label>
            <input 
              id="reg-email"
              type="email" 
              className={styles.input} 
              placeholder="john@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="reg-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input 
                id="reg-password"
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
            
            <div className={styles.passwordRules}>
              <div className={`${styles.rule} ${meetsLength ? styles.valid : ''}`}>
                <span className={`${styles.ruleIcon} ${meetsLength ? styles.checked : ''}`}>
                  {meetsLength ? <Check size={10} strokeWidth={3} /> : null}
                </span> 
                Must be at least 8 characters
              </div>
              <div className={`${styles.rule} ${meetsNumber ? styles.valid : ''}`}>
                <span className={`${styles.ruleIcon} ${meetsNumber ? styles.checked : ''}`}>
                  {meetsNumber ? <Check size={10} strokeWidth={3} /> : null}
                </span> 
                Must include a number
              </div>
              <div className={`${styles.rule} ${meetsSpecial ? styles.valid : ''}`}>
                <span className={`${styles.ruleIcon} ${meetsSpecial ? styles.checked : ''}`}>
                  {meetsSpecial ? <Check size={10} strokeWidth={3} /> : null}
                </span> 
                Must include a special character
              </div>
            </div>
          </div>

          <div className={styles.terms}>
            By clicking &quot;Create Account&quot; you agree to Avera&apos;s{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className={styles.spinner} size={18} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footerText}>
          Already have an account? <Link href="/login">Sign In</Link>
        </div>
      </div>
    </>
  );
}
