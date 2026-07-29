'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import authStyles from '../auth.module.css';
import styles from '../form.module.css';
import { usePaystackPayment } from 'react-paystack';
import { Check } from 'lucide-react';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { useSubscription } from '@/lib/supabase/useSubscription';
import { useToast } from '@/components/Toast';

const TIERS = [
  {
    id: 'free',
    name: 'Basic (Free)',
    price: 0,
    priceStr: '₦0',
    description: 'Perfect for small teams getting started.',
    features: ['Up to 5 users', 'Core CRM module', 'Basic analytics', 'Email support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 25000,
    priceStr: '₦25,000',
    description: 'Ideal for growing businesses needing more power.',
    features: ['Up to 25 users', 'All modules included', 'Advanced analytics', 'Priority 24/7 support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 100000,
    priceStr: '₦100,000',
    description: 'For large organizations with complex needs.',
    features: ['Unlimited users', 'Custom integrations', 'Dedicated account manager', 'SLA guarantees']
  }
];

export default function PaymentForm() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { recordPlan, subscription, loading: subLoading } = useSubscription();
  const toast = useToast();
  const [selectedTier, setSelectedTier] = useState<string>('pro');
  const [saving, setSaving] = useState(false);

  const TIER_RANKS: Record<string, number> = {
    free: 1,
    pro: 2,
    enterprise: 3
  };

  const currentTierId = subscription?.tier || 'free';
  const currentRank = TIER_RANKS[currentTierId];

  // Set default selection based on current plan
  const [hasSetDefault, setHasSetDefault] = useState(false);
  if (!subLoading && !hasSetDefault) {
    if (currentTierId === 'free') {
      setSelectedTier('pro');
    } else if (currentTierId === 'pro') {
      setSelectedTier('enterprise');
    } else {
      setSelectedTier('enterprise');
    }
    setHasSetDefault(true);
  }

  const selectedTierData = TIERS.find(t => t.id === selectedTier) || TIERS[1];
  const selectedRank = TIER_RANKS[selectedTierData.id];

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: selectedTierData.price * 100, // Amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: { reference: string; status: string; trans: string; transaction: string; message: string }) => {
    if (user) {
      const { error } = await recordPlan({
        tier: selectedTierData.id as 'free' | 'pro' | 'enterprise',
        amount: selectedTierData.price,
        currency: 'NGN',
        paystack_reference: reference.reference,
        created_by: user.id,
      });
      if (error) {
        toast.error('Payment was received but we could not update your plan: ' + error.message + ' (Ref: ' + reference.reference + ')');
        return;
      }
    }
    toast.success('Plan upgraded successfully! Welcome to ' + selectedTierData.name + '.');
    router.push('/dashboard');
  };

  const onClose = () => {
    console.log('Payment modal closed');
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRank === currentRank) return; // Prevent submitting for current plan
    if (selectedRank < currentRank) return; // Prevent downgrading

    if (selectedTierData.price === 0) {
      setSaving(true);
      if (user) {
        const { error } = await recordPlan({ tier: 'free', amount: 0, currency: 'NGN', created_by: user.id });
        setSaving(false);
        if (error) {
          toast.error('Could not activate the free plan: ' + error.message);
          return;
        }
      } else {
        setSaving(false);
      }
      toast.success('Plan updated successfully.');
      router.push('/dashboard');
    } else {
      initializePayment({ onSuccess, onClose });
    }
  };

  return (
    <div className={authStyles.onboardingLayout}>
      {/* Top Navigation */}
      <div className={authStyles.onboardingNav}>
        <div className={authStyles.logo}>Avera</div>
        {/* Show Back to Dashboard only when user is already signed in */}
        {user && (
          <div className={authStyles.navActions}>
            <Link href="/dashboard" className="btn-outline" style={{ padding: '8px 16px', fontSize: '14px' }}>
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className={authStyles.wizardContainer} style={{ maxWidth: '900px', marginTop: '60px' }}>
        <div className={styles.formHeader} style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px' }}>Choose your plan</h1>
          <p style={{ fontSize: '16px' }}>Select the best plan for your business. You can upgrade anytime.</p>
        </div>

        {subLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading plans…</div>
        ) : (
          <form onSubmit={handleContinue}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                const isCurrent = tier.id === currentTierId;
                const isDowngrade = TIER_RANKS[tier.id] < currentRank;

                return (
                  <div 
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    style={{
                      border: isSelected ? '2px solid #1E3A8A' : isCurrent ? '2px solid #10B981' : '1px solid #E5E9F2',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      background: isSelected ? '#F8FAFC' : '#FFFFFF',
                      opacity: isDowngrade ? 0.75 : 1,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                        Current Plan
                      </div>
                    )}
                    {isSelected && !isCurrent && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#1E3A8A', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                        Selected Option
                      </div>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>{tier.name}</h3>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#1E3A8A', marginBottom: '8px' }}>
                      {tier.priceStr} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748B' }}>/mo</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', minHeight: '40px' }}>
                      {tier.description}
                    </p>
                    
                    <div style={{ borderTop: '1px solid #E5E9F2', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {tier.features.map((feature, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#0F172A' }}>
                          <Check size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={saving || selectedRank === currentRank || selectedRank < currentRank}
                className={`btn-primary ${styles.submitBtn}`}
                style={{ 
                  width: 'auto', 
                  padding: '14px 40px', 
                  fontSize: '16px', 
                  opacity: (saving || selectedRank === currentRank || selectedRank < currentRank) ? 0.5 : 1,
                  cursor: (selectedRank === currentRank || selectedRank < currentRank) ? 'not-allowed' : 'pointer'
                }}
              >
                {saving 
                  ? 'Saving…' 
                  : selectedRank === currentRank 
                  ? 'Current Plan Active' 
                  : selectedRank < currentRank 
                  ? 'Downgrades not supported online' 
                  : `Upgrade to ${selectedTierData.name} Plan`
                }
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#64748B' }}>
              {selectedTierData.price > 0 && selectedRank > currentRank 
                ? 'Upgrade payments are securely processed by Paystack' 
                : ''
              }
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
