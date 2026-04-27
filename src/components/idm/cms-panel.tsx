'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Image as ImageIcon, Type, Layout, Save, Plus, Trash2, ChevronDown,
  ChevronUp, Eye, EyeOff, Edit3, X, Loader2, Palette,
  FileText, Settings2, Globe, Sparkles, PanelTop, PanelBottom, Heart, Link2, Trophy, Shield, Swords
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';
import { hexToRgba } from '@/lib/utils';
import { CloudinaryPicker } from './cloudinary-picker';
import { Cloud } from 'lucide-react';

/* ========== Types ========== */
interface CmsCard {
  id: string;
  sectionId: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string | null;
  tag: string | null;
  tagColor: string | null;
  isActive: boolean;
  order: number;
}

interface CmsSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl: string | null;
  isActive: boolean;
  order: number;
  cards: CmsCard[];
}

/* ========== Section Icon Map ========== */
const sectionIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  header: PanelTop,
  hero: Sparkles,
  about: Heart,
  kompetisi: Type,
  champions: Layout,
  mvp: Layout,
  clubs: Layout,
  cta: Layout,
  footer: PanelBottom,
};

/* ========== Cloudinary Image Field ========== */
function CloudinaryImageField({
  value,
  onChange,
  label,
  folder = 'cms',
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  label: string;
  folder?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL gambar atau pilih dari Cloudinary"
          className="text-xs flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[10px] shrink-0"
          onClick={() => setPickerOpen(true)}
        >
          <Cloud className="w-3 h-3 mr-1" />
          Pilih
        </Button>
      </div>
      {value && (
        <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted/20 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setPickerOpen(true)}
            title="Ganti gambar"
          >
            <Cloud className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
      <CloudinaryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        currentImage={value}
        uploadFolder={folder}
      />
    </div>
  );
}

/* ========== Card Editor ========== */
function CardEditor({
  card,
  onSave,
  onDelete,
  isPending,
}: {
  card: CmsCard;
  onSave: (data: Partial<CmsCard>) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: card.title,
    subtitle: card.subtitle,
    description: card.description,
    imageUrl: card.imageUrl || '',
    videoUrl: card.videoUrl || '',
    linkUrl: card.linkUrl || '',
    tag: card.tag || '',
    tagColor: card.tagColor || '#d4a853',
    isActive: card.isActive,
    order: card.order,
  });

  const handleSave = () => {
    onSave({
      id: card.id,
      sectionId: card.sectionId,
      ...form,
    });
    setEditing(false);
  };

  return (
    <div className="group">
      <div className={`p-3 rounded-xl border ${card.isActive ? 'bg-card border-border/50' : 'bg-muted/30 border-border/20 opacity-60'} transition-colors duration-150`}>
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Judul</label>
                <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="text-xs h-8" placeholder="Judul card" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Subtitle</label>
                <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} className="text-xs h-8" placeholder="Subtitle" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground">Deskripsi</label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="text-xs min-h-[60px]" placeholder="Deskripsi card" />
            </div>
            <CloudinaryImageField label="Gambar Card" value={form.imageUrl} onChange={(url) => setForm(p => ({ ...p, imageUrl: url }))} folder="cms/cards" />
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Video URL</label>
              <Input value={form.videoUrl} onChange={(e) => setForm(p => ({ ...p, videoUrl: e.target.value }))} className="text-xs h-8" placeholder="YouTube atau URL video (opsional)" />
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">Jika diisi, tombol play akan muncul di card</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Link URL</label>
                <Input value={form.linkUrl} onChange={(e) => setForm(p => ({ ...p, linkUrl: e.target.value }))} className="text-xs h-8" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Tag/Badge</label>
                <Input value={form.tag} onChange={(e) => setForm(p => ({ ...p, tag: e.target.value }))} className="text-xs h-8" placeholder="Contoh: Community" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Warna Tag</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={form.tagColor} onChange={(e) => setForm(p => ({ ...p, tagColor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border-0" />
                  <Input value={form.tagColor} onChange={(e) => setForm(p => ({ ...p, tagColor: e.target.value }))} className="text-[10px] h-7" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Urutan</label>
                <Input type="number" value={form.order} onChange={(e) => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="text-xs h-8" />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant={form.isActive ? 'default' : 'outline'}
                  className={`text-[10px] h-8 w-full ${form.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                >
                  {form.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  {form.isActive ? 'Aktif' : 'Nonaktif'}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" className="text-[10px] h-7" onClick={() => setEditing(false)}>Batal</Button>
              <Button size="sm" className="text-[10px] h-7 bg-idm-gold-warm hover:bg-[#b8912e] text-black" disabled={isPending} onClick={handleSave}>
                {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            {/* Card Preview */}
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/30 bg-muted/30 shrink-0">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold truncate">{card.title || 'Untitled Card'}</p>
                {card.tag && (
                  <Badge className="text-[8px] px-1.5 py-0 border-0" style={{ backgroundColor: hexToRgba(card.tagColor || '#d4a853', 0x20), color: card.tagColor || '#d4a853' }}>
                    {card.tag}
                  </Badge>
                )}
                {!card.isActive && <Badge className="text-[8px] bg-muted text-muted-foreground border-0">Nonaktif</Badge>}
              </div>
              {card.subtitle && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{card.subtitle}</p>}
              {card.description && <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{card.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Section Editor ========== */
function SectionEditor({
  section,
  onSaveSection,
  onSaveCard,
  onDeleteCard,
  onCreateCard,
  onDeleteSection,
  isPending,
}: {
  section: CmsSection;
  onSaveSection: (data: Partial<CmsSection>) => void;
  onSaveCard: (data: Partial<CmsCard>) => void;
  onDeleteCard: (id: string) => void;
  onCreateCard: (sectionId: string) => void;
  onDeleteSection: (id: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [form, setForm] = useState({
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    bannerUrl: section.bannerUrl || '',
    isActive: section.isActive,
    order: section.order,
  });

  const IconComponent = sectionIconMap[section.slug] || Layout;

  const handleSaveSection = () => {
    onSaveSection({
      id: section.id,
      slug: section.slug,
      ...form,
    });
    setEditingSection(false);
  };

  return (
    <div>
      <Card className={`overflow-hidden border transition-colors duration-150 ${section.isActive ? 'border-border/50' : 'border-border/20 opacity-70'}`}>
        {/* Section Header - Clickable to expand */}
        <div
          className="p-3 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-8 h-8 rounded-lg bg-idm-gold-warm/10 flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4 text-idm-gold-warm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{section.title}</p>
              <Badge className="text-[8px] border-0 bg-idm-gold-warm/10 text-idm-gold-warm">{section.slug}</Badge>
              {!section.isActive && <Badge className="text-[8px] bg-red-500/10 text-red-500 border-0">Nonaktif</Badge>}
            </div>
            {section.subtitle && <p className="text-[10px] text-muted-foreground">{section.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="text-[9px] border-0 bg-muted text-muted-foreground">{section.cards?.length || 0} card</Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            <Separator />

            {/* Section Edit Form */}
            {editingSection ? (
              <div className="space-y-3 p-3 rounded-xl bg-muted/20 border border-border/30">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Edit Section</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Judul Section</label>
                    <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="text-xs h-8" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Subtitle</label>
                    <Input value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} className="text-xs h-8" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Deskripsi</label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="text-xs min-h-[50px]" />
                </div>
                <CloudinaryImageField label="Banner Section" value={form.bannerUrl} onChange={(url) => setForm(p => ({ ...p, bannerUrl: url }))} folder="cms/banners" />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Urutan</label>
                    <Input type="number" value={form.order} onChange={(e) => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="text-xs h-8" />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant={form.isActive ? 'default' : 'outline'}
                      className={`text-[10px] h-8 w-full ${form.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    >
                      {form.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {form.isActive ? 'Aktif' : 'Nonaktif'}
                    </Button>
                  </div>
                  <div className="flex items-end gap-1">
                    <Button size="sm" variant="ghost" className="text-[10px] h-8 flex-1" onClick={() => setEditingSection(false)}>Batal</Button>
                    <Button size="sm" className="text-[10px] h-8 bg-idm-gold-warm hover:bg-[#b8912e] text-black" disabled={isPending} onClick={handleSaveSection}>
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Simpan
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{section.description}</p>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => setEditingSection(true)}>
                    <Edit3 className="w-3 h-3 mr-1" /> Edit Section
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[10px] h-7 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDeleteSection(section.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-idm-gold-warm" /> Cards ({section.cards?.length || 0})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7"
                  onClick={() => onCreateCard(section.id)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Tambah Card
                </Button>
              </div>

              {section.cards?.length > 0 ? (
                <div className="space-y-2">
                  {section.cards.map((card) => (
                    <CardEditor
                      key={card.id}
                      card={card}
                      onSave={onSaveCard}
                      onDelete={() => onDeleteCard(card.id)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border/30 rounded-xl">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">Belum ada card. Klik "Tambah Card" untuk menambahkan.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ========== Main CMS Panel ========== */
export function CmsPanel() {
  const qc = useQueryClient();

  /* ========== Queries ========== */
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['cms-sections'],
    queryFn: async () => {
      const res = await fetch('/api/cms/sections', { credentials: 'include' });
      return res.json() as Promise<CmsSection[]>;
    },
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['cms-settings'],
    queryFn: async () => {
      const res = await fetch('/api/cms/settings', { credentials: 'include' });
      return res.json() as Promise<{ settings: { id: string; key: string; value: string; type: string }[]; map: Record<string, string> }>;
    },
  });

  /* ========== Mutations ========== */
  const saveSection = useMutation({
    mutationFn: async (data: Partial<CmsSection>) => {
      const res = await fetch('/api/cms/sections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil disimpan!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/cms/sections', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil dihapus!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const saveCard = useMutation({
    mutationFn: async (data: Partial<CmsCard>) => {
      const res = await fetch('/api/cms/cards', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Card berhasil disimpan!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/cms/cards', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Card berhasil dihapus!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  // Batch save — sends multiple settings in one API call, only 1 toast
  const saveSettingsBatch = useMutation({
    mutationFn: async (items: { key: string; value: string; type?: string }[]) => {
      const res = await fetch('/api/cms/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      // Reset local form state so fields show fresh data from server after refetch
      setSettingsForm(null);
      qc.invalidateQueries({ queryKey: ['cms-settings'] });
      toast.success('Setting berhasil disimpan!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const seedCms = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cms/seed', {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-sections'] });
      qc.invalidateQueries({ queryKey: ['cms-settings'] });
      toast.success('CMS content berhasil di-seed!');
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const createSection = useMutation({
    mutationFn: async (data: { slug: string; title: string; subtitle?: string }) => {
      const res = await fetch('/api/cms/sections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, order: (sections?.length || 0) + 1, isActive: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-sections'] }); toast.success('Section berhasil dibuat!'); },
    onError: (e: Error) => { toast.error(e.message); },
  });

  /* ========== Settings Form State ========== */
  const [settingsFormState, setSettingsForm] = useState<Record<string, string> | null>(null);
  const settingsDataBase = settingsData?.map || {};
  const settingsForm = settingsFormState ?? settingsDataBase;
  // When setting a settings form field, always merge from the latest server data
  // This ensures fields not yet edited by admin are preserved from server data
  const updateSettingsForm = (updates: Partial<Record<string, string>>) => {
    setSettingsForm(prev => ({ ...settingsDataBase, ...prev, ...updates }) as Record<string, string>);
  };

  /* ========== New Section State ========== */
  const [newSection, setNewSection] = useState({ slug: '', title: '' });

  const isPending = saveSection.isPending || saveCard.isPending || deleteSection.isPending || deleteCard.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-idm-gold-warm" />
          <h2 className="text-lg font-bold text-gradient-fury">CMS Landing Page</h2>
          <Badge className="bg-idm-gold-warm/10 text-idm-gold-warm text-[10px] border-0">MANAGE</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => seedCms.mutate()}
          disabled={seedCms.isPending}
        >
          {seedCms.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
          Seed Default
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-muted/50 h-auto">
          <TabsTrigger value="settings" className="text-xs py-2"><Settings2 className="w-3 h-3 mr-1" />Settings & Branding</TabsTrigger>
          <TabsTrigger value="sections" className="text-xs py-2"><Layout className="w-3 h-3 mr-1" />Sections & Cards</TabsTrigger>
        </TabsList>

        {/* ====== SETTINGS TAB ====== */}
        <TabsContent value="settings">
          <div className="space-y-4">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-idm-gold-warm" />
              </div>
            ) : (
              <>
                {/* Site Identity */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-idm-gold-warm" /> Identitas Situs
                      <Badge className="text-[8px] border-0 bg-muted text-muted-foreground">Global</Badge>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Judul Situs</label>
                        <Input
                          value={settingsForm.site_title || ''}
                          onChange={(e) => updateSettingsForm({ site_title: e.target.value })}
                          className="text-sm"
                          placeholder="IDM League"
                        />
                      </div>
                      <CloudinaryImageField
                        label="Logo"
                        value={settingsForm.logo_url}
                        onChange={(url) => updateSettingsForm({ logo_url: url })}
                        folder="cms/logos"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        size="sm"
                        className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                        onClick={() => {
                          saveSettingsBatch.mutate([
                            { key: 'site_title', value: settingsForm.site_title || '', type: 'text' },
                            { key: 'logo_url', value: settingsForm.logo_url || '', type: 'image' },
                          ]);
                        }}
                        disabled={saveSettingsBatch.isPending}
                      >
                        {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Identitas
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Hero Settings */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-idm-gold-warm" /> Hero Section
                      <Badge className="text-[8px] border-0 bg-idm-gold-warm/10 text-idm-gold-warm">Section 1</Badge>
                    </h3>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Judul Hero</label>
                          <Input
                            value={settingsForm.hero_title || ''}
                            onChange={(e) => updateSettingsForm({ hero_title: e.target.value })}
                            className="text-sm"
                            placeholder="Idol Meta"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subtitle Hero</label>
                          <Input
                            value={settingsForm.hero_subtitle || ''}
                            onChange={(e) => updateSettingsForm({ hero_subtitle: e.target.value })}
                            className="text-sm"
                            placeholder="Fan Made Edition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tagline Hero</label>
                        <Textarea
                          value={settingsForm.hero_tagline || ''}
                          onChange={(e) => updateSettingsForm({ hero_tagline: e.target.value })}
                          className="text-sm"
                          placeholder="Tempat dancer terbaik berkompetisi..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CloudinaryImageField
                          label="Background Desktop"
                          value={settingsForm.hero_bg_desktop}
                          onChange={(url) => updateSettingsForm({ hero_bg_desktop: url })}
                          folder="cms/backgrounds"
                        />
                        <CloudinaryImageField
                          label="Background Mobile"
                          value={settingsForm.hero_bg_mobile}
                          onChange={(url) => updateSettingsForm({ hero_bg_mobile: url })}
                          folder="cms/backgrounds"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Video Background (Opsional)</label>
                        <Input
                          value={settingsForm.hero_bg_video || ''}
                          onChange={(e) => updateSettingsForm({ hero_bg_video: e.target.value })}
                          className="text-sm"
                          placeholder="URL video YouTube/MP4 — jika diisi, menggantikan gambar"
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">Video loop menggantikan background image di Hero. Mendukung YouTube (otomatis embed) dan URL MP4 langsung.</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'hero_title', value: settingsForm.hero_title || '', type: 'text' },
                          { key: 'hero_subtitle', value: settingsForm.hero_subtitle || '', type: 'text' },
                          { key: 'hero_tagline', value: settingsForm.hero_tagline || '', type: 'text' },
                          { key: 'hero_bg_desktop', value: settingsForm.hero_bg_desktop || '', type: 'image' },
                          { key: 'hero_bg_mobile', value: settingsForm.hero_bg_mobile || '', type: 'image' },
                          { key: 'hero_bg_video', value: settingsForm.hero_bg_video || '', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Hero
                    </Button>
                  </CardContent>
                </Card>

                {/* About Section Text Settings — Landing Section #2 (after Hero) */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-idm-gold-warm" /> About / Cerita Kami
                      <Badge className="text-[8px] border-0 bg-cyan-500/10 text-cyan-400">Section 2</Badge>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Edit teks pada section About di landing page</p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Origin Story</label>
                      <Textarea
                        rows={6}
                        placeholder="Cerita awal mula IDM League... (pisahkan paragraf dengan baris kosong)"
                        value={settingsForm.about_origin_story || ''}
                        onChange={(e) => updateSettingsForm({ about_origin_story: e.target.value })}
                        className="text-xs resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Season 1 Success Text</label>
                      <Textarea
                        rows={3}
                        placeholder="Teks tentang keberhasilan Season 1..."
                        value={settingsForm.about_season1_text || ''}
                        onChange={(e) => updateSettingsForm({ about_season1_text: e.target.value })}
                        className="text-xs resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bottom Tagline</label>
                      <Input
                        placeholder="Contoh: By Players, For Players"
                        value={settingsForm.about_tagline || ''}
                        onChange={(e) => updateSettingsForm({ about_tagline: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'about_origin_story', value: settingsForm.about_origin_story || '', type: 'text' },
                          { key: 'about_season1_text', value: settingsForm.about_season1_text || '', type: 'text' },
                          { key: 'about_tagline', value: settingsForm.about_tagline || '', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan About
                    </Button>
                  </CardContent>
                </Card>

                {/* Kompetisi — Landing Section #3 (Video URLs) */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Swords className="w-4 h-4 text-idm-gold-warm" /> Kompetisi
                      <Badge className="text-[8px] border-0 bg-cyan-500/10 text-cyan-400">Section 3</Badge>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Tambahkan video highlight untuk masing-masing divisi di section Kompetisi. Tombol play akan muncul di card divisi.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Video Male (Opsional)</label>
                        <Input
                          value={settingsForm.kompetisi_male_video_url || ''}
                          onChange={(e) => updateSettingsForm({ kompetisi_male_video_url: e.target.value })}
                          className="text-sm"
                          placeholder="URL YouTube/MP4 — tombol play di card Male"
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">Video highlight turnamen Male Division</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Video Female (Opsional)</label>
                        <Input
                          value={settingsForm.kompetisi_female_video_url || ''}
                          onChange={(e) => updateSettingsForm({ kompetisi_female_video_url: e.target.value })}
                          className="text-sm"
                          placeholder="URL YouTube/MP4 — tombol play di card Female"
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">Video highlight turnamen Female Division</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'kompetisi_male_video_url', value: settingsForm.kompetisi_male_video_url || '', type: 'text' },
                          { key: 'kompetisi_female_video_url', value: settingsForm.kompetisi_female_video_url || '', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Kompetisi
                    </Button>
                  </CardContent>
                </Card>

                {/* Liga IDM / The Dream — Landing Section #7 (Dream part) */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-idm-gold-warm" /> Liga IDM / The Dream
                      <Badge className="text-[8px] border-0 bg-purple-500/10 text-purple-400">Section 7</Badge>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Edit teks pada section Liga IDM / The Dream di landing page. Gunakan <code className="bg-muted px-1 rounded text-[9px]">{'{season}'}</code> untuk nomor season, <code className="bg-muted px-1 rounded text-[9px]">{'{champion}'}</code> untuk nama champion, <code className="bg-muted px-1 rounded text-[9px]">{'{clubs}'}</code> untuk jumlah club, <code className="bg-muted px-1 rounded text-[9px]">{'{matches}'}</code> untuk jumlah match, <code className="bg-muted px-1 rounded text-[9px]">{'{participants}'}</code> untuk total peserta.</p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deskripsi (Season Completed — ada champion)</label>
                      <Textarea
                        rows={3}
                        placeholder="Season {season} telah berlangsung dengan meriah — {champion} tampil sebagai champion..."
                        value={settingsForm.dream_description_completed || ''}
                        onChange={(e) => updateSettingsForm({ dream_description_completed: e.target.value })}
                        className="text-xs resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deskripsi (Season Active — belum ada champion)</label>
                      <Textarea
                        rows={3}
                        placeholder="{clubs} club bertanding, peserta bebas mix dari divisi male dan female..."
                        value={settingsForm.dream_description_active || ''}
                        onChange={(e) => updateSettingsForm({ dream_description_active: e.target.value })}
                        className="text-xs resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Teks "Season Next" (ajakan dukungan)</label>
                      <Textarea
                        rows={3}
                        placeholder="Season {season} sudah terbukti — champion dinobatkan, club bertanding..."
                        value={settingsForm.dream_season_next_text || ''}
                        onChange={(e) => updateSettingsForm({ dream_season_next_text: e.target.value })}
                        className="text-xs resize-y"
                      />
                    </div>
                    <Separator className="my-2" />
                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-idm-gold-warm" /> Statistik Liga (Manual)
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Isi manual jumlah club, match, dan peserta yang ditampilkan di section Liga IDM. Kosongkan untuk menggunakan data otomatis.</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Club Bertanding</label>
                        <Input
                          type="number"
                          min="0"
                          value={settingsForm.dream_clubs_competing || ''}
                          onChange={(e) => updateSettingsForm({ dream_clubs_competing: e.target.value })}
                          className="text-sm"
                          placeholder="Otomatis"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Match Dimainkan</label>
                        <Input
                          type="number"
                          min="0"
                          value={settingsForm.dream_matches_played || ''}
                          onChange={(e) => updateSettingsForm({ dream_matches_played: e.target.value })}
                          className="text-sm"
                          placeholder="Otomatis"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Peserta Total</label>
                        <Input
                          type="number"
                          min="0"
                          value={settingsForm.dream_total_participants || ''}
                          onChange={(e) => updateSettingsForm({ dream_total_participants: e.target.value })}
                          className="text-sm"
                          placeholder="Otomatis"
                        />
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-idm-gold-warm" /> Video & Highlight
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Video Champion (Opsional)</label>
                        <Input
                          value={settingsForm.champion_video_url || ''}
                          onChange={(e) => updateSettingsForm({ champion_video_url: e.target.value })}
                          className="text-sm"
                          placeholder="URL video YouTube/MP4 — tombol play di card champion"
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">Video showcase pemenang liga, muncul sebagai tombol play di section Champion</p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                      <Type className="w-3 h-3 text-idm-gold-warm" /> CTA (Call to Action)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Tombol Male</label>
                        <Input
                          value={settingsForm.nav_cta_male_text || ''}
                          onChange={(e) => updateSettingsForm({ nav_cta_male_text: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Tombol Female</label>
                        <Input
                          value={settingsForm.nav_cta_female_text || ''}
                          onChange={(e) => updateSettingsForm({ nav_cta_female_text: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <h4 className="text-xs font-semibold flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-idm-gold-warm" /> Countdown Timer
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Jika diisi, countdown timer akan muncul di section Liga IDM.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Label</label>
                        <Input
                          value={settingsForm.countdown_label || ''}
                          onChange={(e) => updateSettingsForm({ countdown_label: e.target.value })}
                          className="text-sm"
                          placeholder="Match Day Berikutnya"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Target Waktu</label>
                        <Input
                          type="datetime-local"
                          value={settingsForm.countdown_target_date || ''}
                          onChange={(e) => updateSettingsForm({ countdown_target_date: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'dream_description_completed', value: settingsForm.dream_description_completed || '', type: 'text' },
                          { key: 'dream_description_active', value: settingsForm.dream_description_active || '', type: 'text' },
                          { key: 'dream_season_next_text', value: settingsForm.dream_season_next_text || '', type: 'text' },
                          { key: 'dream_clubs_competing', value: settingsForm.dream_clubs_competing || '', type: 'text' },
                          { key: 'dream_matches_played', value: settingsForm.dream_matches_played || '', type: 'text' },
                          { key: 'dream_total_participants', value: settingsForm.dream_total_participants || '', type: 'text' },
                          { key: 'champion_video_url', value: settingsForm.champion_video_url || '', type: 'text' },
                          { key: 'countdown_label', value: settingsForm.countdown_label || '', type: 'text' },
                          { key: 'countdown_target_date', value: settingsForm.countdown_target_date || '', type: 'text' },
                          { key: 'nav_cta_male_text', value: settingsForm.nav_cta_male_text || '', type: 'text' },
                          { key: 'nav_cta_female_text', value: settingsForm.nav_cta_female_text || '', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Liga IDM & CTA
                    </Button>
                  </CardContent>
                </Card>

                {/* Social Links — Footer Area */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-idm-gold-warm" /> Social Links
                      <Badge className="text-[8px] border-0 bg-green-500/10 text-green-400">Footer</Badge>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Masukkan URL social media. Kosongkan atau biarkan # untuk menyembunyikan icon di footer.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                          Discord
                        </label>
                        <Input
                          value={settingsForm.social_discord_url || ''}
                          onChange={(e) => updateSettingsForm({ social_discord_url: e.target.value })}
                          className="text-sm"
                          placeholder="https://discord.gg/..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                          Instagram
                        </label>
                        <Input
                          value={settingsForm.social_instagram_url || ''}
                          onChange={(e) => updateSettingsForm({ social_instagram_url: e.target.value })}
                          className="text-sm"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          YouTube
                        </label>
                        <Input
                          value={settingsForm.social_youtube_url || ''}
                          onChange={(e) => updateSettingsForm({ social_youtube_url: e.target.value })}
                          className="text-sm"
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-3 h-3 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </label>
                        <Input
                          value={settingsForm.social_whatsapp_url || ''}
                          onChange={(e) => updateSettingsForm({ social_whatsapp_url: e.target.value })}
                          className="text-sm"
                          placeholder="https://chat.whatsapp.com/..."
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'social_discord_url', value: settingsForm.social_discord_url || '#', type: 'text' },
                          { key: 'social_instagram_url', value: settingsForm.social_instagram_url || '#', type: 'text' },
                          { key: 'social_youtube_url', value: settingsForm.social_youtube_url || '#', type: 'text' },
                          { key: 'social_whatsapp_url', value: settingsForm.social_whatsapp_url || '#', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Social Links
                    </Button>
                  </CardContent>
                </Card>

                {/* Footer Settings — Landing Section #8 */}
                <Card className="border border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <PanelBottom className="w-4 h-4 text-idm-gold-warm" /> Footer
                      <Badge className="text-[8px] border-0 bg-amber-500/10 text-amber-400">Section 8</Badge>
                    </h3>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Teks Footer</label>
                      <Textarea
                        value={settingsForm.footer_text || ''}
                        onChange={(e) => updateSettingsForm({ footer_text: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tagline Footer</label>
                      <Input
                        value={settingsForm.footer_tagline || ''}
                        onChange={(e) => updateSettingsForm({ footer_tagline: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="text-[10px] bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                      onClick={() => {
                        saveSettingsBatch.mutate([
                          { key: 'footer_text', value: settingsForm.footer_text || '', type: 'text' },
                          { key: 'footer_tagline', value: settingsForm.footer_tagline || '', type: 'text' },
                        ]);
                      }}
                      disabled={saveSettingsBatch.isPending}
                    >
                      {saveSettingsBatch.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Simpan Footer
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* ====== SECTIONS TAB ====== */}
        <TabsContent value="sections">
          <div className="space-y-4">
            {/* Add new section */}
            <Card className="border border-dashed border-idm-gold-warm/30 bg-idm-gold-warm/5">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-idm-gold-warm" /> Tambah Section Baru
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Slug (contoh: sponsors)"
                    value={newSection.slug}
                    onChange={(e) => setNewSection(p => ({ ...p, slug: e.target.value }))}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Judul Section"
                    value={newSection.title}
                    onChange={(e) => setNewSection(p => ({ ...p, title: e.target.value }))}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    className="text-xs bg-idm-gold-warm hover:bg-[#b8912e] text-black"
                    disabled={!newSection.slug || !newSection.title || createSection.isPending}
                    onClick={() => {
                      createSection.mutate(newSection);
                      setNewSection({ slug: '', title: '' });
                    }}
                  >
                    {createSection.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />} Buat Section
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sections List */}
            {sectionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-idm-gold-warm" />
              </div>
            ) : (sections?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {sections!.map((section) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onSaveSection={(data) => saveSection.mutate(data)}
                    onSaveCard={(data) => saveCard.mutate(data)}
                    onDeleteCard={(id) => deleteCard.mutate(id)}
                    onCreateCard={(sectionId) => {
                      saveCard.mutate({
                        sectionId,
                        title: 'New Card',
                        subtitle: '',
                        description: '',
                        order: (section.cards?.length || 0) + 1,
                        isActive: true,
                      });
                    }}
                    onDeleteSection={(id) => deleteSection.mutate(id)}
                    isPending={isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Layout className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Belum ada section</p>
                <Button size="sm" className="bg-idm-gold-warm hover:bg-[#b8912e] text-black" onClick={() => seedCms.mutate()} disabled={seedCms.isPending}>
                  {seedCms.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Seed Default Content
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
