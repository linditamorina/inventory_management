"use client";

import { useState, useEffect } from "react";
import {
  Package, Plus, Search, Filter, Edit3, Trash2, History, X, Loader2,
  CheckCircle, AlertTriangle, Trash, Sparkles, LayoutGrid, AlertCircle,
  ArrowUpRight, ArrowDownRight, ArrowUpDown, BrainCircuit, Timer, ChevronDown,
  Tag, DollarSign, Hash, Type, AlignLeft
} from "lucide-react";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "../../../hooks/useProducts";
import { useProductMovements, useRecordMovement } from "../../../hooks/useStock";
import { usePredictor } from "../../../hooks/usePredictor";
import { useNotifications } from "../../../hooks/useNotification"; 
import { useAboutCompany } from "../../../hooks/useAboutCompany"; // <--- IMPORTUAM HOOK-UN TËND

import { useLanguage } from "../../../context/LanguageContext"; 
import { supabase } from "../../../lib/supabase";

const translations = {
  en: {
    inventory: "Inventory",
    stock: "Stock",
    subtitle: "Real-time product management",
    addProduct: "Add Product",
    searchPlaceholder: "Search by Name or SKU...",
    all: "All",
    lowStock: "Low Stock",
    showAll: "Show All",
    tableProdSku: "Product / SKU",
    tableCategory: "Category",
    tablePrice: "Price",
    tableStock: "Stock",
    tableAIPred: "AI Prediction",
    tableActions: "Actions",
    loading: "Loading...",
    noProducts: "No products found.",
    historyTitle: "History",
    noMovements: "No movements",
    date: "Date",
    type: "Type",
    qty: "Quantity",
    reason: "Reason",
    in: "IN",
    out: "OUT",
    newStock: "New Stock",
    inPlus: "In (+)",
    outMinus: "Out (-)",
    update: "Update",
    add: "Add",
    edit: "Edit",
    stockDetails: "Stock Details",
    name: "Name",
    desc: "Description",
    category: "Category",
    price: "Price",
    manualLimit: "Low stock alert (Manual limit)",
    save: "Save",
    deleteTitle: "Delete?",
    yesDelete: "Yes, Delete",
    cancel: "Cancel",
    equipment: "Equipment",
    software: "Software",
    accessories: "Accessories",
    pcs: "pcs",
    newSupply: "New supply",
    sale: "Sale",
    alertEmpty: (name: string) => `ALARM: Stock for "${name}" is completely empty!`,
    alertCritical: (name: string, qty: number) => `WARNING: "${name}" reached critical limit (${qty} left).`,
    alertUpdated: (name: string, qty: number) => `Update: Stock of "${name}" updated to ${qty} pcs.`,
    errorNoName: "Please enter the product name.",
    errorQty: "Quantity must be greater than 0!",
    productAdded: (name: string) => `New product: "${name}" added to inventory.`,
    productDeleted: (name: string) => `Product "${name}" deleted from the system.`
  },
  sq: {
    inventory: "Inventory",
    stock: "Stock",
    subtitle: "Menaxhimi i produkteve në kohë reale",
    addProduct: "Shto Produkt",
    searchPlaceholder: "Kërko me Emër ose SKU...",
    all: "Të Gjitha",
    lowStock: "Stok i Ulët",
    showAll: "Trego të Gjitha",
    tableProdSku: "Produkt / SKU",
    tableCategory: "Kategoria",
    tablePrice: "Çmimi",
    tableStock: "Stoku",
    tableAIPred: "Parashikimi AI",
    tableActions: "Veprime",
    loading: "Duke ngarkuar...",
    noProducts: "Asnjë produkt u gjet.",
    historyTitle: "Historiku",
    noMovements: "Nuk ka lëvizje",
    date: "Data",
    type: "Lloji",
    qty: "Sasia",
    reason: "Arsyeja",
    in: "HYRJE",
    out: "DALJE",
    newStock: "Stok i Ri",
    inPlus: "Hyrje (+)",
    outMinus: "Dalje (-)",
    update: "Përditëso",
    add: "Shto",
    edit: "Edito",
    stockDetails: "Detajet e Stokut",
    name: "Emri",
    desc: "Përshkrimi",
    category: "Kategoria",
    price: "Çmimi",
    manualLimit: "Alarmi për stok të ulët (Limiti manual)",
    save: "Ruaj",
    deleteTitle: "Fshije?",
    yesDelete: "Po, Fshije",
    cancel: "Anulo",
    equipment: "Pajisje",
    software: "Softuer",
    accessories: "Aksesorë",
    pcs: "CP",
    newSupply: "Furnizim i ri",
    sale: "Shitje",
    alertEmpty: (name: string) => `ALARM: Stoku për "${name}" ka mbaruar plotësisht!`,
    alertCritical: (name: string, qty: number) => `KUJDES: "${name}" ka arritur limitin kritik (${qty} mbetur).`,
    alertUpdated: (name: string, qty: number) => `Përditësim: Stoku i "${name}" u përditësua në ${qty} CP.`,
    errorNoName: "Ju lutem shkruani emrin e produktit.",
    errorQty: "Sasia duhet të jetë më e madhe se 0!",
    productAdded: (name: string) => `Produkt i ri: "${name}" u shtua në inventar.`,
    productDeleted: (name: string) => `Produkti "${name}" u fshi nga sistemi.`
  }
};

export default function InventoryPage() {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.sq;
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from('categories').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setDbCategories(data); });
  }, []);
  
  // Përdorim hook-un tënd për të marrë Rolin dhe Valutën
  const { aboutCompany, userRole } = useAboutCompany(); 
  const [currencySymbol, setCurrencySymbol] = useState("€");

  const { data: products = [], isLoading } = useProducts();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();
  const updateMutation = useUpdateProduct();
  const recordMovement = useRecordMovement();
  
  const { getStockStatus } = usePredictor();
  const { addNotification } = useNotifications(); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedProductIdForHistory, setSelectedProductIdForHistory] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: "IN",
    quantity: "",
    reason: t.newSupply,
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useProductMovements(selectedProductIdForHistory || "");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: t.equipment,
    price: "",
    quantity: "", 
    description: "",
    min_stock_level: "2",
  });

  // LOGJIKA E SAKTË PËR VALUTËN DINAMIKE
  useEffect(() => {
    if (aboutCompany?.currency) {
      const c = aboutCompany.currency.toUpperCase();
      if (c === 'USD') setCurrencySymbol('$');
      else if (c === 'EUR') setCurrencySymbol('€');
      else if (c === 'ALL') setCurrencySymbol('L');
      else if (c === 'GBP') setCurrencySymbol('£');
      else setCurrencySymbol(aboutCompany.currency);
    }
  }, [aboutCompany]);

  useEffect(() => {
    setAdjustmentData(prev => ({ ...prev, reason: prev.type === "IN" ? t.newSupply : t.sale }));
    if (!editingProduct) {
      setFormData(prev => ({ ...prev, category: prev.category === translations.en.equipment || prev.category === translations.sq.equipment ? t.equipment : prev.category }));
    }
  }, [language]);

  const getStandardCategory = (cat: string) => {
    if (!cat) return 'UNKNOWN';
    const c = cat.toLowerCase();
    if (c === 'pajisje' || c === 'equipment') return 'EQUIPMENT';
    if (c === 'softuer' || c === 'software') return 'SOFTWARE';
    if (c === 'aksesorë' || c === 'accessories') return 'ACCESSORIES';
    return cat;
  };

  const displayCategory = (stdCat: string) => {
    if (stdCat === 'EQUIPMENT') return t.equipment;
    if (stdCat === 'SOFTWARE') return t.software;
    if (stdCat === 'ACCESSORIES') return t.accessories;
    return stdCat;
  };

  const triggerStockNotification = (name: string, quantity: number, minLevel: number) => {
    if (quantity === 0) {
      addNotification(t.alertEmpty(name.toUpperCase()));
    } else if (quantity <= minLevel) {
      addNotification(t.alertCritical(name.toUpperCase(), quantity));
    } else {
      addNotification(t.alertUpdated(name.toUpperCase(), quantity));
    }
  };

  const generateAIDescription = async () => {
    if (!formData.name) return alert(t.errorNoName);
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: formData.name, category: formData.category, lang: language }),
      });
      const data = await res.json();
      if (data.description) setFormData((prev) => ({ ...prev, description: data.description }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    const stdCat = getStandardCategory(product.category);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: displayCategory(stdCat),
      price: product.price?.toString() || "",
      quantity: product.quantity?.toString() || "", 
      description: product.description || "",
      min_stock_level: product.min_stock_level?.toString() || "2",
    });
    setIsModalOpen(true);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const quantityChange = parseInt(adjustmentData.quantity);
    const currentStock = Number(adjustingProduct.quantity) || 0;

    if (isNaN(quantityChange) || quantityChange <= 0) {
      setErrorModal({ show: true, message: t.errorQty });
      return;
    }

    if (adjustmentData.type === "OUT") {
      if (currentStock <= 0) {
        setErrorModal({ 
          show: true, 
          message: language === 'en' ? "Stock is completely empty!" : "Stoku është plotësisht i zbrazët!" 
        });
        return;
      }
      if (quantityChange > currentStock) {
        setErrorModal({ 
          show: true, 
          message: language === 'en' 
            ? `Insufficient stock. You only have ${currentStock} units available.` 
            : `Stok i pamjaftueshëm. Ju keni vetëm ${currentStock} njësi në gjendje.` 
        });
        return;
      }
    }

    const finalStock = Math.max(0, adjustmentData.type === "IN" ? currentStock + quantityChange : currentStock - quantityChange);

    recordMovement.mutate(
      { product_id: adjustingProduct.id, type: adjustmentData.type as "IN" | "OUT", quantity: quantityChange, reason: adjustmentData.reason },
      {
        onSuccess: () => {
          updateMutation.mutate({ id: adjustingProduct.id, updates: { quantity: finalStock } }, {
            onSuccess: () => {
              triggerStockNotification(adjustingProduct.name, finalStock, adjustingProduct.min_stock_level);
              setIsAdjustmentModalOpen(false);
              setAdjustmentData({ type: userRole === 'admin' ? "IN" : "OUT", quantity: "", reason: userRole === 'admin' ? t.newSupply : t.sale });
            },
            onError: (error: any) => {
              setErrorModal({ show: true, message: error.message });
            }
          });
        },
        onError: (error: any) => {
          setErrorModal({ show: true, message: error.message });
        }
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      min_stock_level: parseInt(formData.min_stock_level) || 0,
      description: formData.description,
      category: formData.category,
    };

    if (editingProduct) {
      updateMutation.mutate(
        { id: editingProduct.id, updates: productData },
        { onSuccess: () => { 
          setIsModalOpen(false); 
          setEditingProduct(null);
          triggerStockNotification(productData.name, productData.quantity, productData.min_stock_level);
        } }
      );
    } else {
      createMutation.mutate(productData as any, {
        onSuccess: () => {
          setIsModalOpen(false);
          setFormData({ name: "", sku: "", category: t.equipment, price: "", quantity: "", description: "", min_stock_level: "2" });
          addNotification(t.productAdded(productData.name.toUpperCase()));
        },
      });
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      const productToDelete = products.find((p: any) => p.id === deleteId);
      deleteMutation.mutate(deleteId, {
        onSuccess: () => { 
          setDeleteConfirmOpen(false); 
          setDeleteId(null); 
          addNotification(t.productDeleted(productToDelete?.name?.toUpperCase() || ''));
        },
      });
    }
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const stdCat = getStandardCategory(p.category);
    const matchesCategory = categoryFilter === "ALL" || stdCat === categoryFilter;
    const matchesLowStock = showLowStockOnly ? Number(p.quantity) <= Number(p.min_stock_level) : true;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const uniqueCategories = [...new Set(products.map((p: any) => getStandardCategory(p.category)))];

  const handleTypeChange = (newType: "IN" | "OUT") => {
    setAdjustmentData({
      ...adjustmentData,
      type: newType,
      reason: newType === "IN" ? t.newSupply : t.sale,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 italic relative min-h-screen font-medium">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {t.inventory} <span className="text-red-600">{t.stock}</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">{t.subtitle}</p>
        </div>
        
        {userRole === 'admin' && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: "", sku: "", category: dbCategories[0]?.name || t.equipment, price: "", quantity: "", description: "", min_stock_level: "2" });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-red-600/30 active:scale-95 border-2 border-red-600"
          >
            <Plus size={20} strokeWidth={3} /> {t.addProduct}
          </button>
        )}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-3 bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 w-full relative z-10">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-14 pr-12 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-red-600/5 focus:border-red-300 font-bold text-slate-800 transition-all placeholder:text-slate-400 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-red-600 transition-colors">
              <X size={18} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-shrink-0 w-full sm:w-56 group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <LayoutGrid className="text-slate-400 group-focus-within:text-red-600 transition-colors" size={18} />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-red-600/5 focus:border-red-300 font-black text-slate-700 uppercase text-[10px] tracking-widest transition-all appearance-none cursor-pointer shadow-inner"
            >
              <option value="ALL">{t.all}</option>
              {uniqueCategories.map((cat: any) => (
                <option key={cat} value={cat}>{displayCategory(cat)}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
              <ChevronDown className="text-slate-400 group-focus-within:text-red-600 transition-transform duration-300 group-focus-within:-rotate-180" size={16} strokeWidth={3} />
            </div>
          </div>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`relative overflow-hidden flex-shrink-0 w-full sm:w-auto px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all duration-300 border-2 ${
              showLowStockOnly ? "bg-red-50 border-red-100 text-red-600" : "bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <AlertCircle size={18} className={`transition-transform duration-300 ${showLowStockOnly ? 'scale-110 text-red-600' : 'text-slate-400'}`} strokeWidth={showLowStockOnly ? 3 : 2} /> 
            <span className="relative z-10">{showLowStockOnly ? t.showAll : t.lowStock}</span>
            {showLowStockOnly && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative z-0 mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableProdSku}</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableCategory}</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tablePrice}</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableStock}</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableAIPred}</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-600 mb-4" size={32} />
                    <span className="font-black text-slate-300 uppercase tracking-[0.3em] text-xs">{t.loading}</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Package size={24} className="text-slate-300" />
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-xs">{t.noProducts}</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const status = getStockStatus(p.id, p.quantity, p.min_stock_level);
                  const isLowStock = p.quantity <= p.min_stock_level;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all group italic font-medium">
                      <td className="p-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-100 transition-all shadow-sm">
                            <Package size={20} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase text-sm group-hover:text-red-600 transition-colors">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 px-8">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {displayCategory(getStandardCategory(p.category))}
                        </span>
                      </td>

                      {/* ÇMIMI ME VALUTË DINAMIKE */}
                      <td className="p-6 px-8">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold">{currencySymbol}</span>
                          <span className="text-xs font-black text-slate-700">{p.price ? Number(p.price).toFixed(2) : "0.00"}</span>
                        </div>
                      </td>

                      <td className="p-6 px-6">
                        {isLowStock ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-black text-xs animate-pulse shadow-sm">
                            <AlertTriangle size={14} strokeWidth={3} />
                            <span>{p.quantity} {t.pcs}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-xs shadow-sm">
                            <CheckCircle size={14} strokeWidth={3} />
                            <span>{p.quantity} {t.pcs}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-6 px-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-sm border ${
                          status.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 
                          status.color === 'orange' ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                           <BrainCircuit size={14} />
                           {status.message}
                        </div>
                      </td>
                      <td className="p-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setAdjustingProduct(p); setAdjustmentData({ type: userRole === 'admin' ? 'IN' : 'OUT', quantity: '', reason: userRole === 'admin' ? t.newSupply : t.sale }); setIsAdjustmentModalOpen(true); }} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group/btn" title={t.newStock}>
                            <ArrowUpDown size={16} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          {userRole === 'admin' && (
                            <>
                              <button onClick={() => { setSelectedProductIdForHistory(p.id); setSelectedProductName(p.name); }} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm group/btn" title={t.historyTitle}>
                                <History size={16} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                              </button>
                              <button onClick={() => openEditModal(p)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm group/btn" title={t.edit}>
                                <Edit3 size={16} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                              </button>
                              <button onClick={() => { setDeleteId(p.id); setDeleteConfirmOpen(true); }} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm group/btn" title={t.deleteTitle}>
                                <Trash2 size={16} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL HISTORIKU */}
      {selectedProductIdForHistory && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[120] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1a1a1a] p-8 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><History className="text-red-600" /> {t.historyTitle}</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedProductName}</p>
              </div>
              <button onClick={() => setSelectedProductIdForHistory(null)} className="bg-white/5 p-3 rounded-2xl hover:bg-red-600 transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {isLoadingMovements ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-red-600" /></div> : movements.length === 0 ? <div className="p-20 text-center font-black text-slate-300 uppercase text-xs tracking-widest">{t.noMovements}</div> : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100 pb-2">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">{t.date}</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">{t.type}</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">{t.qty}</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">{t.reason}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {movements.map((m: any) => (
                      <tr key={m.id}>
                        <td className="py-4 text-xs font-bold text-slate-500">{new Date(m.created_at).toLocaleDateString()}</td>
                        <td className="py-4">
                          {m.type?.toUpperCase() === "IN" ? <span className="text-emerald-600 text-[10px] font-black flex items-center gap-1"><ArrowUpRight size={12} /> {t.in}</span> : <span className="text-red-600 text-[10px] font-black flex items-center gap-1"><ArrowDownRight size={12} /> {t.out}</span>}
                        </td>
                        <td className={`py-4 font-black ${m.type?.toUpperCase() === "IN" ? "text-emerald-600" : "text-red-600"}`}>{m.quantity} {t.pcs}</td>
                        <td className="py-4 text-[10px] font-bold uppercase text-slate-400 italic">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTIMI I STOKUT */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[130] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1a1a1a] p-8 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><ArrowUpDown className="text-emerald-500" /> {t.newStock}</h2>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="bg-white/5 p-3 rounded-2xl hover:bg-red-600 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="p-8 space-y-6">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                {userRole === 'admin' && (
                  <button type="button" onClick={() => handleTypeChange("IN")} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${adjustmentData.type === "IN" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"}`}>{t.inPlus}</button>
                )}
                <button type="button" onClick={() => handleTypeChange("OUT")} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${adjustmentData.type === "OUT" ? "bg-white text-red-600 shadow-sm" : "text-slate-400"}`}>{t.outMinus}</button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">{t.qty}</label>
                <input required type="number" min="1" placeholder="0" value={adjustmentData.quantity} onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-black text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">{t.reason}</label>
                <input required type="text" value={adjustmentData.reason} onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-slate-900" />
              </div>
              <button type="submit" disabled={recordMovement.isPending} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-red-600 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                {recordMovement.isPending ? <Loader2 className="animate-spin" /> : t.update}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SHTIM / EDITIM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-6 sm:p-8 flex justify-between items-center text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute -right-5 -top-10 text-white/5 rotate-12 pointer-events-none">
                <Package size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                  {editingProduct ? <Edit3 className="text-red-500" size={24} /> : <Plus className="text-red-500" size={24} />} 
                  {editingProduct ? t.edit : t.add} Produkt
                </h2>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1.5">{t.stockDetails}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-red-600 hover:text-white transition-all relative z-10 group">
                <X size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 overflow-y-auto scrollbar-hide bg-white flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Type size={12} className="text-slate-300" /> {t.name}
                  </label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-bold text-slate-800 transition-all shadow-inner text-sm" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-300" /> SKU (KODI)
                  </label>
                  <input required type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-bold text-slate-800 transition-all shadow-inner uppercase text-sm" 
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlignLeft size={12} className="text-slate-300" /> {t.desc}
                    </label>
                    <button type="button" onClick={generateAIDescription} disabled={isGeneratingAI} className="text-[9px] flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 disabled:opacity-50">
                      {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                      {isGeneratingAI ? "Menduar..." : "AI Text"}
                    </button>
                  </div>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-medium italic text-slate-600 transition-all resize-none shadow-inner text-sm" 
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <LayoutGrid size={12} className="text-slate-300" /> {t.category}
                  </label>
                  <div className="relative group">
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-black uppercase text-[11px] tracking-widest text-slate-700 transition-all appearance-none cursor-pointer shadow-inner">
                      {dbCategories.length > 0 ? (
                        dbCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))
                      ) : (
                        <>
                          <option value={t.equipment}>{t.equipment}</option>
                          <option value={t.software}>{t.software}</option>
                          <option value={t.accessories}>{t.accessories}</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-red-600 transition-transform duration-300 group-focus-within:-rotate-180" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign size={12} className="text-slate-300" /> {t.price}
                    </label>
                    <div className="relative">
                      {/* SIMBOLI I VALUTËS DINAMIKE */}
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">{currencySymbol}</span>
                      <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                        className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-black text-slate-800 transition-all shadow-inner text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Hash size={12} className="text-slate-300" /> {t.qty}
                    </label>
                    <input required type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-red-600/10 focus:border-red-300 font-black text-slate-800 transition-all shadow-inner text-sm" 
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 mt-1 bg-red-50/50 p-4 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={14} strokeWidth={3} /> {t.manualLimit}
                    </label>
                    <p className="text-[9px] font-bold text-red-400/80 uppercase tracking-widest">Njofto kur sasia zbret poshtë këtij limiti.</p>
                  </div>
                  <input required type="number" min="0" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })} className="w-full sm:w-24 px-4 py-2.5 bg-white border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-400 font-black text-lg text-red-600 transition-all shadow-inner text-center" />
                </div>
              </div>
              <div className="pt-6 mt-auto">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-slate-900 transition-all duration-300 uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_4px_20px_rgb(220,38,38,0.3)] hover:shadow-xl active:translate-y-0 disabled:opacity-70 disabled:hover:bg-red-600">
                  {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="animate-spin" size={20} /> Duke u ruajtur...</> : <><CheckCircle size={20} strokeWidth={3} /> {t.save}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6">
            <AlertTriangle className="text-red-600 mx-auto" size={40} />
            <h3 className="text-2xl font-black uppercase">{t.deleteTitle}</h3>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">{t.yesDelete}</button>
              <button onClick={() => setDeleteConfirmOpen(false)} className="bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
              <AlertCircle className="text-red-600" size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">{language === 'en' ? "Action Denied" : "Veprim i Refuzuar"}</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8 italic">{errorModal.message}</p>
            <button onClick={() => setErrorModal({ show: false, message: "" })} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95">
              {language === 'en' ? "I Understand" : "E Kuptova"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}