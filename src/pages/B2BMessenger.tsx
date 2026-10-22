import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Phone, Video, Send, Paperclip, Smile, Search, 
  Circle, CheckCheck, Clock, ShieldCheck, Building2, MapPin, 
  Volume2, VolumeX, Mic, MicOff, VideoOff, PhoneOff, Monitor, 
  Settings, Users, Hash, FileText, ChevronRight, X, ExternalLink,
  Sparkles, Bell
} from 'lucide-react';
import { auth, db } from '../lib/db';
import { getApiUrl } from '../lib/apiConfig';
import { Link } from 'react-router-dom';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  status: UserStatus;
  statusMessage?: string;
  avatarBg: string;
  verified: boolean;
  unreadCount?: number;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderCompany?: string;
  recipientId?: string; // contactId or channelId
  text: string;
  timestamp: string;
  isSelf: boolean;
  type?: 'text' | 'rfq' | 'file';
  rfqData?: {
    title: string;
    category: string;
    budget: string;
  };
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'chan-bioeconomia', name: 'bioeconomia-circular', description: 'Proyectos de biomasa, algas, residuos orgánicos y valorización', category: 'Sostenibilidad', memberCount: 38 },
  { id: 'chan-logistica', name: 'logistica-y-cadena-frio', description: 'Coordinación de transporte, consolidación de cargas y depósitos', category: 'Operaciones', memberCount: 52, unreadCount: 2 },
  { id: 'chan-hidrocarburos', name: 'energia-vaca-muerta', description: 'Proveedores industriales, metalmecánica y servicios para Cuenca Neuquina', category: 'Energía', memberCount: 64 },
  { id: 'chan-pesca', name: 'pesca-y-puertos', description: 'Industria marítima, procesadoras y logística pesquera en Chubut y Santa Cruz', category: 'Pesca', memberCount: 29 },
  { id: 'chan-oportunidades', name: 'demandas-y-compras-b2b', description: 'Canal abierto para pedidos urgentes de cotización e insumos', category: 'Comercial', memberCount: 95, unreadCount: 1 },
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'cont-1',
    name: 'Ing. Lucas Valenzuela',
    company: 'Austral Frío Logística S.A.',
    role: 'Gerente de Operaciones',
    industry: 'Logística de Frío',
    location: 'Puerto Madryn, Chubut',
    status: 'online',
    statusMessage: 'Disponible para consolidación de cargas en RN 3',
    avatarBg: 'bg-emerald-600',
    verified: true,
    unreadCount: 1,
  },
  {
    id: 'cont-2',
    name: 'Mariana Quiroga',
    company: 'Alpat Biotecnología',
    role: 'Directora de Compras',
    industry: 'Bioeconomía & Algas',
    location: 'San Antonio Oeste, Río Negro',
    status: 'online',
    statusMessage: 'Buscando envases sustentables compostables',
    avatarBg: 'bg-purple-600',
    verified: true,
  },
  {
    id: 'cont-3',
    name: 'Carlos Benítez',
    company: 'Metalúrgica Patagónica SRL',
    role: 'Jefe de Planta',
    industry: 'Metalmecánica Oil & Gas',
    location: 'Comodoro Rivadavia, Chubut',
    status: 'busy',
    statusMessage: 'En auditoría técnica de tanques',
    avatarBg: 'bg-blue-600',
    verified: true,
  },
  {
    id: 'cont-4',
    name: 'Dra. Silvina Arismendi',
    company: 'Patagonia Hidrógeno Verde',
    role: 'Coordinadora de Alianzas',
    industry: 'Energías Renovables',
    location: 'Punta Arenas / Río Gallegos',
    status: 'away',
    statusMessage: 'Vuelvo a las 18:00 hs',
    avatarBg: 'bg-teal-600',
    verified: true,
  },
  {
    id: 'cont-5',
    name: 'Esteban Morales',
    company: 'Naval del Atlántico Sur',
    role: 'Suministros Navales',
    industry: 'Industria Naval & Pesca',
    location: 'Ushuaia, Tierra del Fuego',
    status: 'offline',
    statusMessage: 'Desconectado',
    avatarBg: 'bg-slate-600',
    verified: false,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'cont-1': [
    {
      id: 'm1',
      senderId: 'cont-1',
      senderName: 'Ing. Lucas Valenzuela',
      senderCompany: 'Austral Frío Logística S.A.',
      recipientId: 'self',
      text: '¡Hola! Vi tu solicitud de bodega de frío en Comodoro. Tenemos 40 posiciones pallet disponibles para la próxima semana a -20°C.',
      timestamp: '15:20',
      isSelf: false,
    },
    {
      id: 'm2',
      senderId: 'self',
      senderName: 'Mi Empresa',
      recipientId: 'cont-1',
      text: 'Excelente Lucas. ¿Tienen habilitación SENASA para traslado de productos congelados de mar?',
      timestamp: '15:22',
      isSelf: true,
    },
    {
      id: 'm3',
      senderId: 'cont-1',
      senderName: 'Ing. Lucas Valenzuela',
      senderCompany: 'Austral Frío Logística S.A.',
      recipientId: 'self',
      text: 'Sí, certificación oficial vigente y registro de termógrafos satelitales en vivo cada 5 minutos.',
      timestamp: '15:25',
      isSelf: false,
    }
  ],
  'chan-logistica': [
    {
      id: 'cl1',
      senderId: 'cont-3',
      senderName: 'Carlos Benítez',
      senderCompany: 'Metalúrgica Patagónica SRL',
      text: 'Colegas, tenemos un camión chasis volviendo vacío desde Neuquén hacia Trelew este jueves por RN 22 / RN 3. Espacio para 12 tn.',
      timestamp: '11:10',
      isSelf: false,
    },
    {
      id: 'cl2',
      senderId: 'cont-1',
      senderName: 'Ing. Lucas Valenzuela',
      senderCompany: 'Austral Frío Logística S.A.',
      text: 'Buen dato Carlos. Te envié un mensaje directo para coordinar una parte de la carga en Choele Choel.',
      timestamp: '11:15',
      isSelf: false,
    }
  ]
};

// Generador de audio Web Audio API estilo ICQ / B2B Chime sutil
function playTone(type: 'message' | 'call' | 'connect') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'message') {
      // Clásico doble chime amigable
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'connect') {
      // Sonido de presencia
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Silencioso si el navegador bloquea audio antes de interacción
  }
}

export default function B2BMessenger() {
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>('online');
  const [userStatusMessage, setUserStatusMessage] = useState('Disponible para operaciones B2B');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'contacts' | 'channels'>('contacts');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(DEFAULT_CONTACTS[0]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para llamada de Voz / Video (Etapa 2 lista)
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video';
    withContact: Contact;
    status: 'calling' | 'connected';
    duration: number;
    muted: boolean;
    cameraOff: boolean;
    screenSharing: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact, selectedChannel]);

  // Cronómetro de llamada activa
  useEffect(() => {
    let timer: any;
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall?.status]);

  const formatCallDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const targetId = selectedContact ? selectedContact.id : (selectedChannel ? selectedChannel.id : '');
    if (!targetId) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: 'self',
      senderName: auth.currentUser?.email?.split('@')[0] || 'Mi Empresa',
      senderCompany: 'Mi Empresa Patagónica',
      recipientId: targetId,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      type: 'text',
    };

    setMessages(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), newMsg]
    }));

    setInputText('');
    if (soundEnabled) playTone('message');

    // Simulación de respuesta automática inteligente si es un contacto 1 a 1
    if (selectedContact && !selectedChannel) {
      setTimeout(() => {
        const responses = [
          'Recibido con gusto. ¿Te parece si coordinamos una llamada rápida para fijar términos y entrega?',
          'Perfecto, estamos revisando la disponibilidad de stock en el depósito de Comodoro.',
          'Anotado. Te comparto el comprobante y manifiesto en cuanto lo emitamos.',
          'De acuerdo, podemos incluirlo en la ruta logística del próximo martes.'
        ];
        const randomResp = responses[Math.floor(Math.random() * responses.length)];
        const replyMsg: ChatMessage = {
          id: 'reply-' + Date.now(),
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderCompany: selectedContact.company,
          recipientId: 'self',
          text: randomResp,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false,
          type: 'text',
        };
        setMessages(p => ({
          ...p,
          [selectedContact.id]: [...(p[selectedContact.id] || []), replyMsg]
        }));
        if (soundEnabled) playTone('message');
      }, 1400);
    }
  };

  const handleSendQuickRfq = () => {
    const targetId = selectedContact ? selectedContact.id : (selectedChannel ? selectedChannel.id : '');
    if (!targetId) return;

    const rfqMsg: ChatMessage = {
      id: 'rfq-' + Date.now(),
      senderId: 'self',
      senderName: auth.currentUser?.email?.split('@')[0] || 'Mi Empresa',
      senderCompany: 'Mi Empresa Patagónica',
      recipientId: targetId,
      text: 'He adjuntado una Solicitud Formal de Cotización (RFQ Express) para revisión prioritaria.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      type: 'rfq',
      rfqData: {
        title: 'Suministro de Biomasa / Logística Térmica',
        category: 'Bioeconomía & Cadena de Frío',
        budget: 'USD 8,500 - 14,000 (Convenio Marco)',
      }
    };

    setMessages(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), rfqMsg]
    }));
    if (soundEnabled) playTone('message');
  };

  const startCall = (type: 'voice' | 'video', contact: Contact) => {
    setActiveCall({
      type,
      withContact: contact,
      status: 'calling',
      duration: 0,
      muted: false,
      cameraOff: false,
      screenSharing: false,
    });

    // Simular que el contacto atiende a los 2.5 segundos
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      if (soundEnabled) playTone('connect');
    }, 2400);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  // Filtrado de contactos y canales
  const filteredContacts = DEFAULT_CONTACTS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChannels = DEFAULT_CHANNELS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentChatId = selectedContact ? selectedContact.id : (selectedChannel ? selectedChannel.id : '');
  const currentMessages = messages[currentChatId] || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera del Centro de Comunicaciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-display">Patagonia Link</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  B2B Messenger
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Red Activa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mensajería instantánea empresarial, estados de presencia e intercomunicación segura entre empresas miembros.
              </p>
            </div>
          </div>

          {/* Selector de Estado Personal del Usuario (Estilo ICQ con look moderno) */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 px-3 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-semibold text-slate-300 block">Mi Estado</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">{userStatusMessage}</span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => { setCurrentUserStatus('online'); setUserStatusMessage('Disponible para operaciones B2B'); if (soundEnabled) playTone('connect'); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    currentUserStatus === 'online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                  title="En línea (Online)"
                >
                  <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                  <span className="hidden lg:inline text-[11px]">En línea</span>
                </button>
                <button
                  onClick={() => { setCurrentUserStatus('away'); setUserStatusMessage('Ausente temporalmente'); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    currentUserStatus === 'away' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ausente (Away)"
                >
                  <Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span className="hidden lg:inline text-[11px]">Ausente</span>
                </button>
                <button
                  onClick={() => { setCurrentUserStatus('busy'); setUserStatusMessage('En reunión / Ocupado'); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    currentUserStatus === 'busy' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ocupado (Busy)"
                >
                  <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                  <span className="hidden lg:inline text-[11px]">Ocupado</span>
                </button>
              </div>

              {/* Botón de Sonido ON/OFF */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border transition-all ${
                  soundEnabled ? 'bg-slate-800 text-orange-400 border-orange-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
                title={soundEnabled ? 'Sonidos activados (Chimes)' : 'Sonidos silenciados'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Principal del Chat (2 Columnas: Contactos/Canales + Ventana de Conversación) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-230px)] min-h-[580px]">
          
          {/* COLUMNA IZQUIERDA: Directorio de Contactos y Canales (4 cols) */}
          <div className="lg:col-span-4 bg-slate-800/90 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Buscador y Pestañas */}
            <div className="p-4 border-b border-slate-700/80 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar empresa, contacto o canal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Tabs: Empresas Directas vs Canales Temáticos */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  onClick={() => { setActiveTab('contacts'); if (!selectedContact && DEFAULT_CONTACTS.length) setSelectedContact(DEFAULT_CONTACTS[0]); setSelectedChannel(null); }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'contacts' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Empresas ({DEFAULT_CONTACTS.length})
                </button>
                <button
                  onClick={() => { setActiveTab('channels'); if (!selectedChannel && DEFAULT_CHANNELS.length) setSelectedChannel(DEFAULT_CHANNELS[0]); setSelectedContact(null); }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'channels' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  Canales ({DEFAULT_CHANNELS.length})
                </button>
              </div>
            </div>

            {/* Lista con Scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/40 p-2 space-y-1">
              {activeTab === 'contacts' ? (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  const statusColors = {
                    online: 'bg-emerald-400 shadow-emerald-500/50',
                    away: 'bg-amber-400 shadow-amber-500/50',
                    busy: 'bg-red-400 shadow-red-500/50',
                    offline: 'bg-slate-500',
                  };

                  return (
                    <button
                      key={contact.id}
                      onClick={() => { setSelectedContact(contact); setSelectedChannel(null); }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'bg-slate-700/90 border border-orange-500/40 shadow-md' 
                          : 'hover:bg-slate-750 hover:bg-slate-700/40 border border-transparent'
                      }`}
                    >
                      {/* Avatar con Indicador de Estado ICQ */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-11 h-11 rounded-xl ${contact.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                          {contact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span 
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 shadow-sm ${statusColors[contact.status]}`} 
                          title={`Estado: ${contact.status}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white truncate flex items-center gap-1">
                            {contact.name}
                            {contact.verified && (
                              <span title="Empresa Verificada KYC/KYB">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {contact.status === 'online' ? '🟢 Online' : contact.status === 'away' ? '🟡 Away' : contact.status === 'busy' ? '🔴 Busy' : '⚪ Off'}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-orange-400 block truncate">{contact.company}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{contact.location}</span>
                        </div>
                        {contact.statusMessage && (
                          <p className="text-[10px] text-slate-400 italic truncate mt-1 bg-slate-900/60 px-2 py-0.5 rounded">
                            "{contact.statusMessage}"
                          </p>
                        )}
                      </div>

                      {contact.unreadCount && (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {contact.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                filteredChannels.map((channel) => {
                  const isSelected = selectedChannel?.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => { setSelectedChannel(channel); setSelectedContact(null); }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'bg-slate-700/90 border border-orange-500/40 shadow-md' 
                          : 'hover:bg-slate-700/40 border border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-orange-400 font-bold border border-slate-700 flex-shrink-0">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white truncate">#{channel.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{channel.memberCount} miembros</span>
                        </div>
                        <span className="text-[10px] text-orange-400 uppercase tracking-wider font-bold block">{channel.category}</span>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{channel.description}</p>
                      </div>
                      {channel.unreadCount && (
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {channel.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Pie de la columna: Acceso a Directorio Completo */}
            <div className="p-3 bg-slate-900/70 border-t border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Directorio de 142 empresas</span>
              <Link to="/servicios" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1">
                Ver Directorio <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* COLUMNA DERECHA: Ventana de Conversación y Acciones (8 cols) */}
          <div className="lg:col-span-8 bg-slate-800/90 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Encabezado del Chat Activo */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-850/80">
              {selectedContact ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl ${selectedContact.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {selectedContact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                      selectedContact.status === 'online' ? 'bg-emerald-400' : selectedContact.status === 'away' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white truncate">{selectedContact.name}</h2>
                      {selectedContact.verified && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-orange-400 font-medium truncate">
                      {selectedContact.company} • {selectedContact.role}
                    </p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedContact.location}
                    </span>
                  </div>
                </div>
              ) : selectedChannel ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">#{selectedChannel.name}</h2>
                    <p className="text-xs text-slate-400">{selectedChannel.description}</p>
                    <span className="text-[10px] text-orange-400 font-medium">{selectedChannel.memberCount} empresas conectadas</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Selecciona una conversación</span>
              )}

              {/* Botones de Audio y Video (Etapa 2 Preparada) */}
              {selectedContact && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startCall('voice', selectedContact)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/80 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-slate-600 hover:border-emerald-500/50 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    title="Iniciar Llamada de Voz B2B"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Llamar</span>
                  </button>
                  <button
                    onClick={() => startCall('video', selectedContact)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/80 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-slate-600 hover:border-blue-500/50 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    title="Iniciar Videollamada B2B"
                  >
                    <Video className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">Videollamada</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cuerpo de Mensajes con Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/40">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No hay mensajes previos en esta conversación</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Inicia el diálogo comercial, solicita disponibilidad de insumos o envía una Solicitud de Cotización (RFQ).
                  </p>
                </div>
              ) : (
                currentMessages.map((msg) => {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">{msg.senderName}</span>
                        {msg.senderCompany && (
                          <span className="text-[10px] text-slate-500">({msg.senderCompany})</span>
                        )}
                        <span className="text-[10px] text-slate-500">• {msg.timestamp}</span>
                      </div>

                      {/* Mensaje de tipo RFQ Rápido */}
                      {msg.type === 'rfq' && msg.rfqData ? (
                        <div className={`p-4 rounded-2xl max-w-md border shadow-lg ${
                          msg.isSelf 
                            ? 'bg-orange-950/40 border-orange-500/40 text-orange-100' 
                            : 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-500/20 text-orange-400 font-bold text-xs">
                            <Sparkles className="w-4 h-4" />
                            SOLICITUD FORMAL DE COTIZACIÓN (RFQ)
                          </div>
                          <h4 className="font-bold text-sm text-white mb-1">{msg.rfqData.title}</h4>
                          <p className="text-xs text-slate-300 mb-1">Categoría: {msg.rfqData.category}</p>
                          <p className="text-xs font-semibold text-amber-300 mb-3">Presupuesto Referencial: {msg.rfqData.budget}</p>
                          <Link 
                            to="/marketplace" 
                            className="inline-flex items-center gap-1 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Ver en Marketplace <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        /* Mensaje de texto normal */
                        <div className={`px-4 py-2.5 rounded-2xl max-w-lg text-xs leading-relaxed shadow-sm ${
                          msg.isSelf 
                            ? 'bg-orange-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                        {msg.isSelf && <CheckCheck className="w-3 h-3 text-orange-400" />}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Entrada de Mensaje */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-850 border-t border-slate-700 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendQuickRfq}
                className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl transition-colors border border-orange-500/30 flex items-center gap-1 text-xs font-semibold"
                title="Adjuntar Cotización Rápida (RFQ Express)"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">RFQ Express</span>
              </button>

              <input
                type="text"
                placeholder={selectedContact ? `Escribir a ${selectedContact.name}...` : selectedChannel ? `Escribir en #${selectedChannel.name}...` : 'Selecciona una conversación...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!selectedContact && !selectedChannel}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || (!selectedContact && !selectedChannel)}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20"
                title="Enviar Mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL / PANTALLA COMPLETA DE LLAMADA DE VOZ / VIDEO (Segunda Etapa Lista) */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              
              {/* Barra superior de llamada */}
              <div className="p-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {activeCall.type === 'video' ? 'Videollamada Corporativa B2B' : 'Llamada de Voz Encriptada'}
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {activeCall.status === 'calling' ? 'Conectando señal...' : formatCallDuration(activeCall.duration)}
                </div>
              </div>

              {/* Área Central de Video / Audio */}
              <div className="p-8 flex flex-col items-center justify-center min-h-[340px] bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 relative">
                
                {activeCall.type === 'video' && activeCall.status === 'connected' && !activeCall.cameraOff ? (
                  <div className="w-full h-64 bg-slate-950 rounded-2xl border border-slate-700 relative overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="text-center text-slate-400">
                      <Video className="w-12 h-12 mx-auto mb-2 text-blue-400 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-200">Video HD Conectado con {activeCall.withContact.company}</p>
                      <p className="text-xs text-slate-500">Transmisión punto a punto segura</p>
                    </div>

                    {/* Ventana pequeña de video propio (PiP) */}
                    <div className="absolute bottom-3 right-3 w-28 h-20 bg-slate-800 rounded-xl border border-slate-600 flex items-center justify-center text-[10px] text-slate-300 font-bold shadow-lg">
                      Tú (Cámara Activa)
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <div className={`w-28 h-28 rounded-3xl ${activeCall.withContact.avatarBg} flex items-center justify-center text-white text-3xl font-bold shadow-2xl mx-auto`}>
                        {activeCall.withContact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      {activeCall.status === 'calling' && (
                        <div className="absolute inset-0 rounded-3xl border-4 border-orange-500 animate-ping opacity-30"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{activeCall.withContact.name}</h3>
                      <p className="text-sm text-orange-400 font-medium">{activeCall.withContact.company}</p>
                      <p className="text-xs text-slate-400 mt-1">{activeCall.withContact.location}</p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {activeCall.status === 'calling' ? 'Llamando a terminal B2B...' : 'Conexión Establecida (Codec Opus / VP9)'}
                    </p>
                  </div>
                )}
              </div>

              {/* Botonera de Control de Llamada */}
              <div className="p-6 bg-slate-850 border-t border-slate-700 flex items-center justify-center gap-4">
                {/* Mute Micrófono */}
                <button
                  onClick={() => setActiveCall(prev => prev ? { ...prev, muted: !prev.muted } : null)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    activeCall.muted 
                      ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={activeCall.muted ? 'Activar Micrófono' : 'Silenciar Micrófono'}
                >
                  {activeCall.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Cámara Video ON/OFF */}
                {activeCall.type === 'video' && (
                  <button
                    onClick={() => setActiveCall(prev => prev ? { ...prev, cameraOff: !prev.cameraOff } : null)}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      activeCall.cameraOff 
                        ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={activeCall.cameraOff ? 'Encender Cámara' : 'Apagar Cámara'}
                  >
                    {activeCall.cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* Compartir Pantalla */}
                <button
                  onClick={() => setActiveCall(prev => prev ? { ...prev, screenSharing: !prev.screenSharing } : null)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    activeCall.screenSharing 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Compartir Pantalla"
                >
                  <Monitor className="w-5 h-5" />
                </button>

                {/* Colgar Llamada */}
                <button
                  onClick={endCall}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                  title="Finalizar Llamada"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Finalizar</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
