import { useEffect, useRef, useState } from 'react';
import { BarChart3, Home as HomeIcon, LifeBuoy, Waves, Wrench } from 'lucide-react';
import { useStore } from './state/store';
import { useRoute } from './router';
import { resourcesFor } from './content/resources';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Sos } from './screens/Sos';
import { CheckIn } from './screens/CheckIn';
import { Slip } from './screens/Slip';
import { Progress } from './screens/Progress';
import { Balance, Breathe, Ground, HaltCheck, Plans, Refuse, Thoughts, ToolsIndex, WhyTools } from './screens/Tools';
import { Doctor, LearnIndex, LessonView, Support, Withdrawal } from './screens/Support';
import { LockScreen, Screening, Settings } from './screens/Settings';

const LOCK_AFTER_MS = 60_000;

function TabBar({ path }: { path: string }) {
  const active = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  const tab = (to: string, label: string, icon: React.ReactNode, key: string) => (
    <a href={`#${to}`} className={`tabbar-item${active(key) ? ' tabbar-on' : ''}`} aria-current={active(key) ? 'page' : undefined}>
      {icon}
      <span>{label}</span>
    </a>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      {tab('/', 'Home', <HomeIcon aria-hidden />, '/')}
      {tab('/progress', 'Progress', <BarChart3 aria-hidden />, '/progress')}
      <a href="#/sos" className="tabbar-sos" aria-label="SOS: ride the wave">
        <Waves aria-hidden />
        <span>SOS</span>
      </a>
      {tab('/tools', 'Toolkit', <Wrench aria-hidden />, '/tools')}
      {tab('/support', 'Support', <LifeBuoy aria-hidden />, '/support')}
    </nav>
  );
}

function useTheme(theme: 'system' | 'light' | 'dark') {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1a20' : '#f6f3ee');
  }, [theme]);
}

export function App() {
  const { data, persistent } = useStore();
  const route = useRoute();
  const hasPin = !!data.settings.pinHash;
  const [locked, setLocked] = useState(hasPin);
  const hiddenAt = useRef<number | null>(null);
  useTheme(data.settings.theme);

  // Re-lock after the app has been in the background for a while.
  useEffect(() => {
    const on = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current && hasPin && Date.now() - hiddenAt.current > LOCK_AFTER_MS) setLocked(true);
    };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [hasPin]);

  if (hasPin && locked) {
    const res = data.profile ? resourcesFor(data.profile) : null;
    return (
      <>
        <LockScreen onUnlock={() => setLocked(false)} />
        {res && (
          <p className="lock-emergency">
            Emergency? <a href={`tel:${res.emergency}`}>Call {res.emergency}</a>
          </p>
        )}
      </>
    );
  }

  const storageBanner = !persistent && (
    <p className="storage-banner" role="status">
      This browser is blocking storage, so nothing you enter will be saved after you close this page. Install Tidewise or open it in a normal browser window to keep your progress.
    </p>
  );

  if (!data.profile)
    return (
      <>
        {storageBanner}
        <Onboarding />
      </>
    );

  const [a, b] = route.parts;
  let screen: React.ReactNode;
  let showTabs = true;
  switch (a) {
    case undefined:
      screen = <Home />;
      break;
    case 'sos':
      screen = <Sos />;
      showTabs = false;
      break;
    case 'checkin':
      screen = <CheckIn key={route.query.get('date') ?? 'today'} />;
      break;
    case 'slip':
      screen = <Slip key={route.query.toString()} />;
      showTabs = false;
      break;
    case 'progress':
      screen = <Progress />;
      break;
    case 'tools':
      screen =
        b === 'why' ? <WhyTools /> : b === 'thoughts' ? <Thoughts /> : b === 'plans' ? <Plans /> : b === 'refuse' ? <Refuse /> : b === 'breathe' ? <Breathe /> : b === 'ground' ? <Ground /> : b === 'halt' ? <HaltCheck /> : b === 'balance' ? <Balance /> : <ToolsIndex />;
      break;
    case 'learn':
      screen = b ? <LessonView /> : <LearnIndex />;
      break;
    case 'support':
      screen = b === 'doctor' ? <Doctor /> : <Support />;
      break;
    case 'withdrawal':
      screen = <Withdrawal />;
      break;
    case 'settings':
      screen = <Settings />;
      break;
    case 'screening':
      screen = <Screening />;
      break;
    default:
      screen = <Home />;
  }

  return (
    <div className={`app${showTabs ? ' has-tabs' : ''}`}>
      {storageBanner}
      {screen}
      {showTabs && <TabBar path={route.path} />}
    </div>
  );
}
