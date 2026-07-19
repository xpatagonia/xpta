import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Package, Users, CheckCircle, Clock, ExternalLink, Shield, Newspaper, Plus, Sparkles, Send, Trash2, Image as ImageIcon, Video, X } from 'lucide-react';
import { db, auth } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import {  collection, getDocs, updateDoc, doc, query, orderBy, setDoc, getDoc, addDoc, serverTimestamp, deleteDoc, onAuthStateChanged  } from '../lib/db';
import ReactMarkdown from 'react-markdown';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'empresas' | 'solicitudes' | 'insights' | 'membresias'>('solicitudes');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Insight form state
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [insightTitle, setInsightTitle] = useState('');
  const [insightCategory, setInsightCategory] = useState('Actualidad');
  const [insightContent, setInsightContent] = useState('');
  const [insightImage, setInsightImage] = useState('');
  const [insightVideo, setInsightVideo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && (user.email === 'xpatagonia.com@gmail.com' || user.email === 'admin@xpatagonia.com')) {
        setIsAdmin(true);
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          setEmpresas(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          const reqsSnap = await getDocs(query(collection(db, 'module_requests')));
          setRequests(reqsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]);
          
          try {
            const insightsSnap = await getDocs(query(collection(db, 'insights')));
            setInsights(insightsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          } catch (e) {
            console.error('Error fetching firestore insights', e);
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (reqId: string, userId: string, moduleId: string) => {
    try {
      await updateDoc(doc(db, 'module_requests', reqId), { status: 'approved' });
      const userSettingsRef = doc(db, 'users', userId, 'settings', 'modules');
      const docSnap = await getDoc(userSettingsRef);
      let installedIds: string[] = [];
      if (docSnap.exists() && docSnap.data().installed) {
        installedIds = docSnap.data().installed;
      }
      if (!installedIds.includes(moduleId)) {
        await setDoc(userSettingsRef, { installed: [...installedIds, moduleId] }, { merge: true });
      }
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved' } : r));
      alert('Módulo aprobado y enviado a Odoo para facturación.');
    } catch (error) {
      console.error(error);
      alert('Error aprobando módulo');
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error generando contenido');
      setInsightContent(data.insights);
      if (!insightTitle) setInsightTitle('Resumen Semanal de Patagonia');
    } catch (error: any) {
      console.error(error);
      alert(`Error al generar con IA: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightTitle || !insightContent) return;
    setIsSubmitting(true);
    try {

      const newInsight = {
        title: insightTitle,
        category: insightCategory,
        content: insightContent,
        image: insightImage,
        videoUrl: insightVideo,
        author: auth.currentUser?.email || 'Redacción',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'insights'), newInsight);
      setInsights([{ id: docRef.id, ...newInsight }, ...insights]);

      
      setIsInsightModalOpen(false);
      setInsightTitle('');
      setInsightCategory('Actualidad');
      setInsightContent('');
      setInsightImage('');
      setInsightVideo('');
    } catch (error) {
      console.error(error);
      alert('Error al crear insight');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteInsight = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
    try {
      await deleteDoc(doc(db, 'insights', id));
      setInsights(insights.filter(i => i.id !== id));
    } catch (error) {
      console.error(error);
      alert('Error eliminando insight');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 text-center">
        <p className="text-slate-500">Acceso restingido. Debes iniciar sesión como administrador.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              Panel Super Admin
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gestión centralizada de clientes, solicitudes y publicaciones.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap bg-white dark:bg-[#1A1625] p-1 rounded-xl mb-8 w-max max-w-full border border-slate-200 dark:border-white/10">
          <button
            onClick={() => setActiveTab('solicitudes')}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'solicitudes' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Package className="w-4 h-4" /> Módulos
          </button>
          <button
            onClick={() => setActiveTab('empresas')}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'empresas' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Building2 className="w-4 h-4" /> Empresas
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'insights' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Newspaper className="w-4 h-4" /> Insights (Blog)
          </button>
          <button
            onClick={() => setActiveTab('membresias')}
            className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'membresias' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Shield className="w-4 h-4" /> Roles & Membresías
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12"><p className="text-slate-500">Cargando datos...</p></div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'insights' && (
              <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publicaciones de Insight</h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={async () => {
                      if (window.confirm("¿Deseas forzar la ejecución del cron (Generar Noticia Automática)?")) {
                        try {
                           const token = await auth.currentUser?.getIdToken();
                           const res = await fetch(`${getApiUrl()}/api/cron/publish-insight`, {
                             method: 'POST',
                             headers: { 'Authorization': `Bearer ${token}` }
                           });
                           const data = await res.json();
                           if (!res.ok) throw new Error(data.error || 'Error ejecutando cron');
                           alert('Se generó la noticia exitosamente. Recarga la página para verla.');
                        } catch(e: any) {
                           alert('Error: ' + e.message);
                        }
                      }
                    }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Ejecutar Cron AI
                    </button>
                    <button onClick={() => setIsInsightModalOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20">
                      <Plus className="w-4 h-4" /> Nuevo Artículo
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {insights.map(post => (
                    <div key={post.id} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col group relative">
                      <button onClick={() => handleDeleteInsight(post.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-lg">
                         <Trash2 className="w-4 h-4" />
                      </button>
                      {post.image && (
                        <div className="h-48 overflow-hidden bg-slate-100 dark:bg-[#110E17]">
                           <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5 flex-1 flex flex-col bg-slate-50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded-md">{post.category}</span>
                           <span className="text-[10px] text-slate-500">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Nuevo'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-3 mb-4">{post.content.replace(/__LOC__.*?__LOC__\s*/, '').replace(/[#*]/g, '').substring(0, 150)}...</p>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && <p className="text-slate-500 text-sm col-span-full">No hay artículos publicados.</p>}
                </div>
              </div>
            )}
            
            {/* ... keeping other tabs ... */}
            {activeTab === 'solicitudes' && (
              <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Solicitudes Pendientes de Facturación</h2>
                {requests.length === 0 ? (
                  <p className="text-slate-500 text-sm">No hay solicitudes registradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-[#110E17] text-slate-500 border-b border-slate-200 dark:border-white/10">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Empresa / Usuario</th>
                          <th className="px-4 py-3 font-semibold">Módulo</th>
                          <th className="px-4 py-3 font-semibold">Estado en Hub</th>
                          <th className="px-4 py-3 font-semibold text-right">Integración Odoo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((req) => {
                          const companyInfo = empresas.find(e => e.id === req.userId);
                          const displayName = req.companyName || (companyInfo ? companyInfo.companyName : '') || req.userId;
                          
                          return (
                          <tr key={req.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="px-4 py-4">
                              <span className="font-medium text-slate-900 dark:text-white">{displayName}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">{req.moduleName}</span>
                            </td>
                            <td className="px-4 py-4">
                              {req.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-xs font-bold uppercase tracking-wider">
                                  <Clock className="w-3 h-3" /> Pendiente Autorización
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-bold uppercase tracking-wider">
                                  <CheckCircle className="w-3 h-3" /> Activo (Facturado)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {req.status === 'pending' && (
                                <button
                                  onClick={() => handleApprove(req.id, req.userId, req.moduleId)}
                                  className="px-4 py-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-500/20 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors inline-flex items-center justify-end gap-2"
                                >
                                  Aprobar a Odoo <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'empresas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {empresas.map((emp) => (
                  <div key={emp.id} className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{emp.companyName || 'Empresa sin nombre'}</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{emp.email || emp.id}</p>
                      </div>
                    </div>
                    {emp.category && (
                      <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2">
                        {emp.category}
                      </span>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400">{emp.city ? `${emp.city}, ` : ''}{emp.province}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg">
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Membresía</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{emp.membershipLevel || 'Basic'}</span>
                      </div>
                      <div className="flex-1 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">
                        <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Trust Score</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{emp.trustScore || 50}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
                {empresas.length === 0 && <p className="text-slate-500 text-sm col-span-full">No hay empresas registradas.</p>}
              </div>
            )}
            
            {activeTab === 'membresias' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Gestión de Roles y Membresías (RBAC)</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-2xl">
                    Administra los niveles de acceso y los beneficios para las empresas registradas. La estructura soporta control de acceso basado en roles (RBAC) y límites de uso según la membresía.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Tier */}
                    <div className="border border-slate-200 dark:border-white/10 rounded-xl p-5 relative">
                      <div className="absolute top-0 right-0 p-3">
                         <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider">Tier 1</span>
                      </div>
                      <Shield className="w-8 h-8 text-slate-400 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Basic</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">Gratis</p>
                      <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Max 10 productos</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> 3 RFQs mensuales</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Matchmaking Básico</li>
                      </ul>
                    </div>
                    
                    {/* Premium Tier */}
                    <div className="border-2 border-orange-500 rounded-xl p-5 relative bg-orange-50 dark:bg-orange-500/5">
                      <div className="absolute top-0 right-0 p-3">
                         <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-md text-[10px] font-bold uppercase tracking-wider">Tier 2</span>
                      </div>
                      <Sparkles className="w-8 h-8 text-orange-500 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Premium</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">U$D 49<span className="text-sm font-normal text-slate-500">/mes</span></p>
                      <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Productos Ilimitados</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> RFQs Ilimitados</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Insignia Verificada</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> AI Insights Avanzados</li>
                      </ul>
                    </div>
                    
                    {/* Enterprise Tier */}
                    <div className="border border-slate-200 dark:border-white/10 rounded-xl p-5 relative">
                      <div className="absolute top-0 right-0 p-3">
                         <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-md text-[10px] font-bold uppercase tracking-wider">Tier 3</span>
                      </div>
                      <Building2 className="w-8 h-8 text-purple-500 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">A Medida</p>
                      <ul className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Todo de Premium</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> SLA & Soporte Prioritario</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Auditoría ESG & Sustainability</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> API Access</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Asignación de Membresías (Simulación)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-[#110E17] text-slate-500 border-b border-slate-200 dark:border-white/10">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Empresa</th>
                          <th className="px-4 py-3 font-semibold">Rol Actual</th>
                          <th className="px-4 py-3 font-semibold">Membresía</th>
                          <th className="px-4 py-3 font-semibold text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empresas.slice(0, 5).map((emp) => (
                          <tr key={emp.id} className="border-b border-slate-100 dark:border-white/5">
                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{emp.companyName || emp.email}</td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded text-xs font-bold">VENDOR</span>
                            </td>
                            <td className="px-4 py-4">
                               <select 
                                 defaultValue={emp.membershipLevel || 'basic'}
                                 className="bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm outline-none focus:border-orange-500"
                               >
                                 <option value="basic">Basic (Gratis)</option>
                                 <option value="premium">Premium</option>
                                 <option value="enterprise">Enterprise</option>
                               </select>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button className="text-orange-500 hover:text-orange-600 font-bold text-xs uppercase">
                                Actualizar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {empresas.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">No hay empresas para mostrar</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isInsightModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsInsightModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1A1625] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
              <div className="sticky top-0 bg-white dark:bg-[#1A1625] p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center z-10">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Artículo</h2>
                 <button onClick={() => setIsInsightModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreateInsight} className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Título</label>
                    <input type="text" required value={insightTitle} onChange={e => setInsightTitle(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/50" placeholder="Ej: Nuevas inversiones en Vaca Muerta" />
                  </div>
                  <div className="w-64">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Categoría</label>
                    <select value={insightCategory} onChange={e => setInsightCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/50">
                      <option value="Actualidad">Actualidad</option>
                      <option value="Empresarial">Empresarial</option>
                      <option value="Negocios">Negocios</option>
                      <option value="Startups">Startups</option>
                      <option value="Innovación">Innovación</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> URL de Imagen de Portada</label>
                    <input type="url" value={insightImage} onChange={e => setInsightImage(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white" placeholder="https://ejemplo.com/foto.jpg" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><Video className="w-4 h-4" /> URL de Video (YouTube/Vimeo)</label>
                    <input type="url" value={insightVideo} onChange={e => setInsightVideo(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Contenido (Markdown soportado)</label>
                    <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-md text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50">
                      {isGenerating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isGenerating ? 'Generando...' : 'Generar con IA (Resumen Patagónico)'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea required value={insightContent} onChange={e => setInsightContent(e.target.value)} rows={12} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 font-mono text-sm" placeholder="Escribe el artículo aquí..." />
                    <div className="prose prose-sm dark:prose-invert bg-slate-50 dark:bg-[#110E17] p-4 rounded-lg border border-slate-200 dark:border-white/10 overflow-y-auto h-[320px]">
                      {insightContent ? <ReactMarkdown>{insightContent}</ReactMarkdown> : <p className="text-slate-400 italic">Vista previa del contenido...</p>}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsInsightModalOpen(false)} className="px-6 py-3 font-bold text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Publicar Artículo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

