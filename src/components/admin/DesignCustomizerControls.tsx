import React, { useState } from 'react';
import {
  Palette,
  Type,
  Columns3,
  BarChart3,
  Film,
  Menu as MenuIcon,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Lock,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AESTHETIC_THEME_PRESETS,
  BODY_FONT_OPTIONS,
  CHART_DATASET_PRESETS,
  CustomContentBlock,
  DEFAULT_SECTION_ORDER,
  DISPLAY_FONT_OPTIONS,
  DesignFontPreset,
  HOME_SECTION_META,
  HomeSectionDesignConfig,
  HomeSectionId,
  MenuLinkItem,
  SECTION_DEFAULT_BLOCKS,
  SectionBackgroundType,
  SectionBlockOverride,
  SectionCardStyle,
  SectionChartPreset,
  SectionColumnStyle,
  SiteSettings,
  applyThemePresetToSettings,
} from '../../lib/siteSettings';

export type CustomizerArea = 'theme' | 'menu' | 'sections';
type SectionSubPanel = 'background' | 'copy' | 'typography' | 'chart' | 'media';

interface DesignCustomizerControlsProps {
  area: CustomizerArea;
  settings: SiteSettings;
  onChange: (updater: (prev: SiteSettings) => SiteSettings) => void;
  onUploadMedia?: (
    file: File,
    onUrl: (url: string) => void
  ) => Promise<void>;
  isUploading?: boolean;
  compact?: boolean;
}

export default function DesignCustomizerControls({
  area,
  settings,
  onChange,
  onUploadMedia,
  isUploading = false,
  compact = false,
}: DesignCustomizerControlsProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<HomeSectionId>(
    settings.sectionOrder[0] || 'indicators'
  );
  const [sectionPanel, setSectionPanel] = useState<SectionSubPanel>('copy');
  const [expandedBlockKey, setExpandedBlockKey] = useState<string | null>(null);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuPath, setNewMenuPath] = useState('/servicios');

  const updateSectionConfig = (
    id: HomeSectionId,
    patch: Partial<HomeSectionDesignConfig>
  ) => {
    onChange((prev) => ({
      ...prev,
      sectionConfigs: {
        ...prev.sectionConfigs,
        [id]: {
          ...prev.sectionConfigs[id],
          ...patch,
          id,
        },
      },
    }));
  };

  const updateBlockOverride = (
    sectionId: HomeSectionId,
    blockKey: string,
    patch: Partial<SectionBlockOverride>
  ) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const currentOverrides = currentSection.blockOverrides || {};
      const nextBlock = { ...(currentOverrides[blockKey] || {}), ...patch };
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            blockOverrides: {
              ...currentOverrides,
              [blockKey]: nextBlock,
            },
          },
        },
      };
    });
  };

  const resetBlockOverride = (sectionId: HomeSectionId, blockKey: string) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const nextOverrides = { ...(currentSection.blockOverrides || {}) };
      delete nextOverrides[blockKey];
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            blockOverrides: nextOverrides,
          },
        },
      };
    });
  };

  const addCustomBlock = (sectionId: HomeSectionId) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const existing = currentSection.customBlocks || [];
      const nextBlock: CustomContentBlock = {
        id: `blk-${Date.now()}`,
        eyebrow: 'Bloque Destacado',
        title: 'Nuevo Título del Bloque',
        description: 'Descripcióneditable del servicio, novedad o caso destacado con imagen.',
        imageUrl: '',
        ctaLabel: 'Explorar más',
        ctaPath: '/servicios',
      };
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            customBlocks: [...existing, nextBlock],
          },
        },
      };
    });
  };

  const updateCustomBlock = (
    sectionId: HomeSectionId,
    index: number,
    patch: Partial<CustomContentBlock>
  ) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const blocks = [...(currentSection.customBlocks || [])];
      blocks[index] = { ...blocks[index], ...patch };
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            customBlocks: blocks,
          },
        },
      };
    });
  };

  const moveCustomBlock = (sectionId: HomeSectionId, index: number, direction: -1 | 1) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const blocks = [...(currentSection.customBlocks || [])];
      const nextIdx = index + direction;
      if (nextIdx < 0 || nextIdx >= blocks.length) return prev;
      [blocks[index], blocks[nextIdx]] = [blocks[nextIdx], blocks[index]];
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            customBlocks: blocks,
          },
        },
      };
    });
  };

  const removeCustomBlock = (sectionId: HomeSectionId, index: number) => {
    onChange((prev) => {
      const currentSection = prev.sectionConfigs[sectionId];
      const blocks = (currentSection.customBlocks || []).filter((_, i) => i !== index);
      return {
        ...prev,
        sectionConfigs: {
          ...prev.sectionConfigs,
          [sectionId]: {
            ...currentSection,
            customBlocks: blocks,
          },
        },
      };
    });
  };

  const moveSectionOrder = (id: HomeSectionId, direction: -1 | 1) => {
    onChange((prev) => {
      const order = [...(prev.sectionOrder || DEFAULT_SECTION_ORDER)];
      const idx = order.indexOf(id);
      const nextIdx = idx + direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return prev;
      [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
      return { ...prev, sectionOrder: order };
    });
  };

  const toggleSectionVisibility = (id: HomeSectionId) => {
    onChange((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [id]: !prev.sections[id],
      },
    }));
  };

  const updateMenuItem = (idx: number, patch: Partial<MenuLinkItem>) => {
    onChange((prev) => {
      const items = [...prev.menu.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, menu: { ...prev.menu, items } };
    });
  };

  const moveMenuItem = (idx: number, direction: -1 | 1) => {
    onChange((prev) => {
      const items = [...prev.menu.items];
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= items.length) return prev;
      [items[idx], items[nextIdx]] = [items[nextIdx], items[idx]];
      return { ...prev, menu: { ...prev.menu, items } };
    });
  };

  const addMenuItem = () => {
    if (!newMenuLabel.trim() || !newMenuPath.trim()) return;
    onChange((prev) => ({
      ...prev,
      menu: {
        ...prev.menu,
        items: [
          ...prev.menu.items,
          {
            id: `custom-${Date.now()}`,
            label: newMenuLabel.trim(),
            path: newMenuPath.trim().startsWith('/')
              ? newMenuPath.trim()
              : `/${newMenuPath.trim()}`,
            visible: true,
          },
        ],
      },
    }));
    setNewMenuLabel('');
  };

  const removeMenuItem = (idx: number) => {
    onChange((prev) => ({
      ...prev,
      menu: {
        ...prev.menu,
        items: prev.menu.items.filter((_, i) => i !== idx),
      },
    }));
  };

  if (area === 'theme') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Presets Estéticos Completos (1 Clic)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aplicá un sistema tipográfico y paleta integral sobre Menú y todas las secciones debajo del Hero (sin alterar el Hero).
          </p>
          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
            {AESTHETIC_THEME_PRESETS.map((preset) => {
              const active = settings.designTheme.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange((prev) => applyThemePresetToSettings(prev, preset.id))}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    active
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {preset.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.secondaryAccentColor }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                    {preset.description}
                  </p>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {preset.displayFont} · {preset.bodyFont}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Type className="w-4 h-4 text-purple-500" />
            <span>Tipografía Global &amp; Colores de Marca</span>
          </div>

          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Fuente de Títulos (Display)
              </label>
              <select
                value={settings.designTheme.displayFont}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    designTheme: {
                      ...prev.designTheme,
                      displayFont: e.target.value as DesignFontPreset,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
              >
                {DISPLAY_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} — {f.tone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Fuente de Cuerpo y Lectura
              </label>
              <select
                value={settings.designTheme.bodyFont}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    designTheme: {
                      ...prev.designTheme,
                      bodyFont: e.target.value as DesignFontPreset,
                    },
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
              >
                {BODY_FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} — {f.tone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Acento Principal (Botones y Enlaces)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.designTheme.accentColor || '#f97316'}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      designTheme: { ...prev.designTheme, accentColor: e.target.value },
                    }))
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={settings.designTheme.accentColor}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      designTheme: { ...prev.designTheme, accentColor: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Acento Secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.designTheme.secondaryAccentColor || '#9333ea'}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      designTheme: {
                        ...prev.designTheme,
                        secondaryAccentColor: e.target.value,
                      },
                    }))
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={settings.designTheme.secondaryAccentColor}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      designTheme: {
                        ...prev.designTheme,
                        secondaryAccentColor: e.target.value,
                      },
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (area === 'menu') {
    const menu = settings.menu;
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MenuIcon className="w-4 h-4 text-orange-500" />
              Apariencia de la Barra Superior (Menú)
            </h3>
            <button
              type="button"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  menu: { ...prev.menu, sticky: !prev.menu.sticky },
                }))
              }
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                menu.sticky
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
              }`}
            >
              {menu.sticky ? 'Fijo (Sticky)' : 'Estático'}
            </button>
          </div>

          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Estilo Visual</label>
              <select
                value={menu.variant}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    menu: { ...prev.menu, variant: e.target.value as any },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="glass">Translúcido (Glass)</option>
                <option value="solid">Sólido Corporativo</option>
                <option value="minimal">Minimalista</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipografía del Menú</label>
              <select
                value={menu.fontFamily}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    menu: { ...prev.menu, fontFamily: e.target.value as any },
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="inherit">Heredar Global</option>
                {DISPLAY_FONT_OPTIONS.concat(BODY_FONT_OPTIONS).reduce<React.ReactElement[]>(
                  (acc, opt) => {
                    if (!acc.some((el) => el.key === opt.value)) {
                      acc.push(
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      );
                    }
                    return acc;
                  },
                  []
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Color de Acento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={menu.accentColor || '#f97316'}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, accentColor: e.target.value },
                    }))
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={menu.accentColor}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, accentColor: e.target.value },
                    }))
                  }
                  className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Fondo Personalizado (vacío = automático Claro/Oscuro)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={menu.backgroundColor || '#110E17'}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, backgroundColor: e.target.value },
                    }))
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={menu.backgroundColor}
                  placeholder="Automático"
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, backgroundColor: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                />
                {menu.backgroundColor && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        menu: { ...prev.menu, backgroundColor: '' },
                      }))
                    }
                    className="px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Color de Texto del Menú (vacío = automático)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={menu.textColor || '#0F172A'}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, textColor: e.target.value },
                    }))
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={menu.textColor}
                  placeholder="Automático"
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      menu: { ...prev.menu, textColor: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                />
                {menu.textColor && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        menu: { ...prev.menu, textColor: '' },
                      }))
                    }
                    className="px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-3 pt-2 border-t border-slate-100 dark:border-white/5`}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Botón Principal CTA (Texto)
              </label>
              <input
                type="text"
                value={menu.ctaLabel}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    menu: { ...prev.menu, ctaLabel: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Botón Principal CTA (Ruta)
              </label>
              <input
                type="text"
                value={menu.ctaPath}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    menu: { ...prev.menu, ctaPath: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Editable Links List */}
        <div className="bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Elementos y Orden del Menú ({menu.items.filter((i) => i.visible).length} activos)
          </h4>

          <div className="space-y-2">
            {menu.items.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2"
              >
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateMenuItem(idx, { label: e.target.value })}
                  className="flex-1 min-w-[110px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={item.path}
                  onChange={(e) => updateMenuItem(idx, { path: e.target.value })}
                  className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-mono text-slate-600 dark:text-slate-300"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveMenuItem(idx, -1)}
                    disabled={idx === 0}
                    title="Subir"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMenuItem(idx, 1)}
                    disabled={idx === menu.items.length - 1}
                    title="Bajar"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMenuItem(idx, { visible: !item.visible })}
                    title={item.visible ? 'Ocultar enlace' : 'Mostrar enlace'}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      item.visible
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-white/10 text-slate-400'
                    }`}
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  {menu.items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMenuItem(idx)}
                      title="Eliminar enlace"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2">
            <input
              type="text"
              value={newMenuLabel}
              onChange={(e) => setNewMenuLabel(e.target.value)}
              placeholder="Nuevo enlace (ej: Tracking)"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newMenuPath}
              onChange={(e) => setNewMenuPath(e.target.value)}
              placeholder="/tracking"
              className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={addMenuItem}
              className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SECTION BUILDER & VISUAL INSPECTOR
  const sectionOrder = settings.sectionOrder || DEFAULT_SECTION_ORDER;
  const activeConfig = settings.sectionConfigs[selectedSectionId];
  const activeMeta = HOME_SECTION_META[selectedSectionId];

  return (
    <div className="space-y-5">
      {/* Protected Hero Notice */}
      <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
        <Lock className="w-4 h-4 text-orange-500 shrink-0" />
        <span>
          <strong>Sección 1 (Hero / Buscador):</strong> protegida intacta en estructura según tu indicación. Aquí configurás libremente todas las secciones operativas inferiores.
        </span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-5`}>
        {/* Left: Reorderable Section List */}
        <div className={`${compact ? '' : 'lg:col-span-4'} space-y-2`}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Orden y Visibilidad de Secciones
          </h4>
          {sectionOrder.map((id, idx) => {
            const meta = HOME_SECTION_META[id];
            const isSelected = id === selectedSectionId;
            const isEnabled = settings.sections[id];
            const cfg = settings.sectionConfigs[id];

            return (
              <div
                key={id}
                className={`rounded-xl border p-3 transition-colors ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500'
                    : 'bg-white dark:bg-[#1A1625] border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(id)}
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {idx + 2}. {meta.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cfg.backgroundType === 'default' ? 'Fondo base' : `Fondo ${cfg.backgroundType}`}
                      {' · '}
                      {cfg.columnStyle === 'auto' ? 'Col. auto' : cfg.columnStyle}
                      {cfg.chartBlock.enabled ? ' · +Gráfico' : ''}
                      {cfg.mediaBlock.enabled ? ' · +Media' : ''}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSectionOrder(id, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30"
                      title="Subir sección"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionOrder(id, 1)}
                      disabled={idx === sectionOrder.length - 1}
                      className="p-1 rounded border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30"
                      title="Bajar sección"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(id)}
                      className={`p-1 rounded border ${
                        isEnabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-white/10 text-slate-400'
                      }`}
                      title={isEnabled ? 'Ocultar sección' : 'Mostrar sección'}
                    >
                      {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Section Visual Inspector */}
        <div
          className={`${compact ? '' : 'lg:col-span-8'} bg-white dark:bg-[#1A1625] rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-5`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {activeMeta.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeMeta.description}</p>
            </div>
          </div>

          {/* Inspector Sub-tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#110E17]">
            {(
              [
                { id: 'copy', label: 'Bloques & Textos', icon: Type },
                { id: 'background', label: 'Fondo & Color', icon: Palette },
                { id: 'typography', label: 'Tipografía & Columnas', icon: Columns3 },
                { id: 'chart', label: 'Insertar Gráfico', icon: BarChart3 },
                { id: 'media', label: 'Video / Imagen', icon: Film },
              ] as { id: SectionSubPanel; label: string; icon: any }[]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = sectionPanel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSectionPanel(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-[#1A1625] text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {sectionPanel === 'background' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Tipo de Fondo de Sección
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'default', label: 'Base Tema' },
                      { id: 'solid', label: 'Color Sólido' },
                      { id: 'gradient', label: 'Gradiente' },
                      { id: 'image', label: 'Imagen Fondo' },
                      { id: 'video', label: 'Video Loop' },
                    ] as { id: SectionBackgroundType; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateSectionConfig(
                          selectedSectionId,
                          opt.id === 'default'
                            ? { backgroundType: 'default', textColor: '' }
                            : { backgroundType: opt.id }
                        )
                      }
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        activeConfig.backgroundType === opt.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeConfig.backgroundType === 'solid' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Color de Fondo (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeConfig.backgroundColor || '#0D0A13'}
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { backgroundColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
                    />
                    <input
                      type="text"
                      value={activeConfig.backgroundColor}
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { backgroundColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {activeConfig.backgroundType === 'gradient' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Inicio</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeConfig.gradientFrom}
                        onChange={(e) =>
                          updateSectionConfig(selectedSectionId, { gradientFrom: e.target.value })
                        }
                        className="w-9 h-9 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeConfig.gradientFrom}
                        onChange={(e) =>
                          updateSectionConfig(selectedSectionId, { gradientFrom: e.target.value })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Fin</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeConfig.gradientTo}
                        onChange={(e) =>
                          updateSectionConfig(selectedSectionId, { gradientTo: e.target.value })
                        }
                        className="w-9 h-9 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={activeConfig.gradientTo}
                        onChange={(e) =>
                          updateSectionConfig(selectedSectionId, { gradientTo: e.target.value })
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(activeConfig.backgroundType === 'image' || activeConfig.backgroundType === 'video') && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {activeConfig.backgroundType === 'video'
                        ? 'URL Video Fondo (MP4 / WebM / Cloudflare Stream / YouTube)'
                        : 'URL Imagen Fondo (JPG / PNG / WebP)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="url"
                        value={
                          activeConfig.backgroundType === 'video'
                            ? activeConfig.backgroundVideoUrl
                            : activeConfig.backgroundImageUrl
                        }
                        onChange={(e) =>
                          updateSectionConfig(
                            selectedSectionId,
                            activeConfig.backgroundType === 'video'
                              ? { backgroundVideoUrl: e.target.value }
                              : { backgroundImageUrl: e.target.value }
                          )
                        }
                        placeholder="https://..."
                        className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                      />
                      {onUploadMedia && (
                        <label className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Subiendo...' : 'Subir'}</span>
                          <input
                            type="file"
                            accept={activeConfig.backgroundType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              onUploadMedia(file, (url) =>
                                updateSectionConfig(
                                  selectedSectionId,
                                  activeConfig.backgroundType === 'video'
                                    ? { backgroundVideoUrl: url }
                                    : { backgroundImageUrl: url }
                                )
                              );
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>Oscurecimiento de contraste (Scrim)</span>
                      <span className="font-mono">{activeConfig.overlayOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={85}
                      value={activeConfig.overlayOpacity}
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, {
                          overlayOpacity: Number(e.target.value),
                        })
                      }
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Color de Texto (vacío = automático)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeConfig.textColor || '#0F172A'}
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { textColor: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeConfig.textColor}
                      placeholder="Automático"
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { textColor: e.target.value })
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                    />
                    {activeConfig.textColor && (
                      <button
                        type="button"
                        onClick={() => updateSectionConfig(selectedSectionId, { textColor: '' })}
                        className="text-xs font-bold text-slate-500 px-2"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Color de Acento de Sección
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeConfig.accentColor || '#f97316'}
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { accentColor: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeConfig.accentColor}
                      placeholder="Global"
                      onChange={(e) =>
                        updateSectionConfig(selectedSectionId, { accentColor: e.target.value })
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                    />
                    {activeConfig.accentColor && (
                      <button
                        type="button"
                        onClick={() => updateSectionConfig(selectedSectionId, { accentColor: '' })}
                        className="text-xs font-bold text-slate-500 px-2"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {sectionPanel === 'typography' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Tipografía Títulos
                  </label>
                  <select
                    value={activeConfig.headingFont}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        headingFont: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="inherit">Heredar Global</option>
                    {DISPLAY_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Tipografía Cuerpo
                  </label>
                  <select
                    value={activeConfig.bodyFont}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        bodyFont: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="inherit">Heredar Global</option>
                    {BODY_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Escala Tipográfica
                  </label>
                  <select
                    value={activeConfig.headingScale}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        headingScale: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="compact">Compacta</option>
                    <option value="standard">Estándar</option>
                    <option value="editorial">Editorial Grande</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Estilo de Columnas / Disposición
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'auto', label: 'Automático' },
                      { id: '1-col', label: '1 Columna' },
                      { id: '2-col', label: '2 Columnas' },
                      { id: '3-col', label: '3 Columnas' },
                      { id: '4-col', label: '4 Columnas' },
                      { id: 'bento', label: 'Bento Asimétrico' },
                      { id: 'split-left', label: 'Split Izq.' },
                      { id: 'split-right', label: 'Split Der.' },
                    ] as { id: SectionColumnStyle; label: string }[]
                  ).map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() =>
                        updateSectionConfig(selectedSectionId, { columnStyle: col.id })
                      }
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        activeConfig.columnStyle === col.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Estilo de Tarjetas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'bordered', label: 'Borde Limpio' },
                        { id: 'elevated', label: 'Elevada' },
                        { id: 'glass', label: 'Glass Blur' },
                        { id: 'minimal', label: 'Minimalista' },
                      ] as { id: SectionCardStyle; label: string }[]
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => updateSectionConfig(selectedSectionId, { cardStyle: st.id })}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-bold ${
                          activeConfig.cardStyle === st.id
                            ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Ritmo Vertical (Espaciado)
                  </label>
                  <select
                    value={activeConfig.paddingScale}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        paddingScale: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="compact">Compacto</option>
                    <option value="standard">Estándar</option>
                    <option value="spacious">Amplio Editorial</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {sectionPanel === 'chart' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Gráfico Interactivo Recharts en esta Sección
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Insertá visualizaciones de barras, área o líneas con datos sectoriales o personalizados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSectionConfig(selectedSectionId, {
                      chartBlock: {
                        ...activeConfig.chartBlock,
                        enabled: !activeConfig.chartBlock.enabled,
                      },
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    activeConfig.chartBlock.enabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  {activeConfig.chartBlock.enabled ? 'Gráfico Activo' : 'Desactivado'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                  <select
                    value={activeConfig.chartBlock.chartType}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        chartBlock: {
                          ...activeConfig.chartBlock,
                          chartType: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="bar">Barras Comparativas</option>
                    <option value="area">Área Acumulada</option>
                    <option value="line">Tendencia en Líneas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Ubicación</label>
                  <select
                    value={activeConfig.chartBlock.position}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        chartBlock: {
                          ...activeConfig.chartBlock,
                          position: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="top">Arriba de la Sección</option>
                    <option value="bottom">Debajo de la Sección</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Serie de Datos</label>
                  <select
                    value={activeConfig.chartBlock.dataPreset}
                    onChange={(e) => {
                      const nextPreset = e.target.value as SectionChartPreset;
                      const presetMeta =
                        nextPreset === 'custom' ? null : CHART_DATASET_PRESETS[nextPreset];
                      updateSectionConfig(selectedSectionId, {
                        chartBlock: {
                          ...activeConfig.chartBlock,
                          dataPreset: nextPreset,
                          ...(presetMeta
                            ? {
                                title: presetMeta.title,
                                subtitle: presetMeta.subtitle,
                                primaryLabel: presetMeta.primaryLabel,
                                secondaryLabel: presetMeta.secondaryLabel,
                              }
                            : {}),
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="vaca_muerta_capex">Demanda Cuenca Neuquina</option>
                    <option value="logistics_corridors">Corredores Viales OSRM</option>
                    <option value="directory_mix">Mix Ecosistema Directorio</option>
                    <option value="custom">JSON Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={activeConfig.chartBlock.title}
                  onChange={(e) =>
                    updateSectionConfig(selectedSectionId, {
                      chartBlock: { ...activeConfig.chartBlock, title: e.target.value },
                    })
                  }
                  placeholder="Título del gráfico"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={activeConfig.chartBlock.subtitle}
                  onChange={(e) =>
                    updateSectionConfig(selectedSectionId, {
                      chartBlock: { ...activeConfig.chartBlock, subtitle: e.target.value },
                    })
                  }
                  placeholder="Subtítulo / Unidad"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
                />
              </div>

              {activeConfig.chartBlock.dataPreset === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Puntos JSON (label, primary, secondary)
                  </label>
                  <textarea
                    rows={5}
                    value={activeConfig.chartBlock.customSeriesJson || ''}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        chartBlock: {
                          ...activeConfig.chartBlock,
                          customSeriesJson: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {sectionPanel === 'media' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Bloque Multimedia (Video o Imagen Explicativa)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Insertá un video YouTube, Cloudflare Stream, MP4 o imagen arriba, abajo o en split lateral.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSectionConfig(selectedSectionId, {
                      mediaBlock: {
                        ...activeConfig.mediaBlock,
                        enabled: !activeConfig.mediaBlock.enabled,
                      },
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                    activeConfig.mediaBlock.enabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  {activeConfig.mediaBlock.enabled ? 'Media Activo' : 'Desactivado'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Formato</label>
                  <select
                    value={activeConfig.mediaBlock.kind}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        mediaBlock: {
                          ...activeConfig.mediaBlock,
                          kind: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="video">Video (YouTube / Stream / MP4)</option>
                    <option value="image">Imagen / Infografía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Posición</label>
                  <select
                    value={activeConfig.mediaBlock.position}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, {
                        mediaBlock: {
                          ...activeConfig.mediaBlock,
                          position: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="top">Arriba de la Sección</option>
                    <option value="split">Columna Lateral (Split)</option>
                    <option value="bottom">Debajo de la Sección</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  value={activeConfig.mediaBlock.url}
                  onChange={(e) =>
                    updateSectionConfig(selectedSectionId, {
                      mediaBlock: { ...activeConfig.mediaBlock, url: e.target.value },
                    })
                  }
                  placeholder="URL de Video o Imagen..."
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
                />
                {onUploadMedia && (
                  <label className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Subiendo...' : 'Subir Archivo'}</span>
                    <input
                      type="file"
                      accept={activeConfig.mediaBlock.kind === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        onUploadMedia(file, (url) =>
                          updateSectionConfig(selectedSectionId, {
                            mediaBlock: { ...activeConfig.mediaBlock, enabled: true, url },
                          })
                        );
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={activeConfig.mediaBlock.title}
                  onChange={(e) =>
                    updateSectionConfig(selectedSectionId, {
                      mediaBlock: { ...activeConfig.mediaBlock, title: e.target.value },
                    })
                  }
                  placeholder="Título del recurso multimedia"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={activeConfig.mediaBlock.caption}
                  onChange={(e) =>
                    updateSectionConfig(selectedSectionId, {
                      mediaBlock: { ...activeConfig.mediaBlock, caption: e.target.value },
                    })
                  }
                  placeholder="Descripción breve / epígrafe"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {sectionPanel === 'copy' && (
            <div className="space-y-5">
              {/* Section Header Override */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Encabezado de la Sección
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Epígrafe superior
                  </label>
                  <input
                    type="text"
                    value={activeConfig.eyebrowOverride || ''}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, { eyebrowOverride: e.target.value })
                    }
                    placeholder="Dejar vacío para usar el epígrafe base"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Título principal de la sección
                  </label>
                  <input
                    type="text"
                    value={activeConfig.titleOverride || ''}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, { titleOverride: e.target.value })
                    }
                    placeholder="Dejar vacío para usar el título base"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Bajada / Subtítulo
                  </label>
                  <textarea
                    rows={2}
                    value={activeConfig.subtitleOverride || ''}
                    onChange={(e) =>
                      updateSectionConfig(selectedSectionId, { subtitleOverride: e.target.value })
                    }
                    placeholder="Dejar vacío para usar el subtítulo base"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Per-block Built-in Card Editors */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Bloques / Tarjetas de esta Sección
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Editá títulos, textos, imágenes o visibilidad
                  </span>
                </div>

                {(SECTION_DEFAULT_BLOCKS[selectedSectionId] || []).map((descriptor) => {
                  const ov = activeConfig.blockOverrides?.[descriptor.key] || {};
                  const isOpenBlock = expandedBlockKey === `${selectedSectionId}:${descriptor.key}`;
                  const hasEdits = Boolean(
                    ov.hidden ||
                      ov.title ||
                      ov.tagline ||
                      ov.description ||
                      ov.imageUrl ||
                      ov.ctaLabel ||
                      ov.ctaPath
                  );

                  return (
                    <div
                      key={descriptor.key}
                      className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#110E17] overflow-hidden"
                    >
                      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBlockKey(
                              isOpenBlock ? null : `${selectedSectionId}:${descriptor.key}`
                            )
                          }
                          className="flex-1 text-left min-w-0 flex items-center gap-2"
                        >
                          {isOpenBlock ? (
                            <ChevronUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{ov.title || descriptor.label}</span>
                              {hasEdits && (
                                <span className="text-[10px] font-mono text-orange-500">
                                  · editado
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {ov.imageUrl ? 'Con imagen · ' : ''}
                              {ov.title ? descriptor.label : descriptor.defaultTitle}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateBlockOverride(selectedSectionId, descriptor.key, {
                              hidden: !ov.hidden,
                            })
                          }
                          title={ov.hidden ? 'Mostrar bloque' : 'Ocultar bloque'}
                          className={`p-1.5 rounded-lg border shrink-0 ${
                            !ov.hidden
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-slate-200 dark:border-white/10 text-slate-400'
                          }`}
                        >
                          {!ov.hidden ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {isOpenBlock && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Título del Bloque
                            </label>
                            <input
                              type="text"
                              value={ov.title || ''}
                              onChange={(e) =>
                                updateBlockOverride(selectedSectionId, descriptor.key, {
                                  title: e.target.value,
                                })
                              }
                              placeholder={descriptor.defaultTitle}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-semibold text-slate-900 dark:text-white"
                            />
                          </div>

                          {descriptor.defaultTagline !== undefined && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Epígrafe / Bajada Corta
                              </label>
                              <input
                                type="text"
                                value={ov.tagline || ''}
                                onChange={(e) =>
                                  updateBlockOverride(selectedSectionId, descriptor.key, {
                                    tagline: e.target.value,
                                  })
                                }
                                placeholder={descriptor.defaultTagline}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Texto / Descripción
                            </label>
                            <textarea
                              rows={2}
                              value={ov.description || ''}
                              onChange={(e) =>
                                updateBlockOverride(selectedSectionId, descriptor.key, {
                                  description: e.target.value,
                                })
                              }
                              placeholder={descriptor.defaultDescription}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-orange-500" />
                              Imagen del Bloque (URL o Subida)
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="url"
                                value={ov.imageUrl || ''}
                                onChange={(e) =>
                                  updateBlockOverride(selectedSectionId, descriptor.key, {
                                    imageUrl: e.target.value,
                                  })
                                }
                                placeholder="https://... (dejar vacío para default)"
                                className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                              />
                              {onUploadMedia && (
                                <label className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold cursor-pointer flex items-center gap-1 shrink-0">
                                  <Upload className="w-3 h-3" />
                                  <span>{isUploading ? '...' : 'Subir'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      onUploadMedia(file, (url) =>
                                        updateBlockOverride(selectedSectionId, descriptor.key, {
                                          imageUrl: url,
                                        })
                                      );
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {descriptor.defaultCtaLabel !== undefined && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={ov.ctaLabel || ''}
                                onChange={(e) =>
                                  updateBlockOverride(selectedSectionId, descriptor.key, {
                                    ctaLabel: e.target.value,
                                  })
                                }
                                placeholder={descriptor.defaultCtaLabel}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                              />
                              {descriptor.defaultCtaPath !== undefined && (
                                <input
                                  type="text"
                                  value={ov.ctaPath || ''}
                                  onChange={(e) =>
                                    updateBlockOverride(selectedSectionId, descriptor.key, {
                                      ctaPath: e.target.value,
                                    })
                                  }
                                  placeholder={descriptor.defaultCtaPath}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-mono text-slate-900 dark:text-white"
                                />
                              )}
                            </div>
                          )}

                          {hasEdits && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => resetBlockOverride(selectedSectionId, descriptor.key)}
                                className="text-[11px] font-bold text-slate-500 hover:text-rose-500"
                              >
                                Restaurar bloque original
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Blocks Builder (Add new cards with image, title, text, CTA) */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Bloques Extra con Imagen &amp; Texto ({(activeConfig.customBlocks || []).length})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Sumá tarjetas personalizadas con foto, título, descripción y enlace en esta sección.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addCustomBlock(selectedSectionId)}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Bloque
                  </button>
                </div>

                {(activeConfig.customBlocks || []).map((blk, bIdx) => (
                  <div
                    key={blk.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#110E17] border border-slate-200 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-orange-500">
                        Bloque Extra #{bIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveCustomBlock(selectedSectionId, bIdx, -1)}
                          disabled={bIdx === 0}
                          className="p-1 rounded border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCustomBlock(selectedSectionId, bIdx, 1)}
                          disabled={bIdx === (activeConfig.customBlocks || []).length - 1}
                          className="p-1 rounded border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomBlock(selectedSectionId, bIdx)}
                          className="p-1 rounded border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-500/10"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={blk.eyebrow || ''}
                        onChange={(e) =>
                          updateCustomBlock(selectedSectionId, bIdx, { eyebrow: e.target.value })
                        }
                        placeholder="Etiqueta / Epígrafe"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={blk.title}
                        onChange={(e) =>
                          updateCustomBlock(selectedSectionId, bIdx, { title: e.target.value })
                        }
                        placeholder="Título del bloque"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={blk.description}
                      onChange={(e) =>
                        updateCustomBlock(selectedSectionId, bIdx, { description: e.target.value })
                      }
                      placeholder="Texto descriptivo del bloque..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                    />

                    <div className="flex flex-wrap gap-2">
                      <input
                        type="url"
                        value={blk.imageUrl || ''}
                        onChange={(e) =>
                          updateCustomBlock(selectedSectionId, bIdx, { imageUrl: e.target.value })
                        }
                        placeholder="URL de imagen del bloque (https://...)"
                        className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                      />
                      {onUploadMedia && (
                        <label className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold cursor-pointer flex items-center gap-1 shrink-0">
                          <Upload className="w-3 h-3" />
                          <span>{isUploading ? '...' : 'Subir Img'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              onUploadMedia(file, (url) =>
                                updateCustomBlock(selectedSectionId, bIdx, { imageUrl: url })
                              );
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={blk.ctaLabel || ''}
                        onChange={(e) =>
                          updateCustomBlock(selectedSectionId, bIdx, { ctaLabel: e.target.value })
                        }
                        placeholder="Texto del botón (opcional)"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={blk.ctaPath || ''}
                        onChange={(e) =>
                          updateCustomBlock(selectedSectionId, bIdx, { ctaPath: e.target.value })
                        }
                        placeholder="/servicios"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1625] text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
