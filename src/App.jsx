import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Bell, Box,
  BriefcaseMedical, Building2, Camera, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleDollarSign, ClipboardPlus, Clock3, HeartPulse, LayoutDashboard,
  LoaderCircle, LogOut, Mail, Menu, PackagePlus, Plus, RefreshCw, Search, ShieldCheck,
  Stethoscope, Store, Trash2, Upload, UserCog, UserRound, Wrench, X,
} from 'lucide-react';
import * as api from './api';
import teamIllustration from '../assets/medicare-team.png';

const SESSION_KEY = 'medicare-session';
const HOSPITALS = [
  { id: 'aiims-delhi', seedVersion: 1, name: 'AIIMS', city: 'New Delhi', specialization: 'Multi-speciality', address: 'Ansari Nagar, New Delhi, Delhi 110029' },
  { id: 'apollo-delhi', seedVersion: 1, name: 'Apollo Hospital', city: 'New Delhi', specialization: 'Multi-speciality', address: 'Sarita Vihar, New Delhi, Delhi 110076' },
  { id: 'artemis-gurugram', seedVersion: 1, name: 'Artemis Hospital', city: 'Gurugram', specialization: 'Multi-speciality', address: 'Sector 51, Gurugram, Haryana 122001' },
  { id: 'fortis-gurugram', seedVersion: 1, name: 'Fortis Hospital', city: 'Gurugram', specialization: 'Multi-speciality', address: 'Sector 44, Gurugram, Haryana 122002' },
  { id: 'max-delhi', seedVersion: 1, name: 'Max Super Speciality Hospital', city: 'New Delhi', specialization: 'Super-speciality', address: 'Saket, New Delhi, Delhi 110017' },
  { id: 'medanta-gurugram', seedVersion: 1, name: 'Medanta Hospital', city: 'Gurugram', specialization: 'Multi-speciality', address: 'Sector 38, Gurugram, Haryana 122001' },
];

const EQUIPMENT_SEED_DEFAULTS = {
  seedVersion: 3,
  hospitalId: 'apollo-delhi',
  hospitalName: 'Apollo Hospital',
  location: '3rd Floor',
  plotNo: '111 and 112',
  type: 'Medical Furniture',
  make: 'MMS',
  model: 'NA',
  serialNo: 'NA',
  doi: '2020',
  ppmDoneOn: '2025-04-02',
  ppmDueOn: '2025-10-02',
  status: 'Functional',
  remarks: '',
};

const MEDICAL_EQUIPMENT_SEEDS = [
  { id: 'seed-iv-stand-ot1', sNo: 1, department: 'OT-1', equipmentName: 'IV Stand', quantity: 2, remarks: 'pk test' },
  { id: 'seed-020-pre-op-patient-bed-manual', sNo: 20, department: 'Pre-Op', equipmentName: 'Patient Bed Manual', quantity: 2 },
  { id: 'seed-021-ot-store-instrument-trolley', sNo: 21, department: 'OT Store', equipmentName: 'Instrument Trolley', quantity: 1 },
  { id: 'seed-022-ot-store-cidex-chamber', sNo: 22, department: 'OT Store', equipmentName: 'Cidex Chamber', quantity: 2 },
  { id: 'seed-023-ot-store-formalin-chamber', sNo: 23, department: 'OT Store', equipmentName: 'Formalin Chamber', quantity: 4 },
  { id: 'seed-024-ot-store-lead-apron-regular', sNo: 24, department: 'OT Store', equipmentName: 'Lead Apron Regular', quantity: 6 },
  { id: 'seed-025-ot-store-iv-stand', sNo: 25, department: 'OT Store', equipmentName: 'IV Stand', quantity: 1 },
  { id: 'seed-026-ot-store-laproscopy-trolley', sNo: 26, department: 'OT Store', equipmentName: 'Laproscopy Trolley', quantity: 1 },
  { id: 'seed-027-day-care-patient-bed-manual', sNo: 27, plotNo: '119', department: 'Day Care', equipmentName: 'Patient Bed Manual', quantity: 8 },
  { id: 'seed-028-day-care-medicine-cupboard', sNo: 28, plotNo: '119', department: 'Day Care', equipmentName: 'Medicine Cupboard', quantity: 8 },
  { id: 'seed-029-day-care-cardiac-table', sNo: 29, plotNo: '119', department: 'Day Care', equipmentName: 'Cardiac Table', quantity: 8 },
  { id: 'seed-030-day-care-iv-stand', sNo: 30, plotNo: '119', department: 'Day Care', equipmentName: 'IV Stand', quantity: 8 },
  { id: 'seed-031-day-care-foot-step-single-ss', sNo: 31, plotNo: '119', department: 'Day Care', equipmentName: 'Foot Step Single SS', quantity: 8 },
  { id: 'seed-032-day-care-view-box-single', sNo: 32, plotNo: '119', department: 'Day Care', equipmentName: 'View Box Single', quantity: 1 },
  { id: 'seed-033-day-care-stretcher', sNo: 33, plotNo: '119', department: 'Day Care', equipmentName: 'Stretcher', quantity: 1 },
  { id: 'seed-034-day-care-wheel-chair', sNo: 34, plotNo: '119', department: 'Day Care', equipmentName: 'Wheel Chair', quantity: 1 },
  { id: 'seed-035-day-care-dressing-trolley', sNo: 35, plotNo: '119', department: 'Day Care', equipmentName: 'Dressing Trolley', quantity: 1 },
  { id: 'seed-036-day-care-commode-chair', sNo: 36, plotNo: '119', department: 'Day Care', equipmentName: 'Commode Chair', quantity: 1 },
  { id: 'seed-037-waiting-area-patient-stool', sNo: 37, location: '2nd Floor', department: 'Waiting Area', equipmentName: 'Patient Stool', quantity: 1 },
  { id: 'seed-038-nursing-counter-dressing-trolley', sNo: 38, location: '2nd Floor', department: 'Nursing Counter', equipmentName: 'Dressing Trolley', quantity: 1 },
  { id: 'seed-039-single-room-patient-bed-elecric', sNo: 39, location: '2nd Floor', department: 'Single Room', equipmentName: 'Patient Bed Elecric', quantity: 10 },
  { id: 'seed-040-single-room-iv-stand', sNo: 40, location: '2nd Floor', department: 'Single Room', equipmentName: 'IV Stand', quantity: 10 },
  { id: 'seed-041-single-room-cardiac-table', sNo: 41, location: '2nd Floor', department: 'Single Room', equipmentName: 'Cardiac Table', quantity: 10 },
  { id: 'seed-042-single-room-medicine-cupboard', sNo: 42, location: '2nd Floor', department: 'Single Room', equipmentName: 'Medicine Cupboard', quantity: 10 },
].map((seed) => ({ ...EQUIPMENT_SEED_DEFAULTS, ...seed }));

function cx(...values) { return values.filter(Boolean).join(' '); }
function messageOf(error, fallback = 'Something went wrong. Please try again.') {
  return error instanceof Error ? error.message : fallback;
}
function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatPrice(price) { return Number(price || 0).toLocaleString('en-IN'); }
function formatInventoryDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
}

function Brand({ light = false }) {
  return (
    <div className={cx('brand', light && 'brand--light')}>
      <span className="brand__mark"><HeartPulse size={22} strokeWidth={2.5} /></span>
      <span className="brand__copy"><strong>MediCare</strong><small>SUPPORT</small></span>
    </div>
  );
}

function Button({ children, icon: Icon, variant = 'primary', className, loading, ...props }) {
  return (
    <button className={cx('button', `button--${variant}`, className)} disabled={loading || props.disabled} {...props}>
      {loading ? <LoaderCircle className="spin" size={17} /> : Icon ? <Icon size={17} /> : null}
      <span>{children}</span>
    </button>
  );
}

function IconButton({ label, children, className, ...props }) {
  return <button className={cx('icon-button', className)} aria-label={label} title={label} {...props}>{children}</button>;
}

function Field({ label, error, hint, multiline, icon: Icon, className, ...props }) {
  const Control = multiline ? 'textarea' : 'input';
  return (
    <label className={cx('field', className)}>
      <span className="field__label">{label}</span>
      <span className={cx('field__control', error && 'field__control--error')}>
        {Icon ? <Icon size={18} /> : null}
        <Control {...props} />
      </span>
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={cx('toast', `toast--${toast.type || 'success'}`)} role="status">
      {toast.type === 'error' ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}
      <div><strong>{toast.title}</strong>{toast.message ? <p>{toast.message}</p> : null}</div>
      <IconButton label="Close notification" onClick={onClose}><X size={17} /></IconButton>
    </div>
  );
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', confirmEmail: '', password: '', confirmPassword: '', role: 'doctor' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setServerError('');
  };

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const email = form.email.trim();
    if (!email.includes('@')) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 7) nextErrors.password = 'Use at least 7 characters.';
    if (!isLogin && form.confirmEmail.trim() !== email) nextErrors.confirmEmail = 'Email addresses do not match.';
    if (!isLogin && form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setLoading(true);
    setServerError('');
    try {
      const session = isLogin
        ? await api.login(email, form.password)
        : await api.createUser(email, form.password, form.role);
      onAuthenticated(session);
    } catch (error) {
      setServerError(messageOf(error, isLogin ? 'Could not sign you in.' : 'Could not create your account.'));
    } finally { setLoading(false); }
  }

  function changeMode() {
    setMode(isLogin ? 'signup' : 'login');
    setErrors({}); setServerError('');
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="MediCare Support introduction">
        <img src={teamIllustration} alt="A doctor and medical equipment technician reviewing a patient monitor" />
        <div className="auth-visual__shade" />
        <div className="auth-visual__top"><Brand light /></div>
        <div className="auth-visual__content">
          <span className="eyebrow eyebrow--light"><ShieldCheck size={15} /> CONNECTED CARE OPERATIONS</span>
          <h1>Keep critical equipment<br />ready for care.</h1>
          <p>One secure workspace for clinical teams and technicians to report, resolve, and manage medical equipment.</p>
          <div className="trust-row">
            <span><Check size={15} /> Faster fault reporting</span>
            <span><Check size={15} /> Shared device inventory</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-brand"><Brand /></div>
        <div className="auth-card">
          <span className="eyebrow">MEDICAL SUPPORT PORTAL</span>
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-card__intro">{isLogin ? 'Sign in to access your assigned workspace.' : 'Join your team and choose your working role.'}</p>
          <form onSubmit={submit} noValidate>
            <Field label="Email address" type="email" autoComplete="email" placeholder="name@hospital.com" value={form.email} onChange={update('email')} error={errors.email} icon={Mail} />
            {!isLogin ? <Field label="Confirm email" type="email" autoComplete="email" placeholder="Re-enter your email" value={form.confirmEmail} onChange={update('confirmEmail')} error={errors.confirmEmail} icon={Mail} /> : null}
            <Field label="Password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Enter your password" value={form.password} onChange={update('password')} error={errors.password} icon={ShieldCheck} />
            {!isLogin ? <Field label="Confirm password" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} icon={ShieldCheck} /> : null}
            {!isLogin ? (
              <fieldset className="role-picker">
                <legend>Account role</legend>
                <button type="button" className={cx(form.role === 'doctor' && 'selected')} onClick={() => setForm((current) => ({ ...current, role: 'doctor' }))}>
                  <span><Stethoscope size={20} /></span><span><strong>Doctor</strong><small>Report equipment faults</small></span>{form.role === 'doctor' ? <CheckCircle2 size={18} /> : null}
                </button>
                <button type="button" className={cx(form.role === 'technician' && 'selected')} onClick={() => setForm((current) => ({ ...current, role: 'technician' }))}>
                  <span><Wrench size={20} /></span><span><strong>Technician</strong><small>Review and resolve faults</small></span>{form.role === 'technician' ? <CheckCircle2 size={18} /> : null}
                </button>
                <button type="button" className={cx(form.role === 'admin' && 'selected')} onClick={() => setForm((current) => ({ ...current, role: 'admin' }))}>
                  <span><ShieldCheck size={20} /></span><span><strong>Admin</strong><small>Manage doctors and hospitals</small></span>{form.role === 'admin' ? <CheckCircle2 size={18} /> : null}
                </button>
              </fieldset>
            ) : null}
            {serverError ? <div className="inline-error"><AlertTriangle size={17} /><span>{serverError}</span></div> : null}
            <Button type="submit" loading={loading} icon={ArrowRight} className="auth-submit">{loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign in to workspace' : 'Create account')}</Button>
          </form>
          <p className="auth-switch">{isLogin ? 'New to MediCare Support?' : 'Already have an account?'} <button type="button" onClick={changeMode}>{isLogin ? 'Create an account' : 'Sign in instead'}</button></p>
        </div>
        <p className="auth-footer">Protected medical operations workspace · MediCare Support</p>
      </section>
    </main>
  );
}

function EmptyState({ icon: Icon = Box, title, text, action }) {
  return (
    <div className="empty-state">
      <span><Icon size={24} /></span><h3>{title}</h3><p>{text}</p>{action}
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action, onBack }) {
  return (
    <div className="page-intro">
      <div className="page-intro__copy">
        {onBack ? <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back</button> : <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1><p>{description}</p>
      </div>
      {action ? <div className="page-intro__action">{action}</div> : null}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, tone = 'green' }) {
  return (
    <article className="stat-card">
      <span className={cx('stat-card__icon', `stat-card__icon--${tone}`)}><Icon size={20} /></span>
      <div><strong>{value}</strong><span>{label}</span></div>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={cx('status', status === 'Approved' ? 'status--approved' : 'status--pending')}>{status === 'Approved' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{status}</span>;
}

function ReportRow({ report, technician, approving, onApprove }) {
  return (
    <article className="report-row">
      <div className="report-row__icon"><AlertTriangle size={20} /></div>
      <div className="report-row__body">
        <div className="report-row__top"><div><h3>{report.device}</h3><p>{report.faultTitle || 'Equipment fault'}</p></div><StatusBadge status={report.status} /></div>
        {report.description ? <p className="report-row__description">{report.description}</p> : null}
        <div className="report-row__meta"><span>{formatDate(report.createdAt)}</span>{report.hospitalName ? <span><Building2 size={13} /> {report.hospitalName}</span> : null}{report.doctorEmail ? <span><Mail size={13} /> {report.doctorEmail}</span> : null}</div>
        {technician && report.status === 'Pending' ? <Button loading={approving} onClick={() => onApprove(report)} icon={CheckCircle2} className="report-row__approve">{approving ? 'Approving…' : 'Approve report'}</Button> : null}
        {!technician && report.status === 'Approved' && report.technicianEmail ? <a className="contact-link" href={`mailto:${report.technicianEmail}`}><Mail size={15} /> Contact technician · {report.technicianEmail}</a> : null}
      </div>
    </article>
  );
}

function Dashboard({ session, reports, devices, loading, error, onNavigate, onRefresh, onApprove, approvingId, doctorHospitals = [], activeHospital, primaryHospitalId, hospitalContextLoading, hospitalContextError, onHospitalChange }) {
  const isTechnician = session.role === 'technician';
  const isAdmin = session.role === 'admin';
  const isDoctor = session.role === 'doctor';
  const mine = reports.filter((item) => item.reportedById === session.userId);
  const visibleReports = isTechnician ? reports.filter((item) => item.status === 'Pending') : isAdmin ? reports : mine;
  const approvedMine = mine.filter((item) => item.status === 'Approved');
  const myApprovals = reports.filter((item) => item.status === 'Approved' && item.technicianId === session.userId);
  const name = session.email.split('@')[0] || 'there';
  const workspaceName = isAdmin ? 'Administrator workspace' : isTechnician ? 'Technician workspace' : activeHospital ? `${activeHospital.name} workspace` : 'Doctor workspace';
  const heroTitle = isAdmin ? 'Manage your clinical network' : isTechnician ? `${visibleReports.length} fault${visibleReports.length === 1 ? '' : 's'} waiting for review` : activeHospital ? `Equipment support at ${activeHospital.name}` : 'No hospital workspace assigned';
  const heroText = isAdmin ? 'Assign doctors to one or more hospitals and keep affiliations accurate.' : isTechnician ? 'Approve a report to connect with the reporting doctor.' : activeHospital ? 'Only equipment registered to this hospital will be available when reporting a device fault.' : 'Ask an administrator to assign at least one hospital before reporting an equipment fault.';

  return (
    <div>
      <PageIntro eyebrow="OVERVIEW" title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${name}`} description={isAdmin ? 'Manage users, hospital affiliations, and activity across the network.' : isTechnician ? 'Review incoming equipment issues and keep clinical teams moving.' : 'Track equipment faults, approvals, and shared marketplace listings.'} action={<Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>Refresh</Button>} />
      {isDoctor ? (
        <section className="doctor-workspace-card" aria-label="Active hospital workspace">
          <span className="doctor-workspace-card__icon"><Building2 size={24} /></span>
          <div className="doctor-workspace-card__details">
            <span className="eyebrow">ACTIVE HOSPITAL WORKSPACE</span>
            {hospitalContextLoading ? <strong>Loading your hospital assignment…</strong> : activeHospital ? <><div><strong>{activeHospital.name}</strong>{activeHospital.id === primaryHospitalId ? <span className="hospital-badge hospital-badge--primary">Primary</span> : null}</div><p>{activeHospital.specialization || 'General hospital'} · {activeHospital.address || activeHospital.city}</p></> : <><strong>No hospital assigned</strong><p>An administrator must assign a hospital to your doctor profile.</p></>}
          </div>
          <div className="doctor-workspace-card__switcher">
            <label htmlFor="doctor-hospital-workspace">Switch hospital</label>
            <span className="field__control field__control--select">
              <select id="doctor-hospital-workspace" value={activeHospital?.id || ''} onChange={(event) => onHospitalChange(event.target.value)} disabled={hospitalContextLoading || !doctorHospitals.length}>
                {!doctorHospitals.length ? <option value="">No assigned hospitals</option> : null}
                {doctorHospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
              </select>
              <ChevronDown size={17} />
            </span>
          </div>
        </section>
      ) : null}
      {hospitalContextError ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{hospitalContextError}</span></div> : null}
      <section className="hero-strip">
        <div>
          <span className="hero-strip__label"><Activity size={15} /> {workspaceName}</span>
          <h2>{heroTitle}</h2>
          <p>{heroText}</p>
          <Button variant="light" icon={isAdmin ? UserCog : isTechnician ? AlertTriangle : ClipboardPlus} disabled={isDoctor && !activeHospital} onClick={() => onNavigate(isAdmin ? 'doctor-hospitals' : isTechnician ? 'reports' : 'report')}>{isAdmin ? 'Manage hospital mapping' : isTechnician ? 'Review pending faults' : 'Report a device fault'}</Button>
        </div>
        <div className="hero-strip__ornament"><HeartPulse size={72} strokeWidth={1.2} /></div>
      </section>
      <section className="stats-grid" aria-label="Workspace summary">
        {isAdmin ? <>
          <StatCard icon={ClipboardPlus} value={reports.length} label="Total fault reports" />
          <StatCard icon={AlertTriangle} value={reports.filter((item) => item.status === 'Pending').length} label="Pending faults" tone="amber" />
          <StatCard icon={Store} value={devices.length} label="Marketplace devices" tone="sage" />
        </> : isTechnician ? <>
          <StatCard icon={AlertTriangle} value={visibleReports.length} label="Pending faults" tone="amber" />
          <StatCard icon={BadgeCheck} value={myApprovals.length} label="Approved by me" />
          <StatCard icon={Store} value={devices.length} label="Marketplace devices" tone="sage" />
        </> : <>
          <StatCard icon={ClipboardPlus} value={mine.length} label="Fault reports sent" />
          <StatCard icon={BadgeCheck} value={approvedMine.length} label="Technician approved" />
          <StatCard icon={Clock3} value={mine.length - approvedMine.length} label="Awaiting approval" tone="amber" />
          <StatCard icon={Building2} value={doctorHospitals.length} label="Assigned hospitals" tone="sage" />
        </>}
      </section>
      {error ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={onRefresh}>Try again</button></div> : null}
      <div className="dashboard-columns">
        <section className="content-card">
          <div className="section-heading"><div><span className="eyebrow">{isAdmin ? 'NETWORK ACTIVITY' : isTechnician ? 'ACTION NEEDED' : 'FAULT TRACKING'}</span><h2>{isAdmin ? 'Recent reports' : isTechnician ? 'Pending reports' : 'My recent reports'}</h2></div><button className="text-button" onClick={() => onNavigate('reports')}>View all <ChevronRight size={16} /></button></div>
          {loading && !reports.length ? <div className="loading-block"><LoaderCircle className="spin" /><span>Loading fault reports…</span></div> : visibleReports.length ? visibleReports.slice(0, 3).map((report) => <ReportRow key={report.id} report={report} technician={isTechnician} approving={approvingId === report.id} onApprove={onApprove} />) : <EmptyState icon={BadgeCheck} title="All clear" text={isAdmin ? 'There is no fault-report activity yet.' : isTechnician ? 'There are no pending reports right now.' : 'Your fault reports will appear here.'} />}
        </section>
        <aside className="content-card quick-card">
          <div className="section-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Get things done</h2></div></div>
          {session.role === 'doctor' ? <button className="quick-action" disabled={!activeHospital} onClick={() => onNavigate('report')}><span><ClipboardPlus size={20} /></span><div><strong>Report a fault</strong><small>{activeHospital ? activeHospital.name : 'Hospital assignment required'}</small></div><ChevronRight size={18} /></button> : null}
          {isAdmin ? <button className="quick-action" onClick={() => onNavigate('manage-hospitals')}><span><Building2 size={20} /></span><div><strong>Manage hospitals</strong><small>Create directory records</small></div><ChevronRight size={18} /></button> : null}
          {isAdmin ? <button className="quick-action" onClick={() => onNavigate('doctor-hospitals')}><span><UserCog size={20} /></span><div><strong>Map doctors</strong><small>Manage hospital assignments</small></div><ChevronRight size={18} /></button> : null}
          {isAdmin ? <button className="quick-action" onClick={() => onNavigate('device-entry')}><span><PackagePlus size={20} /></span><div><strong>Add equipment</strong><small>Create an inventory record</small></div><ChevronRight size={18} /></button> : null}
          <button className="quick-action" onClick={() => onNavigate('marketplace')}><span><Store size={20} /></span><div><strong>Browse marketplace</strong><small>{devices.length} device listings</small></div><ChevronRight size={18} /></button>
          <button className="quick-action" onClick={() => onNavigate('add-device')}><span><PackagePlus size={20} /></span><div><strong>List a device</strong><small>Add equipment for sale</small></div><ChevronRight size={18} /></button>
          <div className="support-note"><ShieldCheck size={20} /><div><strong>Secure workspace</strong><p>Records are protected by your authenticated hospital account.</p></div></div>
        </aside>
      </div>
    </div>
  );
}

function ReportsPage({ session, reports, loading, error, onRefresh, onApprove, approvingId }) {
  const isTechnician = session.role === 'technician';
  const isAdmin = session.role === 'admin';
  const [filter, setFilter] = useState('all');
  const base = isTechnician || isAdmin ? reports : reports.filter((item) => item.reportedById === session.userId);
  const filtered = filter === 'all' ? base : base.filter((item) => item.status.toLowerCase() === filter);
  return (
    <div>
      <PageIntro eyebrow="FAULT MANAGEMENT" title={isAdmin ? 'All fault reports' : isTechnician ? 'Fault report queue' : 'My fault reports'} description={isAdmin ? 'Monitor equipment issues and resolution status across the network.' : isTechnician ? 'Review incoming issues from doctors and approve them for follow-up.' : 'Track every equipment issue you have submitted.'} action={<Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>Refresh</Button>} />
      <section className="content-card">
        <div className="toolbar"><div className="segmented" aria-label="Filter fault reports">{['all', 'pending', 'approved'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)} <span>{value === 'all' ? base.length : base.filter((item) => item.status.toLowerCase() === value).length}</span></button>)}</div></div>
        {error ? <div className="inline-error panel-error"><AlertTriangle size={18} />{error}</div> : null}
        {loading && !reports.length ? <div className="loading-block"><LoaderCircle className="spin" /><span>Loading reports…</span></div> : filtered.length ? filtered.map((report) => <ReportRow key={report.id} report={report} technician={isTechnician} approving={approvingId === report.id} onApprove={onApprove} />) : <EmptyState icon={ClipboardPlus} title="No reports found" text="There are no reports matching this filter." />}
      </section>
    </div>
  );
}

function DeviceCard({ device, own, deleting, onDelete }) {
  return (
    <article className="device-card">
      <div className="device-card__visual"><BriefcaseMedical size={34} strokeWidth={1.6} /><span>Listed</span></div>
      <div className="device-card__body">
        <div className="device-card__top"><span className="device-tag">{device.listedByRole === 'technician' ? 'Technician listed' : 'Doctor listed'}</span>{own ? <IconButton label={`Delete ${device.name}`} onClick={() => onDelete(device)} disabled={deleting}><Trash2 size={17} /></IconButton> : null}</div>
        <h3>{device.name}</h3><p>Model {device.model}</p>
        <div className="device-card__footer"><strong>₹{formatPrice(device.price)}</strong><span><UserRound size={14} /> {device.listedByName || 'Unknown user'}</span></div>
      </div>
    </article>
  );
}

function Marketplace({ session, devices, loading, error, onRefresh, onNavigate, onDelete, deletingId }) {
  const [query, setQuery] = useState('');
  const filtered = devices.filter((item) => `${item.name} ${item.model} ${item.listedByName}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <PageIntro eyebrow="SHARED INVENTORY" title="Medical device marketplace" description="Browse equipment shared by doctors and technicians in your network." action={<Button icon={PackagePlus} onClick={() => onNavigate('add-device')}>List a device</Button>} />
      <div className="market-toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search devices, models, or sellers" /></label>
        <Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>Refresh</Button>
      </div>
      {error ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{error}</span></div> : null}
      {loading && !devices.length ? <div className="loading-block card-loading"><LoaderCircle className="spin" /><span>Loading marketplace…</span></div> : filtered.length ? <section className="device-grid">{filtered.map((device) => <DeviceCard key={device.id} device={device} own={device.listedById === session.userId} deleting={deletingId === device.id} onDelete={onDelete} />)}</section> : <div className="content-card"><EmptyState icon={Store} title={query ? 'No matching devices' : 'No devices listed yet'} text={query ? 'Try a broader search term.' : 'Add the first device to the shared marketplace.'} action={!query ? <Button icon={PackagePlus} onClick={() => onNavigate('add-device')}>Add device</Button> : null} /></div>}
    </div>
  );
}

function DeviceForm({ onBack, onSubmit }) {
  const [form, setForm] = useState({ name: '', model: '', price: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const update = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setErrors((current) => ({ ...current, [key]: '' })); };
  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Enter a device name.';
    if (!form.model.trim()) next.model = 'Enter a model number.';
    if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) next.price = 'Enter a valid price.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setLoading(true);
    try { await onSubmit(form); } catch { /* Parent displays the message. */ } finally { setLoading(false); }
  }
  return (
    <div>
      <PageIntro title="List a medical device" description="Add equipment in your possession to the shared marketplace." onBack={onBack} />
      <div className="form-layout">
        <form className="content-card form-card" onSubmit={submit}>
          <div className="form-card__heading"><span><PackagePlus size={22} /></span><div><h2>Device details</h2><p>Fields marked with an asterisk are required.</p></div></div>
          <Field label="Device name *" placeholder="e.g. ECG Monitor" value={form.name} onChange={update('name')} error={errors.name} />
          <Field label="Model number *" placeholder="e.g. ECG-1200" value={form.model} onChange={update('model')} error={errors.model} />
          <Field label="Selling price (₹) *" type="number" min="1" inputMode="decimal" placeholder="e.g. 25000" value={form.price} onChange={update('price')} error={errors.price} />
          <div className="form-actions"><Button type="button" variant="ghost" onClick={onBack}>Cancel</Button><Button type="submit" icon={Store} loading={loading}>{loading ? 'Listing device…' : 'List in marketplace'}</Button></div>
        </form>
        <aside className="form-tip"><CircleDollarSign size={22} /><h3>Listing guidance</h3><p>Use the exact model number and a fair selling price to help other teams evaluate the equipment quickly.</p><ul><li><Check size={14} /> Listings are visible to all signed-in users</li><li><Check size={14} /> You can remove your listing anytime</li></ul></aside>
      </div>
    </div>
  );
}

const EMPTY_EQUIPMENT_ENTRY = {
  hospitalId: '', location: '', plotNo: '', department: '', type: '', equipmentName: '', make: '',
  model: '', serialNo: '', doi: '', quantity: '1', ppmDoneOn: '', ppmDueOn: '',
  status: 'Functional', remarks: '',
};

function EquipmentEntryPage({ session, onNotify }) {
  const [form, setForm] = useState(EMPTY_EQUIPMENT_ENTRY);
  const [hospitals, setHospitals] = useState([]);
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const nextHospitals = await api.initializeHospitals(session.token, session, HOSPITALS);
      setHospitals(nextHospitals.filter((hospital) => hospital.active));
      await api.initializeMedicalEquipmentSeeds(session.token, session, MEDICAL_EQUIPMENT_SEEDS);
      const nextEntries = await api.getMedicalEquipment(session.token);
      await api.syncMedicalEquipmentCatalog(session.token, session, nextEntries);
      setEntries(nextEntries);
    }
    catch (error) { setLoadError(messageOf(error, 'Unable to load equipment records.')); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  async function submit(event) {
    event.preventDefault();
    const next = {};
    const required = {
      hospitalId: 'Select a hospital.', location: 'Enter the equipment location.', plotNo: 'Enter the plot or room number.',
      department: 'Enter the department.', type: 'Enter the equipment type.',
      equipmentName: 'Enter the medical equipment name.', make: 'Enter the manufacturer.',
      model: 'Enter the model.', serialNo: 'Enter the serial number.',
      doi: 'Enter the installation year.', ppmDoneOn: 'Select the last PPM date.',
      ppmDueOn: 'Select the next PPM due date.',
    };
    Object.entries(required).forEach(([key, message]) => { if (!String(form[key]).trim()) next[key] = message; });
    const year = Number(form.doi);
    if (form.doi && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1)) next.doi = 'Enter a valid four-digit year.';
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) next.quantity = 'Quantity must be at least 1.';
    if (form.ppmDoneOn && form.ppmDueOn && form.ppmDueOn <= form.ppmDoneOn) next.ppmDueOn = 'PPM due date must be after the completed date.';
    if (Object.keys(next).length) { setErrors(next); return; }

    setSaving(true);
    try {
      const saved = await api.addMedicalEquipment(form, session.token, session);
      setEntries((current) => [saved, ...current]);
      setForm(EMPTY_EQUIPMENT_ENTRY);
      setErrors({});
      onNotify({ title: 'Equipment record created', message: `${saved.equipmentName} was added to the medical equipment register.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      onNotify({ type: 'error', title: 'Could not create equipment record', message: messageOf(error) });
    } finally { setSaving(false); }
  }

  return (
    <div className="equipment-entry-page">
      <PageIntro eyebrow="ASSET MANAGEMENT" title="Medical equipment entry" description="Create an inventory record and schedule its preventive maintenance cycle." action={<span className="admin-badge"><ShieldCheck size={15} /> Administrator</span>} />

      <form className="content-card equipment-entry-form" onSubmit={submit} noValidate>
        <div className="form-card__heading"><span><PackagePlus size={22} /></span><div><h2>Equipment details</h2><p>Fields marked with an asterisk are required.</p></div></div>

        <section className="equipment-form-section">
          <div className="equipment-form-section__title"><Building2 size={18} /><div><h3>Location and classification</h3><p>Where the equipment is installed and which team owns it.</p></div></div>
          <div className="equipment-fields equipment-fields--four">
            <label className="field equipment-hospital-field">
              <span className="field__label">Hospital Name *</span>
              <span className={cx('field__control field__control--select', errors.hospitalId && 'field__control--error')}>
                <select value={form.hospitalId} onChange={update('hospitalId')} disabled={loading || !hospitals.length}>
                  <option value="">{loading ? 'Loading hospitals…' : 'Select a hospital'}</option>
                  {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}{hospital.city ? ` · ${hospital.city}` : ''}</option>)}
                </select>
                <ChevronDown size={17} />
              </span>
              {errors.hospitalId ? <span className="field__error">{errors.hospitalId}</span> : <span className="field__hint">Loaded from the Firebase hospital directory.</span>}
            </label>
            <Field label="Location *" placeholder="e.g. 3rd Floor" value={form.location} onChange={update('location')} error={errors.location} />
            <Field label="Plot / room no. *" placeholder="e.g. 111 and 112" value={form.plotNo} onChange={update('plotNo')} error={errors.plotNo} />
            <Field label="Department *" placeholder="e.g. OT-1" value={form.department} onChange={update('department')} error={errors.department} />
            <Field label="Equipment type *" placeholder="e.g. Medical Furniture" value={form.type} onChange={update('type')} error={errors.type} />
          </div>
        </section>

        <section className="equipment-form-section">
          <div className="equipment-form-section__title"><BriefcaseMedical size={18} /><div><h3>Identification</h3><p>Record the exact nameplate and acquisition information.</p></div></div>
          <div className="equipment-fields equipment-fields--three">
            <Field label="Medical equipment name *" placeholder="e.g. IV Stand" value={form.equipmentName} onChange={update('equipmentName')} error={errors.equipmentName} />
            <Field label="Make *" placeholder="e.g. MMS" value={form.make} onChange={update('make')} error={errors.make} />
            <Field label="Model *" placeholder="e.g. NA" value={form.model} onChange={update('model')} error={errors.model} />
            <Field label="Serial no. *" placeholder="e.g. NA" value={form.serialNo} onChange={update('serialNo')} error={errors.serialNo} />
            <Field label="DOI / installation year *" type="number" min="1900" max={new Date().getFullYear() + 1} placeholder="e.g. 2020" value={form.doi} onChange={update('doi')} error={errors.doi} />
            <Field label="Quantity *" type="number" min="1" step="1" value={form.quantity} onChange={update('quantity')} error={errors.quantity} />
          </div>
        </section>

        <section className="equipment-form-section">
          <div className="equipment-form-section__title"><Clock3 size={18} /><div><h3>Preventive maintenance</h3><p>Track the last PPM service, next due date, and current condition.</p></div></div>
          <div className="equipment-fields equipment-fields--three">
            <Field label="PPM done on *" type="date" value={form.ppmDoneOn} onChange={update('ppmDoneOn')} error={errors.ppmDoneOn} />
            <Field label="PPM due on *" type="date" value={form.ppmDueOn} onChange={update('ppmDueOn')} error={errors.ppmDueOn} />
            <label className="field">
              <span className="field__label">Status *</span>
              <span className="field__control field__control--select"><select value={form.status} onChange={update('status')}><option>Functional</option><option>Under Maintenance</option><option>Non-functional</option><option>Decommissioned</option></select><ChevronDown size={17} /></span>
            </label>
          </div>
          <Field label="Remarks" multiline rows="3" placeholder="Add service notes or other observations (optional)" value={form.remarks} onChange={update('remarks')} />
        </section>

        <div className="form-actions"><Button type="button" variant="ghost" onClick={() => { setForm(EMPTY_EQUIPMENT_ENTRY); setErrors({}); }} disabled={saving}>Clear form</Button><Button type="submit" icon={Check} loading={saving}>{saving ? 'Saving record…' : 'Save equipment record'}</Button></div>
      </form>

      <section className="content-card equipment-register">
        <div className="section-heading"><div><span className="eyebrow">FIREBASE INVENTORY</span><h2>Equipment register</h2></div><Button variant="secondary" icon={RefreshCw} onClick={loadEntries} loading={loading}>Refresh</Button></div>
        {loadError ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{loadError}</span><button onClick={loadEntries}>Try again</button></div> : null}
        {loading && !entries.length ? <div className="loading-block"><LoaderCircle className="spin" /><span>Loading equipment records…</span></div> : null}
        {!loading && !entries.length ? <EmptyState icon={BriefcaseMedical} title="No equipment records" text="Complete the form above to create the first inventory entry." /> : null}
        {entries.length ? <div className="equipment-table-wrap"><table className="equipment-table"><thead><tr><th>S.No.</th><th>Hospital Name</th><th>Location</th><th>Plot No.</th><th>Department</th><th>Type</th><th>Medical Equipment Name</th><th>Make</th><th>Model</th><th>Serial No.</th><th>DOI</th><th>Qty.</th><th>PPM Done On</th><th>PPM Due On</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{entries.map((entry, index) => <tr key={entry.id}><td>{entry.sNo || entries.length - index}</td><td><strong>{entry.hospitalName || 'Not assigned'}</strong></td><td>{entry.location}</td><td>{entry.plotNo}</td><td>{entry.department}</td><td>{entry.type}</td><td><strong>{entry.equipmentName}</strong></td><td>{entry.make}</td><td>{entry.model}</td><td>{entry.serialNo}</td><td>{entry.doi}</td><td>{entry.quantity}</td><td>{formatInventoryDate(entry.ppmDoneOn)}</td><td>{formatInventoryDate(entry.ppmDueOn)}</td><td><span className={cx('equipment-status', `equipment-status--${entry.status.toLowerCase().replace(/\s+/g, '-')}`)}>{entry.status}</span></td><td>{entry.remarks || '—'}</td></tr>)}</tbody></table></div> : null}
      </section>
    </div>
  );
}

function FaultForm({ session, activeHospital, hospitalContextLoading, onBack, onSubmit }) {
  const [form, setForm] = useState({ equipmentId: '', device: '', faultTitle: '', description: '' });
  const [equipment, setEquipment] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [equipmentError, setEquipmentError] = useState('');
  const [equipmentQuery, setEquipmentQuery] = useState('');
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [visibleEquipmentCount, setVisibleEquipmentCount] = useState(10);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const update = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setErrors((current) => ({ ...current, [key]: '' })); };
  const matchingEquipment = useMemo(() => {
    const query = equipmentQuery.trim().toLowerCase();
    return equipment.filter((item) => !query || `${item.equipmentName} ${item.hospitalName || ''} ${item.location} ${item.department} ${item.model}`.toLowerCase().includes(query));
  }, [equipment, equipmentQuery]);
  const equipmentSuggestions = matchingEquipment.slice(0, visibleEquipmentCount);
  const hasMoreEquipment = equipmentSuggestions.length < matchingEquipment.length;

  useEffect(() => {
    let active = true;
    setEquipment([]);
    setEquipmentQuery('');
    setForm((current) => ({ ...current, equipmentId: '', device: '' }));
    if (!activeHospital?.id) {
      setEquipmentLoading(false);
      setEquipmentError('');
      return () => { active = false; };
    }
    setEquipmentLoading(true);
    setEquipmentError('');
    api.getMedicalEquipmentCatalog(session.token, activeHospital.id)
      .then((items) => { if (active) setEquipment(items); })
      .catch((error) => { if (active) setEquipmentError(messageOf(error, 'Unable to load the equipment list.')); })
      .finally(() => { if (active) setEquipmentLoading(false); });
    return () => { active = false; };
  }, [session.token, activeHospital?.id]);

  function selectEquipment(selected) {
    setForm((current) => ({ ...current, equipmentId: selected.id, device: selected.equipmentName }));
    setEquipmentQuery(selected.equipmentName);
    setEquipmentOpen(false);
    setActiveSuggestion(-1);
    setVisibleEquipmentCount(10);
    setErrors((current) => ({ ...current, device: '' }));
  }

  function changeEquipmentQuery(event) {
    setEquipmentQuery(event.target.value);
    setForm((current) => ({ ...current, equipmentId: '', device: '' }));
    setEquipmentOpen(true);
    setActiveSuggestion(-1);
    setVisibleEquipmentCount(10);
    setErrors((current) => ({ ...current, device: '' }));
  }

  function handleEquipmentKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setEquipmentOpen(true);
      setActiveSuggestion((current) => {
        const next = current + 1;
        if (next >= equipmentSuggestions.length && hasMoreEquipment) {
          setVisibleEquipmentCount((count) => Math.min(count + 10, matchingEquipment.length));
          return next;
        }
        return Math.min(next, Math.max(0, equipmentSuggestions.length - 1));
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((current) => Math.max(-1, current - 1));
    } else if (event.key === 'Enter' && equipmentOpen && equipmentSuggestions[activeSuggestion]) {
      event.preventDefault();
      selectEquipment(equipmentSuggestions[activeSuggestion]);
    } else if (event.key === 'Escape') {
      setEquipmentOpen(false);
    }
  }

  function handleEquipmentScroll(event) {
    const list = event.currentTarget;
    const nearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
    if (nearBottom && hasMoreEquipment) {
      setVisibleEquipmentCount((count) => Math.min(count + 10, matchingEquipment.length));
    }
  }

  function toggleEquipmentSuggestions() {
    setEquipmentOpen((current) => {
      if (!current) {
        setVisibleEquipmentCount(10);
        setActiveSuggestion(-1);
      }
      return !current;
    });
  }
  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrors((current) => ({ ...current, image: 'Choose a valid image file.' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors((current) => ({ ...current, image: 'Choose an image smaller than 5 MB.' })); return; }
    setImage(file); setPreview(URL.createObjectURL(file)); setErrors((current) => ({ ...current, image: '' }));
  }
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }
  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.equipmentId || !form.device.trim()) next.device = 'Select a medical equipment name.';
    if (!form.faultTitle.trim()) next.faultTitle = 'Summarize the fault.';
    if (!form.description.trim()) next.description = 'Describe the issue and symptoms.';
    if (!image) next.image = 'Upload a photo of the fault.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setLoading(true);
    try { await onSubmit({ ...form, hospitalId: activeHospital.id, hospitalName: activeHospital.name, imageBase64: await toBase64(image), imageMimeType: image.type, imageFileName: image.name }); }
    catch { /* Parent displays the message. */ } finally { setLoading(false); }
  }
  if (hospitalContextLoading) {
    return (
      <div>
        <PageIntro title="Report a device fault" description="Loading your primary hospital workspace." onBack={onBack} />
        <section className="content-card loading-block"><LoaderCircle className="spin" /><span>Loading hospital workspace…</span></section>
      </div>
    );
  }
  if (!activeHospital) {
    return (
      <div>
        <PageIntro title="Report a device fault" description="A hospital workspace is required before you can select equipment." onBack={onBack} />
        <section className="content-card"><EmptyState icon={Building2} title="No hospital workspace available" text="Ask an administrator to assign a hospital to your doctor account, then sign in again." action={<Button onClick={onBack}>Return to overview</Button>} /></section>
      </div>
    );
  }
  return (
    <div>
      <PageIntro title="Report a device fault" description={`Showing equipment registered to ${activeHospital.name}.`} onBack={onBack} action={<span className="active-workspace-badge"><Building2 size={15} /> {activeHospital.name}</span>} />
      <div className="form-layout form-layout--wide">
        <form className="content-card form-card" onSubmit={submit}>
          <div className="form-card__heading"><span><ClipboardPlus size={22} /></span><div><h2>Fault details</h2><p>Give the technician enough context to assess the issue.</p></div></div>
          <div className="two-fields fault-primary-fields">
            <div className="field">
              <span className="field__label">Medical Equipment Name *</span>
              <span className="equipment-combobox">
                <span className={cx('field__control', errors.device && 'field__control--error')}>
                  <input
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={equipmentOpen}
                    aria-controls="equipment-suggestions"
                    aria-activedescendant={equipmentOpen && equipmentSuggestions[activeSuggestion] ? `equipment-option-${equipmentSuggestions[activeSuggestion].id}` : undefined}
                    value={equipmentQuery}
                    onChange={changeEquipmentQuery}
                    onFocus={() => { if (!equipmentError) { setEquipmentOpen(true); setVisibleEquipmentCount(10); setActiveSuggestion(-1); } }}
                    onBlur={() => setEquipmentOpen(false)}
                    onKeyDown={handleEquipmentKeyDown}
                    disabled={equipmentLoading || Boolean(equipmentError)}
                    placeholder={equipmentLoading ? 'Loading equipment…' : 'Search medical equipment'}
                  />
                  {equipmentLoading ? <LoaderCircle className="spin" size={17} /> : <button type="button" className="combobox-toggle" aria-label="Toggle equipment suggestions" onMouseDown={(event) => event.preventDefault()} onClick={toggleEquipmentSuggestions}><ChevronDown size={18} /></button>}
                </span>
                {equipmentOpen && !equipmentLoading && !equipmentError ? (
                  <span className="equipment-suggestions" id="equipment-suggestions" role="listbox" onScroll={handleEquipmentScroll}>
                    {equipmentSuggestions.length ? equipmentSuggestions.map((item, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={form.equipmentId === item.id}
                        id={`equipment-option-${item.id}`}
                        className={cx('equipment-suggestion', index === activeSuggestion && 'equipment-suggestion--active')}
                        key={item.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        onClick={() => selectEquipment(item)}
                      >
                        <strong>{item.equipmentName}</strong><span>{item.hospitalName ? `${item.hospitalName} · ` : ''}{item.location} · {item.department}</span>
                      </button>
                    )) : <span className="equipment-suggestions__empty">{equipment.length ? 'No matching equipment found' : `No equipment registered to ${activeHospital.name}`}</span>}
                    {hasMoreEquipment ? <span className="equipment-suggestions__more"><LoaderCircle className="spin" size={12} /> Scroll to load more · {equipmentSuggestions.length} of {matchingEquipment.length}</span> : matchingEquipment.length > 10 ? <span className="equipment-suggestions__more">All {matchingEquipment.length} devices loaded</span> : null}
                  </span>
                ) : null}
              </span>
              {errors.device ? <span className="field__error">{errors.device}</span> : equipmentError ? <span className="field__error">{equipmentError}</span> : <span className="field__hint">Only equipment assigned to {activeHospital.name} is available.</span>}
            </div>
            <Field label="Fault / defect *" placeholder="e.g. Display not working" value={form.faultTitle} onChange={update('faultTitle')} error={errors.faultTitle} hint="Briefly summarize the problem with the selected equipment." />
          </div>
          <Field label="Fault description *" multiline rows="5" placeholder="Describe the issue, when it started, and any symptoms…" value={form.description} onChange={update('description')} error={errors.description} />
          <label className="upload-field">
            <span className="field__label">Fault image *</span>
            {preview ? <span className="upload-preview"><img src={preview} alt="Selected device fault" /><span className="upload-preview__actions"><span><CheckCircle2 size={16} /> {image.name}</span><button type="button" onClick={() => { setImage(null); setPreview(''); }}>Remove</button></span></span> : <span className="upload-box"><span><Camera size={26} /></span><strong>Upload a device image</strong><small>PNG or JPG up to 5 MB</small><em><Upload size={15} /> Choose image</em></span>}
            <input type="file" accept="image/*" onChange={chooseImage} />
            {errors.image ? <span className="field__error">{errors.image}</span> : null}
          </label>
          <div className="form-actions"><Button type="button" variant="ghost" onClick={onBack}>Cancel</Button><Button type="submit" icon={Bell} loading={loading}>{loading ? 'Sending report…' : 'Notify technician'}</Button></div>
        </form>
        <aside className="form-tip"><Wrench size={22} /><h3>What happens next?</h3><p>Your report enters the technician queue. Once approved, their contact details will appear in your report.</p><div className="process-list"><span><b>1</b> Report submitted</span><span><b>2</b> Technician reviews</span><span><b>3</b> Contact & resolution</span></div></aside>
      </div>
    </div>
  );
}

function ManageHospitalsPage({ session, onNotify }) {
  const [form, setForm] = useState({ name: '', specialization: '', address: '' });
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const filteredHospitals = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return hospitals;
    return hospitals.filter((hospital) => (
      `${hospital.name} ${hospital.specialization} ${hospital.address} ${hospital.city}`.toLowerCase().includes(search)
    ));
  }, [hospitals, query]);

  const loadHospitals = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const nextHospitals = await api.initializeHospitals(session.token, session, HOSPITALS);
      setHospitals(nextHospitals);
    } catch (error) {
      setLoadError(messageOf(error, 'Unable to load the hospital directory.'));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void loadHospitals(); }, [loadHospitals]);

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: '' }));
    };
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {
      name: form.name.trim() ? '' : 'Enter the hospital name.',
      specialization: form.specialization.trim() ? '' : 'Enter the hospital specialization.',
      address: form.address.trim() ? '' : 'Enter the hospital address.',
    };
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      const saved = await api.addHospital(form, session.token, session);
      setHospitals((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: '', specialization: '', address: '' });
      setErrors({});
      onNotify({ title: 'Hospital saved', message: `${saved.name} is now available for doctor assignments.` });
    } catch (error) {
      onNotify({ type: 'error', title: 'Could not save hospital', message: messageOf(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="manage-hospitals-page">
      <PageIntro
        eyebrow="ADMINISTRATION"
        title="Manage hospitals"
        description="Create hospital records and maintain the directory used for doctor assignments."
        action={<span className="admin-badge"><ShieldCheck size={15} /> Administrator</span>}
      />

      {loadError ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{loadError}</span><button onClick={loadHospitals}>Try again</button></div> : null}

      <div className="hospital-admin-layout">
        <form className="content-card hospital-create-card" onSubmit={submit}>
          <div className="form-card__heading">
            <span><Building2 size={22} /></span>
            <div><h2>Add a hospital</h2><p>All fields are required for a complete directory record.</p></div>
          </div>
          <Field label="Hospital Name *" placeholder="e.g. City Care Hospital" value={form.name} onChange={update('name')} error={errors.name} maxLength="120" />
          <Field label="Specialization *" placeholder="e.g. Multi-speciality" value={form.specialization} onChange={update('specialization')} error={errors.specialization} maxLength="120" />
          <Field label="Address *" multiline rows="4" placeholder="Enter the complete hospital address" value={form.address} onChange={update('address')} error={errors.address} maxLength="300" />
          <div className="form-actions"><Button type="submit" icon={Plus} loading={saving}>{saving ? 'Saving hospital…' : 'Save hospital'}</Button></div>
        </form>

        <section className="content-card hospital-directory" aria-labelledby="hospital-directory-title">
          <div className="hospital-directory__heading">
            <div><span className="eyebrow">HOSPITAL DIRECTORY</span><h2 id="hospital-directory-title">Hospitals <span>{hospitals.length}</span></h2></div>
            <label className="hospital-search hospital-directory__search">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hospitals…" aria-label="Search hospital directory" />
              {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button> : null}
            </label>
          </div>

          {loading ? <div className="loading-block hospital-directory__loading"><LoaderCircle className="spin" /><span>Loading hospitals…</span></div> : null}
          {!loading && filteredHospitals.length ? (
            <div className="hospital-directory-list">
              {filteredHospitals.map((hospital) => (
                <article className="hospital-directory-row" key={hospital.id}>
                  <span className="hospital-directory-row__icon"><Building2 size={20} /></span>
                  <div className="hospital-directory-row__details">
                    <div><strong>{hospital.name}</strong><span className="hospital-badge">Active</span></div>
                    <span>{hospital.specialization || 'General hospital'}</span>
                    <p>{hospital.address || hospital.city}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {!loading && !filteredHospitals.length ? <EmptyState icon={Building2} title={query ? 'No hospitals found' : 'No hospitals yet'} text={query ? 'Try another name, specialization, or address.' : 'Save the first hospital to begin the directory.'} /> : null}
        </section>
      </div>
    </div>
  );
}

function DoctorHospitalMapping({ session, onNotify }) {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [mappings, setMappings] = useState({});
  const [draft, setDraft] = useState({ hospitalIds: [], primaryId: '' });
  const [managing, setManaging] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const doctor = doctors.find((item) => item.id === doctorId);
  const mapping = mappings[doctorId] || { hospitalIds: [], primaryId: '' };
  const assignedHospitals = mapping.hospitalIds.map((id) => hospitals.find((item) => item.id === id)).filter(Boolean);
  const filteredHospitals = hospitals.filter((hospital) => `${hospital.name} ${hospital.city}`.toLowerCase().includes(query.trim().toLowerCase()));

  const loadMappingData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextDoctors, nextHospitals, nextMappings] = await Promise.all([
        api.getDoctors(session.token),
        api.initializeHospitals(session.token, session, HOSPITALS),
        api.getDoctorHospitalMappings(session.token),
      ]);
      setDoctors(nextDoctors);
      setHospitals(nextHospitals);
      setMappings(nextMappings);
      setDoctorId((current) => current && nextDoctors.some((item) => item.id === current) ? current : (nextDoctors[0]?.id || ''));
    } catch (loadError) {
      setError(messageOf(loadError, 'Unable to load doctor and hospital records.'));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void loadMappingData(); }, [loadMappingData]);

  function selectDoctor(event) {
    const nextDoctorId = event.target.value;
    const nextMapping = mappings[nextDoctorId] || { hospitalIds: [], primaryId: '' };
    setDoctorId(nextDoctorId);
    setDraft({ hospitalIds: [...nextMapping.hospitalIds], primaryId: nextMapping.primaryId });
    setManaging(false);
    setQuery('');
  }

  function openManager() {
    setDraft({ hospitalIds: [...mapping.hospitalIds], primaryId: mapping.primaryId });
    setManaging(true);
    setQuery('');
  }

  function toggleHospital(hospitalId) {
    setDraft((current) => {
      const selected = current.hospitalIds.includes(hospitalId);
      const hospitalIds = selected
        ? current.hospitalIds.filter((id) => id !== hospitalId)
        : [...current.hospitalIds, hospitalId];
      const primaryId = selected && current.primaryId === hospitalId
        ? (hospitalIds[0] || '')
        : (current.primaryId || hospitalId);
      return { hospitalIds, primaryId };
    });
  }

  function closeManager() {
    setDraft({ hospitalIds: [...mapping.hospitalIds], primaryId: mapping.primaryId });
    setManaging(false);
    setQuery('');
  }

  async function saveMapping() {
    if (!doctor) return;
    setSaving(true);
    try {
      const saved = await api.saveDoctorHospitalMapping(doctorId, draft, session.token, session);
      setMappings((current) => ({ ...current, [doctorId]: saved }));
      setManaging(false);
      setQuery('');
      onNotify({
        title: 'Hospital assignments updated',
        message: `${doctor.name} is now assigned to ${saved.hospitalIds.length} hospital${saved.hospitalIds.length === 1 ? '' : 's'}.`,
      });
    } catch (saveError) {
      onNotify({ type: 'error', title: 'Could not save assignments', message: messageOf(saveError) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mapping-page">
      <PageIntro
        eyebrow="ADMINISTRATION"
        title="Doctor–hospital mapping"
        description="Manage hospital affiliations and choose a primary hospital for every doctor."
        action={<span className="admin-badge"><ShieldCheck size={15} /> Administrator</span>}
      />

      {error ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={loadMappingData}>Try again</button></div> : null}

      {loading ? <div className="mapping-card loading-block"><LoaderCircle className="spin" /><span>Loading doctors and hospitals…</span></div> : null}

      {!loading && !doctors.length ? (
        <section className="mapping-card"><EmptyState icon={Stethoscope} title="No doctor accounts found" text="Create a user with the Doctor role, then return here to assign their hospitals." /></section>
      ) : null}

      {!loading && doctor ? <><section className="mapping-card mapping-selector-card">
        <label className="doctor-select-label" htmlFor="doctor-select">Select doctor</label>
        <div className="doctor-select-wrap">
          <select id="doctor-select" value={doctorId} onChange={selectDoctor}>
            {doctors.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.specialty}</option>)}
          </select>
          <ChevronDown size={20} aria-hidden="true" />
        </div>
        <div className="doctor-summary">
          <span className="doctor-summary__icon"><Stethoscope size={25} /></span>
          <div className="doctor-summary__identity"><strong>{doctor.name}</strong><span>{doctor.code} · {doctor.specialty}</span></div>
          <div className="doctor-summary__count"><strong>{assignedHospitals.length}</strong><span>Hospital{assignedHospitals.length === 1 ? '' : 's'}</span></div>
        </div>
      </section>

      <div className={cx('mapping-layout', managing && 'mapping-layout--managing')}>
        <section className="mapping-assigned">
          <div className="mapping-section-heading">
            <div><span className="eyebrow">CURRENT AFFILIATIONS</span><h2>Assigned hospitals</h2></div>
            <Button variant="secondary" icon={managing ? X : Plus} onClick={managing ? closeManager : openManager}>{managing ? 'Close' : 'Manage hospitals'}</Button>
          </div>
          {assignedHospitals.length ? (
            <div className="assigned-hospital-list">
              {assignedHospitals.map((hospital) => (
                <article className="assigned-hospital" key={hospital.id}>
                  <span className="assigned-hospital__icon"><Building2 size={21} /></span>
                  <div><strong>{hospital.name}</strong><span>{hospital.city}</span></div>
                  <span className={cx('hospital-badge', mapping.primaryId === hospital.id ? 'hospital-badge--primary' : '')}>{mapping.primaryId === hospital.id ? 'Primary' : 'Assigned'}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="mapping-empty"><span><Building2 size={24} /></span><div><strong>No hospitals assigned</strong><p>Use Manage hospitals to add this doctor’s first affiliation.</p></div></div>
          )}
        </section>

        {managing ? (
          <aside className="hospital-manager" aria-label={`Manage hospitals for ${doctor.name}`}>
            <div className="hospital-manager__top">
              <div><span className="eyebrow">EDIT ASSIGNMENTS</span><h2>Manage hospitals</h2></div>
              <IconButton label="Close hospital manager" onClick={closeManager}><X size={18} /></IconButton>
            </div>
            <label className="hospital-search">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hospitals…" aria-label="Search hospitals" />
              {query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button> : null}
            </label>
            <p className="hospital-manager__hint">Select one or more hospitals, then choose which should be primary.</p>
            <div className="hospital-choice-list">
              {filteredHospitals.map((hospital) => {
                const selected = draft.hospitalIds.includes(hospital.id);
                const primary = draft.primaryId === hospital.id;
                return (
                  <div className={cx('hospital-choice', selected && 'hospital-choice--selected')} key={hospital.id}>
                    <button type="button" className="hospital-choice__toggle" aria-pressed={selected} onClick={() => toggleHospital(hospital.id)}>
                      <span className="mapping-checkbox">{selected ? <Check size={16} /> : null}</span>
                      <span><strong>{hospital.name}</strong><small>{hospital.city}</small></span>
                    </button>
                    {selected ? (
                      <button type="button" className={cx('primary-choice', primary && 'primary-choice--active')} onClick={() => setDraft((current) => ({ ...current, primaryId: hospital.id }))} aria-pressed={primary}>
                        <span /> {primary ? 'Primary' : 'Set primary'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {!filteredHospitals.length ? <div className="hospital-no-results"><Search size={22} /><strong>No hospitals found</strong><span>Try a different name or city.</span></div> : null}
            </div>
            <div className="hospital-manager__footer">
              <span>{draft.hospitalIds.length} selected</span>
              <div><Button variant="ghost" onClick={closeManager} disabled={saving}>Cancel</Button><Button icon={Check} onClick={saveMapping} loading={saving}>{saving ? 'Saving…' : 'Save assignments'}</Button></div>
            </div>
          </aside>
        ) : null}
      </div></> : null}
    </div>
  );
}

function ConfirmDialog({ device, busy, onCancel, onConfirm }) {
  if (!device) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <span className="modal__icon"><Trash2 size={22} /></span><h2 id="delete-title">Delete this listing?</h2><p><strong>{device.name}</strong> will be permanently removed from the marketplace.</p>
        <div><Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant="danger" icon={Trash2} onClick={onConfirm} loading={busy}>{busy ? 'Deleting…' : 'Delete listing'}</Button></div>
      </div>
    </div>
  );
}

function AppShell({ session, onLogout }) {
  const [view, setView] = useState(() => window.location.hash.slice(1) || 'dashboard');
  const [reports, setReports] = useState([]);
  const [devices, setDevices] = useState([]);
  const [reportsError, setReportsError] = useState('');
  const [devicesError, setDevicesError] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [approvingId, setApprovingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [toast, setToast] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [doctorHospitals, setDoctorHospitals] = useState([]);
  const [primaryHospitalId, setPrimaryHospitalId] = useState('');
  const [activeHospitalId, setActiveHospitalId] = useState('');
  const [hospitalContextLoading, setHospitalContextLoading] = useState(session.role === 'doctor');
  const [hospitalContextError, setHospitalContextError] = useState('');
  const isDoctor = session.role === 'doctor';
  const isTechnician = session.role === 'technician';
  const isAdmin = session.role === 'admin';

  const refreshReports = useCallback(async () => {
    setLoadingReports(true); setReportsError('');
    try { setReports(await api.getReports(session.token)); } catch (error) { setReportsError(messageOf(error, 'Unable to load fault reports.')); } finally { setLoadingReports(false); }
  }, [session.token]);
  const refreshDevices = useCallback(async () => {
    setLoadingDevices(true); setDevicesError('');
    try { setDevices(await api.getDevices(session.token)); } catch (error) { setDevicesError(messageOf(error, 'Unable to load marketplace devices.')); } finally { setLoadingDevices(false); }
  }, [session.token]);
  const refreshDoctorHospitals = useCallback(async () => {
    if (session.role !== 'doctor') return;
    setHospitalContextLoading(true);
    setHospitalContextError('');
    try {
      const context = await api.getDoctorHospitalContext(session.token, session.userId);
      setDoctorHospitals(context.hospitals);
      setPrimaryHospitalId(context.primaryId);
      setActiveHospitalId((current) => context.hospitals.some((hospital) => hospital.id === current) ? current : context.primaryId);
    } catch (error) {
      setDoctorHospitals([]);
      setPrimaryHospitalId('');
      setActiveHospitalId('');
      setHospitalContextError(messageOf(error, 'Unable to load your assigned hospitals.'));
    } finally {
      setHospitalContextLoading(false);
    }
  }, [session.role, session.token, session.userId]);
  useEffect(() => { void refreshReports(); void refreshDevices(); void refreshDoctorHospitals(); }, [refreshReports, refreshDevices, refreshDoctorHospitals]);
  useEffect(() => {
    const onHash = () => setView(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash);
  }, []);
  function navigate(next) { window.location.hash = next; setView(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function approve(report) {
    setApprovingId(report.id);
    try {
      const update = await api.approveReport(report.id, session.token, session);
      setReports((current) => current.map((item) => item.id === report.id ? { ...item, ...update } : item));
      setToast({ title: 'Fault report approved', message: `${report.device} has moved out of the pending queue.` });
    } catch (error) { setToast({ type: 'error', title: 'Approval failed', message: messageOf(error) }); } finally { setApprovingId(''); }
  }
  async function createDevice(form) {
    try {
      const device = await api.addDevice(form, session.token, session);
      setDevices((current) => [device, ...current]); setToast({ title: 'Device listed', message: `${device.name} is now visible in the marketplace.` }); navigate('marketplace');
    } catch (error) { setToast({ type: 'error', title: 'Listing failed', message: messageOf(error) }); throw error; }
  }
  async function createReport(form) {
    try {
      const report = await api.addReport(form, session.token, session);
      setReports((current) => [report, ...current]); setToast({ title: 'Report submitted', message: 'A technician can now review the equipment fault.' }); navigate('reports');
    } catch (error) { setToast({ type: 'error', title: 'Submission failed', message: messageOf(error) }); throw error; }
  }
  async function removeDevice() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await api.deleteDevice(deleteTarget.id, session.token); setDevices((current) => current.filter((item) => item.id !== deleteTarget.id)); setToast({ title: 'Listing removed' }); setDeleteTarget(null);
    } catch (error) { setToast({ type: 'error', title: 'Could not delete listing', message: messageOf(error) }); } finally { setDeletingId(''); }
  }
  const activeHospital = doctorHospitals.find((hospital) => hospital.id === activeHospitalId) || null;
  function switchHospital(hospitalId) {
    if (!doctorHospitals.some((hospital) => hospital.id === hospitalId)) return;
    setActiveHospitalId(hospitalId);
    const hospital = doctorHospitals.find((item) => item.id === hospitalId);
    setToast({ title: 'Hospital workspace changed', message: `You are now working in ${hospital.name}.` });
  }
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: isDoctor ? 'My fault reports' : isAdmin ? 'All fault reports' : 'Fault report queue', icon: AlertTriangle },
    ...(isDoctor ? [{ id: 'report', label: 'Report a fault', icon: ClipboardPlus }] : []),
    ...(isAdmin ? [{ id: 'manage-hospitals', label: 'Manage hospitals', icon: Building2 }] : []),
    ...(isAdmin ? [{ id: 'doctor-hospitals', label: 'Hospital mapping', icon: UserCog }] : []),
    ...(isAdmin ? [{ id: 'device-entry', label: 'Device entry', icon: PackagePlus }] : []),
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'add-device', label: 'List a device', icon: PackagePlus },
  ], [isAdmin, isDoctor]);
  const activeLabel = navItems.find((item) => item.id === view)?.label || 'Overview';

  return (
    <div className="app-shell">
      <aside className={cx('sidebar', mobileMenu && 'sidebar--open')}>
        <div className="sidebar__brand"><Brand light /><IconButton label="Close menu" className="sidebar__close" onClick={() => setMobileMenu(false)}><X size={20} /></IconButton></div>
        <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={cx(view === id && 'active')} onClick={() => navigate(id)}><Icon size={19} /><span>{label}</span>{view === id ? <span className="nav-dot" /> : null}</button>)}</nav>
        <div className="sidebar__bottom">
          <div className="account-card"><span><UserRound size={18} /></span><div><strong>{session.email.split('@')[0]}</strong><small>{session.role}</small></div></div>
          <button className="logout-button" onClick={onLogout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>
      {mobileMenu ? <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} /> : null}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left"><IconButton label="Open navigation" className="menu-button" onClick={() => setMobileMenu(true)}><Menu size={21} /></IconButton><div><span>Workspace</span><strong>{activeLabel}</strong></div></div>
          <div className="topbar__right"><span className="online-indicator"><i /> Systems online</span><IconButton label="Notifications"><Bell size={19} /></IconButton><div className="avatar">{session.email.slice(0, 1).toUpperCase()}</div></div>
        </header>
        <main className="workspace">
          {view === 'dashboard' ? <Dashboard session={session} reports={reports} devices={devices} loading={loadingReports || loadingDevices || hospitalContextLoading} error={reportsError || devicesError} onNavigate={navigate} onRefresh={() => { void refreshReports(); void refreshDevices(); void refreshDoctorHospitals(); }} onApprove={approve} approvingId={approvingId} doctorHospitals={doctorHospitals} activeHospital={activeHospital} primaryHospitalId={primaryHospitalId} hospitalContextLoading={hospitalContextLoading} hospitalContextError={hospitalContextError} onHospitalChange={switchHospital} /> : null}
          {view === 'reports' ? <ReportsPage session={session} reports={reports} loading={loadingReports} error={reportsError} onRefresh={refreshReports} onApprove={approve} approvingId={approvingId} /> : null}
          {view === 'manage-hospitals' && isAdmin ? <ManageHospitalsPage session={session} onNotify={setToast} /> : null}
          {view === 'manage-hospitals' && !isAdmin ? <div className="content-card"><EmptyState icon={ShieldCheck} title="Administrator access required" text="Only Admin accounts can create and view hospital directory records." action={<Button onClick={() => navigate('dashboard')}>Return to overview</Button>} /></div> : null}
          {view === 'doctor-hospitals' && isAdmin ? <DoctorHospitalMapping session={session} onNotify={setToast} /> : null}
          {view === 'doctor-hospitals' && !isAdmin ? <div className="content-card"><EmptyState icon={ShieldCheck} title="Administrator access required" text="Only Admin accounts can manage doctor-to-hospital assignments." action={<Button onClick={() => navigate('dashboard')}>Return to overview</Button>} /></div> : null}
          {view === 'device-entry' && isAdmin ? <EquipmentEntryPage session={session} onNotify={setToast} /> : null}
          {view === 'device-entry' && !isAdmin ? <div className="content-card"><EmptyState icon={ShieldCheck} title="Administrator access required" text="Only Admin accounts can create and view medical equipment records." action={<Button onClick={() => navigate('dashboard')}>Return to overview</Button>} /></div> : null}
          {view === 'marketplace' ? <Marketplace session={session} devices={devices} loading={loadingDevices} error={devicesError} onRefresh={refreshDevices} onNavigate={navigate} onDelete={setDeleteTarget} deletingId={deletingId} /> : null}
          {view === 'add-device' ? <DeviceForm onBack={() => navigate('marketplace')} onSubmit={createDevice} /> : null}
          {view === 'report' && isDoctor ? <FaultForm session={session} activeHospital={activeHospital} hospitalContextLoading={hospitalContextLoading} onBack={() => navigate('dashboard')} onSubmit={createReport} /> : null}
          {view === 'report' && isTechnician ? <ReportsPage session={session} reports={reports} loading={loadingReports} error={reportsError} onRefresh={refreshReports} onApprove={approve} approvingId={approvingId} /> : null}
        </main>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog device={deleteTarget} busy={Boolean(deletingId)} onCancel={() => setDeleteTarget(null)} onConfirm={removeDevice} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
  });
  function authenticate(next) { localStorage.setItem(SESSION_KEY, JSON.stringify(next)); setSession(next); }
  function logout() { localStorage.removeItem(SESSION_KEY); window.location.hash = ''; setSession(null); }
  return session?.token ? <AppShell session={session} onLogout={logout} /> : <AuthPage onAuthenticated={authenticate} />;
}
