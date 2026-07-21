import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, MapPin, Briefcase, Users, Plus, Check, Save, UserPlus, X, Tag } from 'lucide-react';
import { MAIN_CATEGORIES, INDUSTRIAL_CATEGORIES } from '../lib/categories';
import {  doc, getDoc, setDoc  } from '../lib/db';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { auth, db } from '../lib/db';

const API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';


export default function CompanyProfile() {
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    address: '',
    province: 'Chubut',
    city: 'Comodoro Rivadavia',
    cuit: '',
    employeeCount: '1-10',
    contactEmail: '',
    contactPhone: '',
    whatsapp: '',
    website: '',
    linkedin: '',
    lat: -45.8641,
    lng: -67.4965
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string[]>>({});
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, email: 'admin@empresa.com', role: 'Administrador' }
  ]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Gestión');

  useEffect(() => {
    const fetchUser = async () => {
      // Small timeout to allow auth to initialize if we just arrived
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
              companyName: data.companyName || '',
              description: data.description || '',
              address: data.address || '',
              province: data.province || 'Chubut',
              city: data.city || 'Comodoro Rivadavia',
              cuit: data.cuit || '',
              employeeCount: data.employeeCount || '1-10',
              contactEmail: data.contactEmail || '',
              contactPhone: data.contactPhone || '',
              whatsapp: data.whatsapp || '',
              website: data.website || '',
              linkedin: data.linkedin || '',
              lat: data.lat || -45.8641,
              lng: data.lng || -67.4965
            }));
            
            if (data.categories) {
              setSelectedCategories(data.categories);
            } else if (data.category) {
               setSelectedCategories([data.category]);
            }
            if (data.subcategories) {
              setSelectedSubcategories(data.subcategories);
            }
          }
        }
      });
      return () => unsubscribe();
    };
    fetchUser();
  }, []);


  const handleGetCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener la ubicación.");
        }
      );
    } else {
      alert("La geolocalización no es soportada por este navegador.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        const next = prev.filter(c => c !== category);
        const { [category]: removed, ...rest } = selectedSubcategories;
        setSelectedSubcategories(rest);
        return next;
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleSubcategory = (category: string, sub: string) => {
    setSelectedSubcategories(prev => {
      const current = prev[category] || [];
      if (current.includes(sub)) {
        return { ...prev, [category]: current.filter(s => s !== sub) };
      } else {
        return { ...prev, [category]: [...current, sub] };
      }
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail) {
      setUsers([...users, { id: Date.now(), email: newUserEmail, role: newUserRole }]);
      setNewUserEmail('');
      setNewUserRole('Gestión');
    }
  };

  const handleRemoveUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
  };


  const isValidCuit = (cuit: string) => {
    if (!cuit) return true; // Optional field
    const cuitClean = cuit.replace(/[^0-9]/g, '');
    if (cuitClean.length !== 11) return false;
    const [cuitArr, verificador] = [cuitClean.slice(0, 10).split('').map(Number), parseInt(cuitClean[10])];
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = cuitArr.reduce((acc, curr, index) => acc + curr * multiplicadores[index], 0);
    const mod = suma % 11;
    const digit = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
    return digit === verificador;
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para guardar.');
      return;
    }

    if (formData.cuit && !isValidCuit(formData.cuit)) {
      alert('El CUIT ingresado no es válido. Por favor verifica los datos.');
      return;
    }
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        email: auth.currentUser.email || '',
        updatedAt: new Date().toISOString(),
        
        companyName: formData.companyName || '',
        description: formData.description || '',
        address: formData.address || '',
        province: formData.province || '',
        city: formData.city || '',
        cuit: formData.cuit || '',
        employeeCount: formData.employeeCount || '1-10',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        whatsapp: formData.whatsapp || '',
        website: formData.website || '',
        linkedin: formData.linkedin || '',
        lat: formData.lat || -45.8641,
        lng: formData.lng || -67.4965,
        categories: selectedCategories || [],
        subcategories: selectedSubcategories || {},
        category: selectedCategories.length > 0 ? selectedCategories[0] : ''
      }, { merge: true });
      alert('Perfil de empresa actualizado exitosamente.');
    } catch (error) {
      console.error(error);
      alert('Error al guardar el perfil: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A080C] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Perfil de Empresa</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Completa la información de tu organización para mejorar la visibilidad en la Patagonia y añadir a tu equipo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Información Principal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Datos de la Empresa</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Razón Social / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="Ej. Patagonia Energética S.A."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white resize-none"
                    placeholder="Breve descripción de los servicios y especialidades de la empresa..."
                  />
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      CUIT
                    </label>
                    <input
                      type="text"
                      name="cuit"
                      value={formData.cuit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Ej. 30-12345678-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Cantidad de Empleados
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="1-10">1 - 10 empleados</option>
                      <option value="11-50">11 - 50 empleados</option>
                      <option value="51-200">51 - 200 empleados</option>
                      <option value="201-500">201 - 500 empleados</option>
                      <option value="500+">Más de 500 empleados</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Correo Electrónico de Contacto
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Teléfono Fijo / Celular
                    </label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Ej. +54 9 297 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-500 mb-2">
                      WhatsApp Comercial
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-green-200 dark:border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Ej. +54 9 297 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mb-2">
                    Perfil de LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-blue-200 dark:border-blue-500/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="https://www.linkedin.com/company/tu-empresa"
                  />
                </div>

              </div>
            </motion.div>

            {/* Rubricación Múltiple */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rubricación Múltiple</h2>
                </div>
                <button 
                  onClick={() => setShowCategorySelect(!showCategorySelect)}
                  className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              {showCategorySelect && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10">
                  <p className="text-xs font-medium text-slate-500 mb-3">Selecciona los sectores donde tu empresa opera:</p>
                  <div className="flex flex-wrap gap-2">
                    {MAIN_CATEGORIES.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-purple-500 text-white shadow-md' 
                              : 'bg-white dark:bg-[#1A1625] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-purple-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline-block mr-1" />}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCategories.length > 0 ? (
                <div className="flex flex-col gap-4 mt-4">
                  {selectedCategories.map(cat => (
                    <div key={cat} className="p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-bold tracking-tight">
                          {cat}
                        </span>
                        <button onClick={() => toggleCategory(cat)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Subcategories */}
                      <p className="text-xs font-medium text-slate-500 mb-2">Selecciona las subcategorías / servicios específicos:</p>
                      <div className="flex flex-wrap gap-2">
                        {(INDUSTRIAL_CATEGORIES[cat as keyof typeof INDUSTRIAL_CATEGORIES] || []).map(sub => {
                          const isSubSelected = (selectedSubcategories[cat] || []).includes(sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => toggleSubcategory(cat, sub)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${isSubSelected ? 'bg-orange-500 text-white' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-orange-500/30'}`}
                            >
                              <Tag className="w-3 h-3" /> {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No has seleccionado ningún rubro. Las empresas con al menos un rubro reciben más oportunidades.</p>
              )}
            </motion.div>

            {/* Geolocalización */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Geolocalización</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Provincia
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-slate-900 dark:text-white appearance-none"
                  >
                    
                    <option>Buenos Aires</option>
                    <option>Catamarca</option>
                    <option>Chaco</option>
                    <option>Chubut</option>
                    <option>Ciudad Autónoma de Buenos Aires</option>
                    <option>Córdoba</option>
                    <option>Corrientes</option>
                    <option>Entre Ríos</option>
                    <option>Formosa</option>
                    <option>Jujuy</option>
                    <option>La Pampa</option>
                    <option>La Rioja</option>
                    <option>Mendoza</option>
                    <option>Misiones</option>
                    <option>Neuquén</option>
                    <option>Río Negro</option>
                    <option>Salta</option>
                    <option>San Juan</option>
                    <option>San Luis</option>
                    <option>Santa Cruz</option>
                    <option>Santa Fe</option>
                    <option>Santiago del Estero</option>
                    <option>Tierra del Fuego</option>
                    <option>Tucumán</option>

                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Ciudad / Localidad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Dirección (Operaciones o Base)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="Parque Industrial, Ruta 3 Km..."
                  />
                </div>
              </div>
              
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-medium text-slate-500">Ajusta tu ubicación en el mapa (puedes arrastrar el marcador)</p>
                  <button 
                    onClick={handleGetCurrentLocation}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                  >
                    Obtener mi ubicación
                  </button>
                </div>
                <div className="aspect-video max-h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#110E17]">
                  {!hasValidKey ? (
                     <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                       <MapPin className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                       <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Mapa no disponible</p>
                       <p className="text-xs text-slate-500 mt-1">Configura la API Key de Google Maps Platform en Secrets como GOOGLE_MAPS_PLATFORM_KEY para ver el mapa interactivo.</p>
                     </div>
                  ) : (
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <Map
                        center={{ lat: Number(formData.lat) || -45.8641, lng: Number(formData.lng) || -67.4965 }}
                        zoom={13}
                        mapId="DEMO_MAP_ID"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        style={{ width: '100%', height: '100%' }}
                        disableDefaultUI={true}
                        zoomControl={true}
                      >
                        <AdvancedMarker 
                          position={{ lat: Number(formData.lat) || -45.8641, lng: Number(formData.lng) || -67.4965 }} 
                          draggable={true}
                          onDragEnd={(e: any) => {
                            if (e.latLng) {
                              setFormData(prev => ({
                                ...prev,
                                lat: e.latLng.lat(),
                                lng: e.latLng.lng()
                              }));
                            }
                          }}
                        >
                          <Pin background="#10B981" glyphColor="#fff" borderColor="#059669" />
                        </AdvancedMarker>
                      </Map>
                    </APIProvider>
                  )}
                </div>
              </div>

            </motion.div>

            <button 
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Save className={`w-5 h-5 ${isSaving ? 'animate-pulse' : ''}`} /> 
              {isSaving ? 'Guardando...' : 'Guardar Perfil de Empresa'}
            </button>
          </div>

          {/* Dependientes / Usuarios */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[#1A1625] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-white/10 sticky top-24"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Usuarios del Panel</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Agrega a miembros de tu equipo (vendedores, operarios) para que puedan responder solicitudes RFQ.
              </p>

              <div className="space-y-4 mb-6">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#110E17] rounded-xl border border-slate-200 dark:border-white/5">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{user.email}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{user.role}</p>
                    </div>
                    {user.role !== 'Administrador' && (
                      <button onClick={() => handleRemoveUser(user.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Invitar Nuevo Miembro
                </label>
                <form onSubmit={handleAddUser} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none text-sm text-slate-900 dark:text-white appearance-none"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Gestión">Gestión</option>
                      <option value="E-commerce">E-commerce</option>
                    </select>
                    <button type="submit" disabled={!newUserEmail} className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-bold">
                      <UserPlus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
