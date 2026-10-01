import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InstituteSettings, DEFAULT_INSTITUTE_SETTINGS } from '../types';
import {
  fetchInstituteSettings,
  saveInstituteSettings as apiSaveSettings,
  listenToInstituteSettings,
} from '../services/portalService';

interface InstituteContextType {
  settings: InstituteSettings;
  updateSettings: (newSettings: Partial<InstituteSettings>) => Promise<InstituteSettings>;
  resetToDefault: () => Promise<InstituteSettings>;
  isLoading: boolean;
  isSaving: boolean;
}

const InstituteContext = createContext<InstituteContextType>({
  settings: DEFAULT_INSTITUTE_SETTINGS,
  updateSettings: async () => DEFAULT_INSTITUTE_SETTINGS,
  resetToDefault: async () => DEFAULT_INSTITUTE_SETTINGS,
  isLoading: false,
  isSaving: false,
});

export const InstituteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<InstituteSettings>(() => {
    try {
      const cached = localStorage.getItem('kics_institute_settings_v1');
      if (cached) {
        return { ...DEFAULT_INSTITUTE_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_INSTITUTE_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync document title and meta description dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${settings.instituteName} | Official Student Portal`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Official learning portal for ${settings.instituteName}. Access syllabus notes, lecture slides, and practical code.`
        );
      }
    }
  }, [settings.instituteName]);

  // Initial fetch and real-time synchronization
  useEffect(() => {
    let mounted = true;

    fetchInstituteSettings()
      .then((data) => {
        if (mounted) {
          setSettings(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    // Real-time listener
    const unsub = listenToInstituteSettings((updated) => {
      if (mounted) {
        setSettings(updated);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<InstituteSettings>): Promise<InstituteSettings> => {
      setIsSaving(true);
      try {
        const saved = await apiSaveSettings(newSettings);
        setSettings(saved);
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const resetToDefault = useCallback(async (): Promise<InstituteSettings> => {
    setIsSaving(true);
    try {
      const reset = await apiSaveSettings(DEFAULT_INSTITUTE_SETTINGS);
      setSettings(reset);
      return reset;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <InstituteContext.Provider
      value={{
        settings,
        updateSettings,
        resetToDefault,
        isLoading,
        isSaving,
      }}
    >
      {children}
    </InstituteContext.Provider>
  );
};

export function useInstitute(): InstituteContextType {
  const context = useContext(InstituteContext);
  if (!context) {
    throw new Error('useInstitute must be used within an InstituteProvider');
  }
  return context;
}
