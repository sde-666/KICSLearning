import React, { useState, useRef } from 'react';
import { useInstitute } from '../../context/InstituteContext';
import { InstituteSettings, DEFAULT_INSTITUTE_SETTINGS } from '../../types';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Link,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  RotateCcw,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onBackToPortal?: () => void;
}

export const InstituteSettingsManager: React.FC<Props> = ({ onBackToPortal }) => {
  const { settings, updateSettings, resetToDefault, isSaving } = useInstitute();

  const [formData, setFormData] = useState<InstituteSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(settings.logoUrl);
  const [activePreviewTab, setActivePreviewTab] = useState<'navbar' | 'card' | 'badge'>('navbar');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep form data updated if external settings update
  React.useEffect(() => {
    setFormData({ ...settings });
    setLogoPreviewUrl(settings.logoUrl);
  }, [settings]);

  // Handle image upload and resize client-side
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (!dataUri) return;

      // Compress and resize image using an offscreen canvas to keep Firestore document size light
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400; // 400px is crisp for institute logos
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUri = canvas.toDataURL('image/png', 0.88);
          setLogoPreviewUrl(compressedUri);
          setFormData((prev) => ({ ...prev, logoUrl: compressedUri }));
        } else {
          setLogoPreviewUrl(dataUri);
          setFormData((prev) => ({ ...prev, logoUrl: dataUri }));
        }
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setLogoPreviewUrl(url);
    setFormData((prev) => ({ ...prev, logoUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.instituteName.trim()) {
      setErrorMsg('Institute name cannot be empty.');
      return;
    }

    try {
      await updateSettings(formData);
      setSuccessMsg('Institute settings and branding have been saved successfully! Changes are now active across the entire portal.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save institute configuration.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all organization settings, name, and logo back to default KICS values?')) {
      try {
        const defaults = await resetToDefault();
        setFormData({ ...defaults });
        setLogoPreviewUrl(defaults.logoUrl);
        setSuccessMsg('Reset to default institute configuration successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        setErrorMsg('Failed to reset settings.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Institute & Organization Setup
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Global Branding
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Configure your institute name, custom logo, accreditation, and hero section. All updates apply globally across the student portal, login page, admin dashboard, certificates, and lecture watermark footers in real time.
            </p>
          </div>
        </div>

        {onBackToPortal && (
          <button
            type="button"
            onClick={onBackToPortal}
            className="self-start md:self-center px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors cursor-pointer border border-blue-200/60"
          >
            Preview Portal
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Institute Identity & Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Organization Identity & Details
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Visible on Navbar, Headers & Footer</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institute / Organization Full Name *
                </label>
                <input
                  type="text"
                  value={formData.instituteName}
                  onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                  placeholder="e.g. Karamraji Institute of Computer Science & IT"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Short Name / Acronym *
                </label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="e.g. KICS or AIAT"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tagline / Mission Statement
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Premier Institute for Computer Science & IT"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Affiliation / Accreditation Badge Text
                </label>
                <input
                  type="text"
                  value={formData.affiliationText}
                  onChange={(e) => setFormData({ ...formData, affiliationText: e.target.value })}
                  placeholder="e.g. NIELIT O-Level Authorized Study Centre"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Portal Web URL
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={formData.portalUrl}
                    onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                    placeholder="https://kicslearning.vercel.app/"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This link is automatically copied when faculty shares student credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Established Year
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                    placeholder="e.g. 2018"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Logo Upload & Live Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Institute Logo & Visual Branding
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Upload file or provide hosted URL</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Upload Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Upload New Logo (From Computer / Mobile)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PNG, JPG, SVG or WEBP • Recommended transparent background or square
                    </p>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    OR PROVIDE IMAGE URL
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hosted Logo URL
                  </label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png or /images/logo.jpg"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-mono text-slate-800"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400">Default: /images/logo.jpg</span>
                    <button
                      type="button"
                      onClick={() => handleUrlChange('/images/logo.jpg')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Use Default KICS Logo
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Real-time Preview */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Branding Preview</span>
                  </span>

                  <div className="flex rounded-lg bg-slate-200/70 p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('navbar')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        activePreviewTab === 'navbar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Navbar
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('card')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        activePreviewTab === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('badge')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        activePreviewTab === 'badge' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Badge
                    </button>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="flex-1 flex flex-col justify-center items-center min-h-[180px] rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs">
                  {activePreviewTab === 'navbar' && (
                    <div className="w-full h-full p-4 bg-gradient-to-r from-[#5f90eb] via-[#9147f1] to-[#ce03f6] text-white flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={logoPreviewUrl || '/images/logo.jpg'}
                          alt="Logo Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/logo.jpg';
                          }}
                          className="h-12 w-auto max-w-[56px] object-contain rounded-lg bg-white border border-white/40 shadow-sm shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <h4 className="text-sm font-bold text-white truncate leading-tight">
                            {formData.instituteName || 'Institute Name'}
                          </h4>
                          <span className="text-emerald-200 text-[10px] font-medium flex items-center gap-1 mt-0.5">
                            <GraduationCap className="w-3 h-3 text-emerald-300" />
                            <span className="truncate">{formData.affiliationText || 'Student Learning Portal'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'card' && (
                    <div className="w-full h-full p-5 bg-white text-slate-800 flex flex-col items-center justify-center text-center">
                      <img
                        src={logoPreviewUrl || '/images/logo.jpg'}
                        alt="Logo Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/logo.jpg';
                        }}
                        className="h-16 w-auto max-w-[80px] object-contain rounded-xl shadow-xs border border-slate-200 bg-white p-1 mb-2"
                      />
                      <h4 className="text-xs font-bold text-slate-900 max-w-[220px] leading-tight">
                        {formData.instituteName || 'Institute Name'}
                      </h4>
                      <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                        {formData.tagline || 'Excellence in Computer Science'}
                      </p>
                    </div>
                  )}

                  {activePreviewTab === 'badge' && (
                    <div className="w-full h-full p-6 bg-slate-900 text-white flex flex-col items-center justify-center">
                      <div className="relative">
                        <img
                          src={logoPreviewUrl || '/images/logo.jpg'}
                          alt="Logo Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/logo.jpg';
                          }}
                          className="w-16 h-16 rounded-full object-contain bg-white border-2 border-blue-400 p-1 shadow-lg"
                        />
                        <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900">
                          <ShieldCheck className="w-3 h-3 text-white" />
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white mt-2">
                        {formData.shortName || 'KICS'} Official
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 text-center mt-2.5">
                  High-res image automatically scaled for optimal crispness on desktop & retina screens.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Home Page Hero Section Customization */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Home Page Hero Banner Customization
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Enhance the primary landing view</span>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Top Badge Text
              </label>
              <input
                type="text"
                value={formData.heroBadge}
                onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                placeholder="✨ Official Digital Learning Portal"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Main Hero Headline *
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                placeholder="e.g. Master Computer Science & Elevate Your Tech Future"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Subtitle / Description *
              </label>
              <textarea
                rows={2}
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                placeholder="Comprehensive syllabus notes, interactive code units, chapter lectures..."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Notice / Announcement Ribbon
              </label>
              <input
                type="text"
                value={formData.heroNotice || ''}
                onChange={(e) => setFormData({ ...formData, heroNotice: e.target.value })}
                placeholder="e.g. New Academic Batch Notes & Practical Units Live • Access Your Modules Below"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Contact & Support Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Contact & Support Details
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Student help desk information</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Support Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@kicslearning.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Campus Address / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Main Campus, IT Park Road"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 shadow-xl flex items-center justify-between gap-4 z-20">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Organization Setup...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Organization Setup</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
