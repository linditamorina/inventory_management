"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotifications } from '../../../hooks/useNotification';
import {
  Plus, Pencil, Trash2, X, Save,
  Tag, Loader2, Search, AlertTriangle, Layers
} from 'lucide-react';
import { findDuplicateCategory } from '../../../utils/categoryNormalizer';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [accessChecked, setAccessChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{ id?: string; name: string }>({ name: '' });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => {
            if (data?.role !== 'admin') {
              router.replace('/dashboard');
            } else {
              setAccessChecked(true);
            }
          });
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentCategory.name.trim()) return;
    setDuplicateError(null);

    // Kontrollo duplikat (edhe ndër-gjuhësor)
    const otherCategories = currentCategory.id
      ? categories.filter(c => c.id !== currentCategory.id)
      : categories;
    const duplicate = findDuplicateCategory(currentCategory.name, otherCategories);
    if (duplicate) {
      setDuplicateError(
        `Kategoria "${duplicate}" ekziston tashmë (e njëjta si "${currentCategory.name}").`
      );
      return;
    }

    setIsSaving(true);
    try {
      if (currentCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update({ name: currentCategory.name })
          .eq('id', currentCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name: currentCategory.name }])
          .select();
        if (error) throw error;
        addNotification(`Kategoria e re "${currentCategory.name.toUpperCase()}" u shtua me sukses.`);
      }
      setIsModalOpen(false);
      setCurrentCategory({ name: '' });
      await fetchCategories();
    } catch (error: any) {
      alert(t('cat_error_prefix') + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete);
      if (error) throw error;
      await fetchCategories();
    } catch {
      alert(t('cat_error_delete'));
    } finally {
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!accessChecked) return null;

  return (
    <div className="p-4 sm:p-10 min-h-screen bg-white">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white">
              <Layers size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">{t('cat_page_title')}</h1>
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-12">{t('cat_page_subtitle')}</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('cat_search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-red-600 font-bold text-sm"
            />
          </div>
          <button
            onClick={() => { setCurrentCategory({ name: '' }); setIsModalOpen(true); }}
            className="bg-[#111827] hover:bg-red-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} /> {t('cat_add_btn')}
          </button>
        </div>
      </div>

      {/* SEKSIONI: KATEGORITE AKTIVE */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
          <Tag size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-base font-black uppercase tracking-tighter text-slate-800">{t('cat_active_section')}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {loading ? '...' : `${filteredCategories.length} ${t('cat_count_label')}`}
          </p>
        </div>
      </div>

      {/* GRIDI I KATEGORIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-[2rem] border-2 border-slate-100" />
          ))
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
            <Tag size={48} strokeWidth={1.2} className="mb-4" />
            <p className="font-black uppercase text-sm tracking-widest">{t('cat_empty_title')}</p>
            <p className="text-xs font-medium mt-1">{t('cat_empty_desc')}</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border-2 border-slate-100 hover:border-red-200 hover:shadow-lg p-5 rounded-[2rem] transition-all"
            >
              {/* Emri */}
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                  <Tag size={16} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm flex-1 truncate">
                  {cat.name}
                </h3>
              </div>

              {/* Butonat — gjithmonë të dukshëm */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setCurrentCategory(cat); setIsModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors"
                >
                  <Pencil size={13} strokeWidth={2.5} /> {t('cat_edit_btn')}
                </button>
                <button
                  onClick={() => confirmDelete(cat.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-red-600 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-colors"
                >
                  <Trash2 size={13} strokeWidth={2.5} /> {t('cat_delete_btn')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: SHTO / EDITO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white">
            <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                {currentCategory.id ? t('cat_modal_edit_title') : t('cat_modal_add_title')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-600 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <input
                  type="text"
                  value={currentCategory.name}
                  onChange={(e) => { setCurrentCategory({ ...currentCategory, name: e.target.value }); setDuplicateError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className={`w-full p-5 bg-slate-50 border-2 rounded-2xl outline-none font-black text-lg uppercase transition-colors ${duplicateError ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-slate-900'}`}
                  placeholder={t('cat_input_placeholder')}
                  autoFocus
                />
                {duplicateError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0" strokeWidth={2.5} />
                    <p className="text-[10px] font-bold text-red-600">{duplicateError}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-red-600 text-white font-black py-5 rounded-2xl hover:bg-slate-900 uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg transition-colors"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                {t('cat_save_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FSHIRJA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-red-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center space-y-6 border-4 border-red-50">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('cat_confirm_title')}</h3>
              <p className="text-slate-500 font-medium mt-2">{t('cat_confirm_desc')}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest transition-all"
              >
                {t('cat_cancel_btn')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-200"
              >
                {t('cat_confirm_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
