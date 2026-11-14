import { getApiUrl } from '../lib/apiConfig';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox, CheckCircle, Clock, MessageSquare, AlertCircle, Send, Plus, Mail, FileText, Sparkles } from 'lucide-react';
import { db, auth, collection, onSnapshot } from '../lib/db';
import { onAuthStateChanged } from '../lib/db';
import ArnAiRadar from './ArnAiRadar';

export default function CompanyInbox() {
  const [activeSection, setActiveSection] = useState<'arn' | 'inbox' | 'templates'>('arn');
  const [statusNotice, setStatusNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const showNotice = (type: 'ok' | 'err', text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 4500);
  };

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);

  const [replyText, setReplyText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([
    { id: '1', label: 'Envío de Cotización', content: 'Estimados,\n\nAdjuntamos nuestra cotización formal. Los productos se encuentran en stock con disponibilidad inmediata.\n\nQuedamos a su entera disposición.' },
    { id: '2', label: 'Solicitar Información', content: 'Estimados,\n\nPara poder avanzar con la cotización requerimos información técnica adicional o detalles de entrega.\n\nEsperamos sus comentarios.' },
    { id: '3', label: 'Aviso de Sin Stock', content: 'Estimados,\n\nLamentablemente en esta oportunidad no contamos con stock para cumplir con la solicitud en los plazos indicados.\n\nAgradecemos tenernos en cuenta.' },
    { id: '4', label: 'Mensaje de Bienvenida/Registro', content: 'Estimados,\n\nGracias por registrarse en nuestra plataforma. A partir de ahora recibirán nuestras notificaciones y cotizaciones de forma directa.\n\nSaludos.' },
    { id: '5', label: 'Firma Automática', content: '\n\n--\nDepartamento de Ventas\nventas@nuestraempresa.com.ar\n+54 9 11 1234-5678\nNuestra Empresa S.A.' }
  ]);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({ label: '', content: '' });

  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [composeShowTemplates, setComposeShowTemplates] = useState(false);

  useEffect(() => {
    let unsubscribeRfqs: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRfqs([]);
        return;
      }

      unsubscribeRfqs = onSnapshot(collection(db, 'crm_rfqs'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          idDisplay: doc.data().rfqId,
          ...doc.data()
        }));
        setRfqs(data);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRfqs) unsubscribeRfqs();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#1A1625] px-6 py-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> ARN IA &amp; Bandeja Comercial
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Inteligencia autónoma híbrida que reemplaza al CRM manual: califica oportunidades, redacta cotizaciones y coordina despachos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto bg-slate-100 dark:bg-black/20 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveSection('arn')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition flex-1 sm:flex-none justify-center ${activeSection === 'arn' ? 'bg-white dark:bg-[#1A1625] text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" /> ARN IA
            </button>
            <button
              onClick={() => setActiveSection('inbox')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition flex-1 sm:flex-none justify-center ${activeSection === 'inbox' ? 'bg-white dark:bg-[#1A1625] text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Inbox className="w-4 h-4" /> RFQs
            </button>
            <button
              onClick={() => setActiveSection('templates')}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition flex-1 sm:flex-none justify-center ${activeSection === 'templates' ? 'bg-white dark:bg-[#1A1625] text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> Plantillas
            </button>
          </div>
          <button
            onClick={() => { setComposeData({ to: '', subject: '', body: templates.find(t => t.label === 'Firma Automática')?.content || '' }); setShowCompose(true); }}
            className="w-full sm:w-auto px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <MessageSquare className="w-4 h-4" /> Redactar
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold ${
            statusNotice.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          {statusNotice.text}
        </div>
      )}

      {activeSection === 'arn' && <ArnAiRadar />}

      {activeSection === 'inbox' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox List */}
          <div className="lg:col-span-1 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Solicitudes Recibidas</h3>
              <div className="bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold px-2 py-1 rounded-md text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> 1 Nueva
              </div>
            </div>
            <div className="overflow-y-auto flex-1 select-none">
              {rfqs.map(rfq => (
                <div 
                  key={rfq.id}
                  onClick={() => {
                    setSelectedRfq(rfq);
                    setRfqs(rfqs.map(r => r.id === rfq.id ? { ...r, unread: false } : r));
                    setReplyText(templates.find(t => t.label === 'Firma Automática')?.content || '');
                  }}
                  className={`p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors ${selectedRfq?.id === rfq.id ? 'bg-purple-50 dark:bg-purple-500/10 border-l-4 border-l-purple-500' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02] border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">RFQ #{rfq.rfqId || rfq.idDisplay}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{rfq.dateString || rfq.date}</span>
                  </div>
                  <h4 className={`text-sm mb-1 line-clamp-1 ${rfq.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                    {rfq.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mb-2">{rfq.buyer}</p>
                  <div className="flex items-center gap-2">
                    {rfq.status === 'new' && <span className="text-[10px] uppercase tracking-wider font-bold text-orange-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>}
                    {rfq.status === 'replied' && <span className="text-[10px] uppercase tracking-wider font-bold text-purple-500 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Cotizado</span>}
                    {rfq.status === 'awarded' && <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Adjudicado</span>}
                    {rfq.priority === 'high' && <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500"></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col h-[600px] overflow-hidden">
            {selectedRfq ? (
              <>
                {/* Thread Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1A1625]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedRfq.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{selectedRfq.buyer}</p>
                    </div>
                    <span className="bg-white dark:bg-black/20 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                      RFQ #{selectedRfq.rfqId || selectedRfq.idDisplay || selectedRfq.id}
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-lg p-3 w-1/3">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Estado</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {selectedRfq.status === 'new' ? <span className="text-orange-500">Pendiente Cotización</span> : selectedRfq.status === 'replied' ? <span className="text-purple-500">Cotización Enviada</span> : <span className="text-emerald-500">Adjudicado</span>}
                      </span>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-lg p-3 w-1/3">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Prioridad</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{selectedRfq.priority === 'high' ? 'Alta / Urgente' : selectedRfq.priority === 'medium' ? 'Media' : 'Baja'}</span>
                    </div>
                    <div className="flex flex-col bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-lg p-3 w-1/3 text-right items-end justify-center">
                      {selectedRfq.status === 'new' && (
                        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded shadow transition hover:opacity-90">
                          Marcar como Leído
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thread Body */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-[#110E17]">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 font-bold text-slate-600 dark:text-slate-300">
                      {selectedRfq.buyer.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/5 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedRfq.buyer}</span>
                          <span className="text-[10px] text-slate-400">{selectedRfq.dateString || selectedRfq.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          Estimados,<br/><br/>
                          Por medio de la presente, solicitamos cotización para los ítems detallados: {selectedRfq.title}.<br/>
                          <strong>Requerimientos:</strong><br/>
                          - Entrega en Base Neuquén antes del día 25.<br/>
                          - Cotizar en Pesos Argentinos o USD Oficial.<br/>
                          - Incluir hoja técnica.<br/><br/>
                          Aguardamos sus comentarios.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedRfq.status !== 'new' && (
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0 font-bold text-purple-600 dark:text-purple-400">
                        TÚ
                      </div>
                      <div className="flex-1">
                        <div className="bg-purple-500 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold">Tu Empresa</span>
                            <span className="text-[10px] opacity-80">Hace 1 día</span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            Buenas tardes,<br/><br/>
                            Adjuntamos nuestra propuesta formal nro #49122 con disponibilidad inmediata de los insumos en nuestras bodegas.<br/>
                            El valor total estimado asciende a $4.500.000 + IVA.<br/><br/>
                            Saludos cordiales.
                          </p>
                          <div className="mt-3 bg-black/10 rounded p-3 flex items-center gap-3">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-bold">Cotizacion_49122.pdf</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#1A1625] flex flex-col gap-3 relative">
                  <div className="flex gap-2 mb-1">
                    <button 
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3" /> Plantillas Rápidas
                    </button>
                  </div>
                  
                  {showTemplates && (
                    <div className="absolute bottom-[100%] left-4 mb-2 w-72 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                      <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1A1625] text-xs font-bold text-slate-500">Insertar Plantilla</div>
                      <div className="max-h-64 overflow-y-auto p-1">
                        {templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => {
                              setReplyText(prev => prev + (prev ? '\n\n' : '') + tpl.content);
                              setShowTemplates(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition"
                          >
                            {tpl.label}
                          </button>
                        ))}
                        {templates.length === 0 && (
                          <div className="p-3 text-xs text-slate-500 text-center">
                            No hay plantillas guardadas.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <textarea 
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Responder a ${selectedRfq.buyer}... (Añadir archivo, adjuntar PDF, etc.)`}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    />
                    <button 
                      onClick={async () => {
                        if (replyText.trim()) {
                          try {
                            const user = auth.currentUser;
                            const token = await auth.getToken();
                            const response = await fetch(`${getApiUrl()}/api/emails/send`, {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                              },
                              body: JSON.stringify({
                                to: 'info@' + selectedRfq.buyer.replace(/\s+/g, '').toLowerCase() + '.com',
                                subject: `Re: Solicitud de cotización #${selectedRfq.rfqId}`,
                                text: replyText
                              })
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.error || 'Error enviando el correo');
                            
                            if (data.mocked) {
                              const missingText = data.missing ? ` (Faltan: ${data.missing.join(', ')})` : '';
                              showNotice('err', `El servidor no tiene configuradas credenciales de correo${missingText}.`);
                            } else {
                              showNotice('ok', 'Respuesta enviada exitosamente.');
                            }
                            setReplyText("");
                          } catch (err: any) {
                            showNotice('err', err.message || 'Error enviando respuesta');
                          }
                        }
                      }}
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Selecciona un RFQ</h3>
                <p className="text-sm text-slate-500">Haz clic en una solicitud del panel izquierdo para ver sus detalles y enviar tu cotización oficial.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Sección de Contactos CRM reemplazada por Motor ARN IA */}

      {activeSection === 'templates' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white dark:bg-[#1A1625] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Plantillas Rápidas</h3>
                 <p className="text-sm text-slate-500">Administra las respuestas predefinidas para correos y notificaciones.</p>
               </div>
               <button 
                 onClick={() => {
                   setEditingTemplateId(null);
                   setNewTemplate({ label: '', content: '' });
                   setShowAddTemplate(true);
                 }}
                 className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> Crear Plantilla
               </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#110E17] hover:border-purple-500/30 transition flex flex-col group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      {tpl.label}
                    </h4>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line flex-1">
                    {tpl.content}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingTemplateId(tpl.id);
                        setNewTemplate({ label: tpl.label, content: tpl.content });
                        setShowAddTemplate(true);
                      }}
                      className="flex-1 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setTemplates(prev => prev.filter(t => t.id !== tpl.id));
                        showNotice('ok', 'Plantilla eliminada.');
                      }}
                      className="flex-1 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay plantillas</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2">Crea plantillas para responder rápidamente a las solicitudes de cotización.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}



      {/* Add Template Modal */}
      <AnimatePresence>
        {showAddTemplate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTemplate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1A1625] rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-white/10 overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {editingTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre / Etiqueta</label>
                  <input
                    type="text"
                    value={newTemplate.label}
                    onChange={(e) => setNewTemplate({ ...newTemplate, label: e.target.value })}
                    placeholder="Ej. Envío de Cotización"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Contenido</label>
                  <textarea
                    rows={6}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Escribe el mensaje aquí..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={() => setShowAddTemplate(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (newTemplate.label && newTemplate.content) {
                      if (editingTemplateId) {
                        setTemplates(prev => prev.map(t => t.id === editingTemplateId ? { ...t, ...newTemplate } : t));
                      } else {
                        setTemplates(prev => [...prev, { id: Math.random().toString(), ...newTemplate }]);
                      }
                      setShowAddTemplate(false);
                    }
                  }} 
                  disabled={!newTemplate.label || !newTemplate.content}
                  className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition flex items-center gap-2"
                >
                  Guardar Plantilla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Compose Message Modal */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1A1625] rounded-3xl p-6 w-full max-w-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-y-auto max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" /> Redactar Mensaje
                </h3>
                <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <input
                    type="text"
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    placeholder="Para: (ej. correo@empresa.com o teléfono +549...)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Asunto"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-bold"
                  />
                </div>

                <div className="relative flex-1 flex flex-col min-h-[250px]">
                  <div className="flex gap-2 mb-2">
                    <button 
                      onClick={() => setComposeShowTemplates(!composeShowTemplates)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3" /> Insertar Plantilla
                    </button>
                  </div>
                  
                  {composeShowTemplates && (
                    <div className="absolute top-10 left-0 mb-2 w-72 bg-white dark:bg-[#110E17] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                      <div className="p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1A1625] text-xs font-bold text-slate-500">Plantillas Rápidas</div>
                      <div className="max-h-64 overflow-y-auto p-1">
                        {templates.map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => {
                              setComposeData(prev => ({ ...prev, body: prev.body + (prev.body ? '\n\n' : '') + tpl.content }));
                              setComposeShowTemplates(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition"
                          >
                            {tpl.label}
                          </button>
                        ))}
                        {templates.length === 0 && (
                          <div className="p-3 text-xs text-slate-500 text-center">No hay plantillas.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    placeholder="Escribe el cuerpo del mensaje..."
                    className="flex-1 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-white/5">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Enviar vía Email
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCompose(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      if (composeData.to && composeData.body) {
                        try {
                          const user = auth.currentUser;
                          const token = await auth.getToken();
                          const response = await fetch(`${getApiUrl()}/api/emails/send`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                              to: composeData.to,
                              subject: composeData.subject,
                              text: composeData.body
                            })
                          });
                          const data = await response.json();
                          if (!response.ok) throw new Error(data.error || 'Error enviando el correo');
                          
                          if (data.mocked) {
                            const missingText = data.missing ? ` (Faltan: ${data.missing.join(', ')})` : '';
                            showNotice('err', `Faltan credenciales de correo en el servidor${missingText}.`);
                          } else {
                            showNotice('ok', 'Correo enviado exitosamente.');
                          }
                          setComposeData({ to: '', subject: '', body: '' });
                          setShowCompose(false);
                        } catch (err: any) {
                          showNotice('err', err.message || 'Error al enviar correo');
                        }
                      }
                    }}
                    disabled={!composeData.to || !composeData.body}
                    className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Enviar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
