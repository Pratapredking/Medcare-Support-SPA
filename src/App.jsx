import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Bell, Box,
  BriefcaseMedical, Camera, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, ClipboardPlus, Clock3, HeartPulse, LayoutDashboard,
  LoaderCircle, LogOut, Mail, Menu, PackagePlus, RefreshCw, Search, ShieldCheck,
  Stethoscope, Store, Trash2, Upload, UserRound, Wrench, X,
} from 'lucide-react';
import * as api from './api';
import teamIllustration from '../assets/medicare-team.png';

const SESSION_KEY = 'medicare-session';

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
        <div className="report-row__meta"><span>{formatDate(report.createdAt)}</span>{report.doctorEmail ? <span><Mail size={13} /> {report.doctorEmail}</span> : null}</div>
        {technician && report.status === 'Pending' ? <Button loading={approving} onClick={() => onApprove(report)} icon={CheckCircle2} className="report-row__approve">{approving ? 'Approving…' : 'Approve report'}</Button> : null}
        {!technician && report.status === 'Approved' && report.technicianEmail ? <a className="contact-link" href={`mailto:${report.technicianEmail}`}><Mail size={15} /> Contact technician · {report.technicianEmail}</a> : null}
      </div>
    </article>
  );
}

function Dashboard({ session, reports, devices, loading, error, onNavigate, onRefresh, onApprove, approvingId }) {
  const isTechnician = session.role === 'technician';
  const mine = reports.filter((item) => item.reportedById === session.userId);
  const visibleReports = isTechnician ? reports.filter((item) => item.status === 'Pending') : mine;
  const approvedMine = mine.filter((item) => item.status === 'Approved');
  const myApprovals = reports.filter((item) => item.status === 'Approved' && item.technicianId === session.userId);
  const name = session.email.split('@')[0] || 'there';

  return (
    <div>
      <PageIntro eyebrow="OVERVIEW" title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${name}`} description={isTechnician ? 'Review incoming equipment issues and keep clinical teams moving.' : 'Track equipment faults, approvals, and shared marketplace listings.'} action={<Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>Refresh</Button>} />
      <section className="hero-strip">
        <div>
          <span className="hero-strip__label"><Activity size={15} /> {isTechnician ? 'Technician workspace' : 'Doctor workspace'}</span>
          <h2>{isTechnician ? `${visibleReports.length} fault${visibleReports.length === 1 ? '' : 's'} waiting for review` : 'Equipment support, all in one place'}</h2>
          <p>{isTechnician ? 'Approve a report to connect with the reporting doctor.' : 'Report an issue in minutes and follow its progress through technician approval.'}</p>
          <Button variant="light" icon={isTechnician ? AlertTriangle : ClipboardPlus} onClick={() => onNavigate(isTechnician ? 'reports' : 'report')}>{isTechnician ? 'Review pending faults' : 'Report a device fault'}</Button>
        </div>
        <div className="hero-strip__ornament"><HeartPulse size={72} strokeWidth={1.2} /></div>
      </section>
      <section className="stats-grid" aria-label="Workspace summary">
        {isTechnician ? <>
          <StatCard icon={AlertTriangle} value={visibleReports.length} label="Pending faults" tone="amber" />
          <StatCard icon={BadgeCheck} value={myApprovals.length} label="Approved by me" />
          <StatCard icon={Store} value={devices.length} label="Marketplace devices" tone="sage" />
        </> : <>
          <StatCard icon={ClipboardPlus} value={mine.length} label="Fault reports sent" />
          <StatCard icon={BadgeCheck} value={approvedMine.length} label="Technician approved" />
          <StatCard icon={Clock3} value={mine.length - approvedMine.length} label="Awaiting approval" tone="amber" />
          <StatCard icon={Store} value={devices.length} label="Marketplace devices" tone="sage" />
        </>}
      </section>
      {error ? <div className="inline-error panel-error"><AlertTriangle size={18} /><span>{error}</span><button onClick={onRefresh}>Try again</button></div> : null}
      <div className="dashboard-columns">
        <section className="content-card">
          <div className="section-heading"><div><span className="eyebrow">{isTechnician ? 'ACTION NEEDED' : 'FAULT TRACKING'}</span><h2>{isTechnician ? 'Pending reports' : 'My recent reports'}</h2></div><button className="text-button" onClick={() => onNavigate('reports')}>View all <ChevronRight size={16} /></button></div>
          {loading && !reports.length ? <div className="loading-block"><LoaderCircle className="spin" /><span>Loading fault reports…</span></div> : visibleReports.length ? visibleReports.slice(0, 3).map((report) => <ReportRow key={report.id} report={report} technician={isTechnician} approving={approvingId === report.id} onApprove={onApprove} />) : <EmptyState icon={BadgeCheck} title="All clear" text={isTechnician ? 'There are no pending reports right now.' : 'Your fault reports will appear here.'} />}
        </section>
        <aside className="content-card quick-card">
          <div className="section-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Get things done</h2></div></div>
          {!isTechnician ? <button className="quick-action" onClick={() => onNavigate('report')}><span><ClipboardPlus size={20} /></span><div><strong>Report a fault</strong><small>Notify a technician</small></div><ChevronRight size={18} /></button> : null}
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
  const [filter, setFilter] = useState('all');
  const base = isTechnician ? reports : reports.filter((item) => item.reportedById === session.userId);
  const filtered = filter === 'all' ? base : base.filter((item) => item.status.toLowerCase() === filter);
  return (
    <div>
      <PageIntro eyebrow="FAULT MANAGEMENT" title={isTechnician ? 'Fault report queue' : 'My fault reports'} description={isTechnician ? 'Review incoming issues from doctors and approve them for follow-up.' : 'Track every equipment issue you have submitted.'} action={<Button variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>Refresh</Button>} />
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

function FaultForm({ onBack, onSubmit }) {
  const [form, setForm] = useState({ device: '', faultTitle: '', description: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const update = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setErrors((current) => ({ ...current, [key]: '' })); };
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
    if (!form.device.trim()) next.device = 'Enter the device name.';
    if (!form.faultTitle.trim()) next.faultTitle = 'Summarize the fault.';
    if (!form.description.trim()) next.description = 'Describe the issue and symptoms.';
    if (!image) next.image = 'Upload a photo of the fault.';
    if (Object.keys(next).length) { setErrors(next); return; }
    setLoading(true);
    try { await onSubmit({ ...form, imageBase64: await toBase64(image), imageMimeType: image.type, imageFileName: image.name }); }
    catch { /* Parent displays the message. */ } finally { setLoading(false); }
  }
  return (
    <div>
      <PageIntro title="Report a device fault" description="Share the equipment details and a technician will review your report." onBack={onBack} />
      <div className="form-layout form-layout--wide">
        <form className="content-card form-card" onSubmit={submit}>
          <div className="form-card__heading"><span><ClipboardPlus size={22} /></span><div><h2>Fault details</h2><p>Give the technician enough context to assess the issue.</p></div></div>
          <div className="two-fields"><Field label="Device name *" placeholder="e.g. Patient Monitor" value={form.device} onChange={update('device')} error={errors.device} /><Field label="Fault / defect *" placeholder="e.g. Display not working" value={form.faultTitle} onChange={update('faultTitle')} error={errors.faultTitle} /></div>
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
  const isDoctor = session.role === 'doctor';

  const refreshReports = useCallback(async () => {
    setLoadingReports(true); setReportsError('');
    try { setReports(await api.getReports(session.token)); } catch (error) { setReportsError(messageOf(error, 'Unable to load fault reports.')); } finally { setLoadingReports(false); }
  }, [session.token]);
  const refreshDevices = useCallback(async () => {
    setLoadingDevices(true); setDevicesError('');
    try { setDevices(await api.getDevices(session.token)); } catch (error) { setDevicesError(messageOf(error, 'Unable to load marketplace devices.')); } finally { setLoadingDevices(false); }
  }, [session.token]);
  useEffect(() => { void refreshReports(); void refreshDevices(); }, [refreshReports, refreshDevices]);
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
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: isDoctor ? 'My fault reports' : 'Fault report queue', icon: AlertTriangle },
    ...(isDoctor ? [{ id: 'report', label: 'Report a fault', icon: ClipboardPlus }] : []),
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'add-device', label: 'List a device', icon: PackagePlus },
  ], [isDoctor]);
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
          {view === 'dashboard' ? <Dashboard session={session} reports={reports} devices={devices} loading={loadingReports || loadingDevices} error={reportsError || devicesError} onNavigate={navigate} onRefresh={() => { void refreshReports(); void refreshDevices(); }} onApprove={approve} approvingId={approvingId} /> : null}
          {view === 'reports' ? <ReportsPage session={session} reports={reports} loading={loadingReports} error={reportsError} onRefresh={refreshReports} onApprove={approve} approvingId={approvingId} /> : null}
          {view === 'marketplace' ? <Marketplace session={session} devices={devices} loading={loadingDevices} error={devicesError} onRefresh={refreshDevices} onNavigate={navigate} onDelete={setDeleteTarget} deletingId={deletingId} /> : null}
          {view === 'add-device' ? <DeviceForm onBack={() => navigate('marketplace')} onSubmit={createDevice} /> : null}
          {view === 'report' && isDoctor ? <FaultForm onBack={() => navigate('dashboard')} onSubmit={createReport} /> : null}
          {view === 'report' && !isDoctor ? <ReportsPage session={session} reports={reports} loading={loadingReports} error={reportsError} onRefresh={refreshReports} onApprove={approve} approvingId={approvingId} /> : null}
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
