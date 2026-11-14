import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RegionalIndicators from './components/RegionalIndicators';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import PlatformCapabilities from './components/PlatformCapabilities';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import CookieBanner from './components/CookieBanner';
import NewsMagazine from './components/NewsMagazine';
import {
  SiteSettings,
  fetchSiteSettings,
  getCachedSiteSettings,
  SITE_SETTINGS_EVENT,
} from './lib/siteSettings';

// Fase 3: Lazy-loaded routes para reducir drásticamente el bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Services = lazy(() => import('./pages/Services'));
const Pricing = lazy(() => import('./pages/Pricing'));
const CompanyProfile = lazy(() => import('./pages/CompanyProfile'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AppStore = lazy(() => import('./pages/AppStore'));
const LogisticsModule = lazy(() => import('./pages/LogisticsModule'));
const WarehousingModule = lazy(() => import('./pages/WarehousingModule'));
const EcommerceModule = lazy(() => import('./pages/EcommerceModule'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Inbox = lazy(() => import('./pages/Inbox'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Insights = lazy(() => import('./pages/Insights'));
const B2BMessenger = lazy(() => import('./pages/B2BMessenger'));

function Home() {
  const [settings, setSettings] = useState<SiteSettings>(() => getCachedSiteSettings());

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
    const handler = (e: Event) => {
      const custom = e as CustomEvent<SiteSettings>;
      setSettings(custom.detail || getCachedSiteSettings());
    };
    window.addEventListener(SITE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SITE_SETTINGS_EVENT, handler);
  }, []);

  const { sections } = settings;

  return (
    <>
      <Hero />
      {sections.indicators && <RegionalIndicators />}
      {sections.insights && <NewsMagazine />}
      {sections.ecosystem && <PlatformCapabilities />}
      {sections.categories && <Categories />}
      {sections.howItWorks && <HowItWorks />}
      {sections.contact && <Contact />}
    </>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <span className="text-xs font-bold uppercase tracking-widest">Cargando módulo...</span>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-800 dark:text-slate-100 bg-white dark:bg-[#110E17] font-sans selection:bg-purple-500 selection:text-white flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/planes" element={<Pricing />} />
              <Route path="/perfil-empresa" element={<CompanyProfile />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/apps" element={<AppStore />} />
              <Route path="/logistica" element={<LogisticsModule />} />
              <Route path="/warehousing" element={<WarehousingModule />} />
              <Route path="/ecommerce" element={<EcommerceModule />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/chat" element={<B2BMessenger />} />
              <Route path="/comunicaciones-b2b" element={<B2BMessenger />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <BackToTop />
        <CookieBanner />
      </div>
    </Router>
  );
}
