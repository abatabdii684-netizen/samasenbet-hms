import React, { useState, useEffect } from 'react';
import {
  SunIcon, MoonIcon, ComputerDesktopIcon,
  BellIcon, GlobeAltIcon, ShieldCheckIcon,
  BuildingOfficeIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@store/authStore';
import toast from 'react-hot-toast';

const THEMES    = [
  { value: 'light',  label: 'Light',  Icon: SunIcon            },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon           },
  { value: 'system', label: 'System', Icon: ComputerDesktopIcon },
];

const LANGUAGES = [
  { value: 'en', label: 'English'  },
  { value: 'am', label: 'Amharic'  },
  { value: 'om', label: 'Oromiffa' },
];

const CURRENCIES = ['ETB','USD','EUR'];
const DATE_FMTS  = ['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'];
const TIME_FMTS  = ['12h','24h'];

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
      <Icon className="w-4 h-4 text-primary-600" />
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3
                    border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();

  // Appearance
  const [theme,    setTheme]    = useState(() => localStorage.getItem('theme')    || 'system');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  // Format
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'ETB');
  const [dateFmt,  setDateFmt]  = useState(() => localStorage.getItem('dateFmt')  || 'DD/MM/YYYY');
  const [timeFmt,  setTimeFmt]  = useState(() => localStorage.getItem('timeFmt')  || '24h');

  // Notifications
  const [notifSound,   setNotifSound]   = useState(() => localStorage.getItem('notifSound')   !== 'false');
  const [notifBrowser, setNotifBrowser] = useState(() => localStorage.getItem('notifBrowser') !== 'false');
  const [notifEmail,   setNotifEmail]   = useState(() => localStorage.getItem('notifEmail')   === 'true');

  // Session
  const [autoLogout, setAutoLogout] = useState(() => localStorage.getItem('autoLogout') || '30');

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const savePref = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, value);
    toast.success('Preference saved');
  };

  const saveToggle = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, value.toString());
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your experience and application preferences</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <SectionHeader icon={SunIcon} title="Appearance" />

        <SettingRow label="Theme" description="Choose how the interface looks">
          <div className="flex gap-2">
            {THEMES.map(t => (
              <button key={t.value} onClick={() => savePref('theme', t.value, setTheme)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  theme === t.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                <t.Icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Language" description="Interface display language">
          <select className="input w-auto" value={language}
            onChange={e => savePref('language', e.target.value, setLanguage)}>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </SettingRow>
      </div>

      {/* Format */}
      <div className="card p-5">
        <SectionHeader icon={GlobeAltIcon} title="Regional Format" />

        <SettingRow label="Currency" description="Currency used in billing and reports">
          <select className="input w-auto" value={currency}
            onChange={e => savePref('currency', e.target.value, setCurrency)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </SettingRow>

        <SettingRow label="Date Format" description="How dates are displayed across the app">
          <select className="input w-auto" value={dateFmt}
            onChange={e => savePref('dateFmt', e.target.value, setDateFmt)}>
            {DATE_FMTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </SettingRow>

        <SettingRow label="Time Format" description="12-hour or 24-hour clock">
          <select className="input w-auto" value={timeFmt}
            onChange={e => savePref('timeFmt', e.target.value, setTimeFmt)}>
            {TIME_FMTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </SettingRow>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <SectionHeader icon={BellIcon} title="Notifications" />

        <SettingRow label="Sound Alerts" description="Play a sound for new notifications">
          <Toggle checked={notifSound} onChange={v => saveToggle('notifSound', v, setNotifSound)} />
        </SettingRow>

        <SettingRow label="Browser Notifications" description="Show desktop notifications when the tab is in background">
          <Toggle checked={notifBrowser} onChange={async (v) => {
            if (v && Notification.permission !== 'granted') {
              const perm = await Notification.requestPermission();
              if (perm !== 'granted') { toast.error('Browser permission denied'); return; }
            }
            saveToggle('notifBrowser', v, setNotifBrowser);
          }} />
        </SettingRow>

        <SettingRow label="Email Notifications" description="Receive email alerts for critical events">
          <Toggle checked={notifEmail} onChange={v => saveToggle('notifEmail', v, setNotifEmail)} />
        </SettingRow>
      </div>

      {/* Security */}
      <div className="card p-5">
        <SectionHeader icon={ShieldCheckIcon} title="Security" />

        <SettingRow label="Auto Logout" description="Automatically log out after inactivity">
          <select className="input w-auto" value={autoLogout}
            onChange={e => savePref('autoLogout', e.target.value, setAutoLogout)}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="0">Never</option>
          </select>
        </SettingRow>

        <SettingRow label="Current Session"
          description={`Logged in as: ${user?.username} (${user?.role?.displayName})`}>
          <span className="badge badge-green">Active</span>
        </SettingRow>
      </div>

      {/* System Info */}
      <div className="card p-5">
        <SectionHeader icon={Cog6ToothIcon} title="System Information" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Application',  'YFM General Hospital PLC HMS'],
            ['Version',      'v1.0.0'],
            ['Environment',  import.meta.env.MODE],
            ['API Base URL', import.meta.env.VITE_API_BASE_URL],
            ['Build Date',   '2026'],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
