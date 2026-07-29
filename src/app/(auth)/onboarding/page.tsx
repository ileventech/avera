'use client';
import { useState, useEffect } from 'react';
import { Users, DollarSign, Building2, PieChart, Home, User, Target, Check, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authStyles from '../auth.module.css';
import styles from '../form.module.css';
import { useOrganization } from '@/lib/supabase/useOrganization';
import { useCurrentUser } from '@/lib/supabase/useCurrentUser';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/Toast';

const STEPS = [
  { label: 'Company', key: 'company' },
  { label: 'Team', key: 'team' },
  { label: 'Modules', key: 'modules' },
  { label: 'First Data', key: 'data' },
  { label: 'Complete', key: 'complete' },
];

const MODULES = [
  { id: 'crm', name: 'CRM', desc: 'Manage contacts & relationships', icon: <Users size={20} />, bg: '#EFF6FF' },
  { id: 'sales', name: 'Sales', desc: 'Track deals & revenue', icon: <DollarSign size={20} />, bg: '#FEF3C7' },
  { id: 'hr', name: 'HR', desc: 'People & payroll management', icon: <Building2 size={20} />, bg: '#F0FDF4' },
  { id: 'finance', name: 'Finance', desc: 'Invoicing & accounting', icon: <PieChart size={20} />, bg: '#FDF2F8' },
];

const DATA_TYPES = [
  { id: 'site', name: 'Property / Site', desc: 'Add a listing', icon: <Home size={24} /> },
  { id: 'client', name: 'Client', desc: 'Add a contact', icon: <User size={24} /> },
  { id: 'lead', name: 'Lead', desc: 'Track a prospect', icon: <Target size={24} /> },
];

export default function Onboarding() {
  const router = useRouter();
  const { save: saveOrganization } = useOrganization();
  const { user } = useCurrentUser();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Company
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('real-estate');
  const [teamSize, setTeamSize] = useState('');

  // Step 2: Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  // Step 3: Modules
  const [selectedModules, setSelectedModules] = useState<string[]>(['crm']);

  // Step 4: Data type
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [firstRecordName, setFirstRecordName] = useState('');

  const [isLoaded, setIsLoaded] = useState(false);

  const restoreFromStorage = (parsed: Record<string, unknown>) => {
    if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep as number);
    if (parsed.companyName !== undefined) setCompanyName(parsed.companyName as string);
    if (parsed.industry !== undefined) setIndustry(parsed.industry as string);
    if (parsed.teamSize !== undefined) setTeamSize(parsed.teamSize as string);
    if (parsed.invitedEmails !== undefined) setInvitedEmails(parsed.invitedEmails as string[]);
    if (parsed.selectedModules !== undefined) setSelectedModules(parsed.selectedModules as string[]);
    if (parsed.selectedDataType !== undefined) setSelectedDataType(parsed.selectedDataType as string);
    if (parsed.firstRecordName !== undefined) setFirstRecordName(parsed.firstRecordName as string);
    setIsLoaded(true);
  };

  // Load state from localStorage on mount. This one-time hydration is exactly
  // what the effect exists to do, so the setState-in-effect rule is disabled here.
  useEffect(() => {
    const saved = localStorage.getItem('averaOnboardingState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        restoreFromStorage(parsed);
        return;
      } catch {
        // fall through to setIsLoaded below
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('averaOnboardingState', JSON.stringify({
      currentStep, companyName, industry, teamSize, invitedEmails, selectedModules, selectedDataType, firstRecordName
    }));
  }, [isLoaded, currentStep, companyName, industry, teamSize, invitedEmails, selectedModules, selectedDataType, firstRecordName]);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addInvite = () => {
    if (inviteEmail && !invitedEmails.includes(inviteEmail)) {
      setInvitedEmails([...invitedEmails, inviteEmail]);
      setInviteEmail('');
    }
  };

  const removeInvite = (email: string) => {
    setInvitedEmails(invitedEmails.filter(e => e !== email));
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGoToDashboard = async () => {
    const supabase = createClient();
    // Step 1: Save organization details
    if (companyName) {
      await saveOrganization({ name: companyName, industry, team_size: teamSize });
    }

    // Step 2: Send team invites (insert as pending staff entries)
    if (invitedEmails.length > 0) {
      const inviteRows = invitedEmails.map(email => ({
        name: email.split('@')[0],
        email,
        status: 'Invited',
        department: '',
        role: 'Staff',
      }));
      const { error: inviteError } = await supabase.from('staff').insert(inviteRows);
      if (inviteError) {
        toast.error('Could not send some invitations. You can add teammates from Settings.');
      }
    }

    // Step 4: Save first record
    if (selectedDataType && firstRecordName) {
      if (selectedDataType === 'client') {
        const { error } = await supabase.from('clients').insert({
          name: firstRecordName,
          status: 'Active',
          email: '',
          phone: '',
        });
        if (error) toast.error('Could not save client. You can add it later from the Clients page.');
      } else if (selectedDataType === 'lead') {
        const { error } = await supabase.from('leads').insert({
          name: firstRecordName,
          company: '',
          email: '',
          phone: '',
          status: 'New',
          source: 'Onboarding',
        });
        if (error) toast.error('Could not save lead. You can add it later from the Leads page.');
      } else if (selectedDataType === 'site') {
        const { error } = await supabase.from('sites').insert({
          name: firstRecordName,
          status: 'Active',
        });
        if (error) toast.error('Could not save site. You can add it later from the Projects page.');
      }
    }

    localStorage.removeItem('averaOnboardingState');
    toast.success('Welcome to Avera! Your workspace is ready.');
    router.push('/dashboard');
  };

  // ---------- STEP RENDERERS ----------

  const renderCompanySetup = () => (
    <div className={styles.wizardContent} key="step-company">
      <div className={styles.formHeader}>
        <h1>Set up your company</h1>
        <p>Tell us about your organization so we can customize Avera for you.</p>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="onb-company">Company Name</label>
        <input
          id="onb-company"
          type="text"
          className={styles.input}
          placeholder="Acme Real Estate Ltd"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="onb-industry">Industry</label>
        <select
          id="onb-industry"
          className={styles.input}
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="real-estate">Real Estate</option>
          <option value="construction">Construction</option>
          <option value="property-management">Property Management</option>
          <option value="consulting">Consulting</option>
          <option value="other">Other</option>
        </select>
        <div className={styles.helperText}>You can change this later in settings</div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="onb-teamsize">Team Size</label>
        <select
          id="onb-teamsize"
          className={styles.input}
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
        >
          <option value="">Select team size...</option>
          <option value="1-5">1–5 people</option>
          <option value="6-20">6–20 people</option>
          <option value="21-50">21–50 people</option>
          <option value="51-100">51–100 people</option>
          <option value="100+">100+ people</option>
        </select>
      </div>
    </div>
  );

  const renderInviteTeam = () => (
    <div className={styles.wizardContent} key="step-team">
      <div className={styles.formHeader}>
        <h1>Invite your team</h1>
        <p>Collaboration is better together. Add team members by email.</p>
      </div>

      <div className={styles.inviteRow}>
        <input
          type="email"
          className={styles.input}
          placeholder="colleague@company.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvite(); } }}
        />
        <button type="button" className={styles.addBtn} onClick={addInvite}>+ Add</button>
      </div>

      {invitedEmails.length > 0 && (
        <div className={styles.invitedList}>
          {invitedEmails.map((email) => (
            <div key={email} className={styles.invitedChip}>
              {email}
              <span className={styles.removeChip} onClick={() => removeInvite(email)}>×</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.helperText} style={{marginTop: '16px'}}>
        You can invite more team members later from your dashboard settings.
      </div>
    </div>
  );

  const renderSelectModules = () => (
    <div className={styles.wizardContent} key="step-modules">
      <div className={styles.formHeader}>
        <h1>Select your modules</h1>
        <p>Enable the features your team needs. You can adjust these anytime.</p>
      </div>

      <div className={styles.moduleGrid}>
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className={`${styles.moduleCard} ${selectedModules.includes(mod.id) ? styles.selected : ''}`}
            onClick={() => toggleModule(mod.id)}
          >
            <div className={styles.moduleIcon} style={{background: mod.bg}}>{mod.icon}</div>
            <div>
              <div className={styles.moduleName}>{mod.name}</div>
              <div className={styles.moduleDesc}>{mod.desc}</div>
            </div>
            <div className={`${styles.moduleCheckbox} ${selectedModules.includes(mod.id) ? styles.checked : ''}`}>
              {selectedModules.includes(mod.id) && <Check size={16} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFirstData = () => (
    <div className={styles.wizardContent} key="step-data">
      <div className={styles.formHeader}>
        <h1>Add your first record</h1>
        <p>Get started by adding one of the following to your workspace.</p>
      </div>

      <div className={styles.dataTypeGrid}>
        {DATA_TYPES.map((dt) => (
          <div
            key={dt.id}
            className={`${styles.dataTypeCard} ${selectedDataType === dt.id ? styles.selected : ''}`}
            onClick={() => setSelectedDataType(dt.id)}
          >
            <div className={styles.dataTypeIcon}>{dt.icon}</div>
            <div className={styles.dataTypeName}>{dt.name}</div>
            <div className={styles.dataTypeDesc}>{dt.desc}</div>
          </div>
        ))}
      </div>

      {selectedDataType && (
        <div style={{width: '100%', marginTop: '20px'}}>
          <div className={styles.formGroup}>
            <label htmlFor="first-record-name">
              {selectedDataType === 'site' ? 'Property / Site Name' : selectedDataType === 'client' ? 'Client Name' : 'Lead Name'}
            </label>
            <input
              id="first-record-name"
              type="text"
              className={styles.input}
              value={firstRecordName}
              onChange={(e) => setFirstRecordName(e.target.value)}
              placeholder={
                selectedDataType === 'site' ? 'e.g. Sunset Boulevard Apartments'
                : selectedDataType === 'client' ? 'e.g. John Smith'
                : 'e.g. Sarah Johnson'
              }
            />
            <div className={styles.helperText}>You can add more details later</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletion = () => (
    <div className={styles.wizardContent} key="step-complete">
      <div className={styles.completionScreen}>
        <div className={styles.completionIcon} style={{ background: '#EFF6FF', color: '#1E3A8A', padding: '24px', borderRadius: '50%', marginBottom: '24px', display: 'inline-flex' }}>
          <PartyPopper size={48} />
        </div>
        <h1>Your workspace is ready!</h1>
        <p>
          Everything is set up and ready to go. Start exploring your dashboard,
          manage your properties, and grow your business with Avera.
        </p>
        <button
          className={`btn-primary ${styles.submitBtn}`}
          style={{maxWidth: '280px', margin: '0 auto'}}
          onClick={handleGoToDashboard}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  const stepRenderers = [
    renderCompanySetup,
    renderInviteTeam,
    renderSelectModules,
    renderFirstData,
    renderCompletion,
  ];

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', width: '100%' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 700, color: '#1E3A8A', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          Avera
        </Link>
        {!user && (
          <Link href="/login" className="btn-outline">
            Sign In
          </Link>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className={authStyles.formWrapperFull}>
          {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressSteps}>
          {STEPS.map((step, idx) => (
            <div key={step.key} className={styles.progressStep}>
              <div
                className={`${styles.stepCircle} ${
                  idx === currentStep ? styles.active :
                  idx < currentStep ? styles.completed : ''
                }`}
              >
                {idx < currentStep ? <Check size={14} /> : idx + 1}
              </div>
              <div
                className={`${styles.stepLabel} ${
                  idx === currentStep ? styles.active :
                  idx < currentStep ? styles.completed : ''
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {stepRenderers[currentStep]()}

      {/* Navigation */}
      {!isLastStep && (
        <div className={styles.wizardActions}>
          {!isFirstStep ? (
            <button type="button" className={styles.backBtn} onClick={goBack}>
              ← Back
            </button>
          ) : <div></div>}

          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            {currentStep === 1 && (
              <button type="button" className={styles.skipBtn} onClick={goNext}>
                Skip for now
              </button>
            )}
            {currentStep === 3 && (
              <button type="button" className={styles.skipBtn} onClick={goNext}>
                Skip this step
              </button>
            )}
            <button type="button" className={styles.nextBtn} onClick={goNext}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
      </div>
    </div>
  );
}
