"use client";

import { useState, useEffect, Fragment } from "react";
import {
  UserPlus,
  Trash2,
  Loader2,
  User,
  Mail,
  Lock,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase"; // Sigurohu që path-i është i saktë
import { Dialog, Transition } from "@headlessui/react";

type ToastType = "success" | "error" | "warning";

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: ToastType }[]
  >([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // MARRIM ADMININ AKTUAL
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // FILTROJMË VETËM STAFF-IN E KËTIJ ADMINI
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "staff")
        .eq("admin_id", user.id); // KY ËSHTË FILTRI KRITIK

      if (error) throw error;
      if (data) {
        setStaff(
          data.map((m) => ({
            id: m.id,
            full_name: `${m.first_name || ""} ${m.last_name || ""}`.trim(),
            email: m.email,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      showToast("Gabim gjatë ngarkimit të listës", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // MARRIM ID E ADMINIT PËR TA PASUAR TE API
    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, adminId: user?.id }),
      });

      const result = await res.json();
      if (res.ok) {
        setFormData({ email: "", password: "", fullName: "" });
        await fetchStaff();
        showToast("Stafi u shtua me sukses!");
      } else {
        showToast(result.error || "Gabim gjatë shtimit", "error");
      }
    } catch {
      showToast("Ndodhi një gabim", "error");
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    // Një konfirmim i thjeshtë para fshirjes
    if (
      !window.confirm(`A jeni të sigurt që dëshironi të fshini stafin ${name}?`)
    )
      return;

    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok) {
        setStaff(staff.filter((m) => m.id !== id));
        showToast("Përdoruesi u fshi me sukses!");
      } else {
        showToast(`Gabim: ${result.error}`, "error");
      }
    } catch {
      showToast("Gabim gjatë fshirjes", "error");
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/admin/staff?id=${userToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStaff(staff.filter((m) => m.id !== userToDelete.id));
        showToast("Përdoruesi u fshi me sukses!");
      } else {
        showToast("Gabim gjatë fshirjes", "error");
      }
    } catch {
      showToast("Gabim sistemi", "error");
    }

    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // --- Hapet Modali për Edit ---
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name,
      email: user.email,
      password: "",
    }); // Password-i mbetet bosh për siguri
    setIsEditModalOpen(true);
  };

  // --- Mbyllet Modali për Edit ---
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  // --- Ruhen ndryshimet e Edit-it ---
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Për të ndryshuar email/password, duhet të përdorim API (service_role)
      // por emri mund të ndryshojë direkt nga profiles (client auth)
      // Ne do t'i dërgojmë të gjitha te API për t'i menaxhuar në mënyrë të sigurt.

      const res = await fetch("/api/admin/staff", {
        method: "PATCH", // Ose PUT, sipas dëshirës
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          ...editFormData,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        showToast("Të dhënat u përditësuan me sukses!");
        closeEditModal();
        await fetchStaff(); // Rifreskojmë listën
      } else {
        showToast(`Gabim: ${result.error}`, "error");
      }
    } catch {
      showToast("Gabim gjatë përditësimit", "error");
    }
    setIsUpdating(false);
  };

  // --- Komponenti i Toast-it ---
  const Toast = ({ message, type }: { message: string; type: ToastType }) => {
    const icons = {
      success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
      error: <AlertCircle className="w-6 h-6 text-rose-500" />,
      warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    };
    const styles = {
      success: "border-emerald-100 bg-emerald-50 text-emerald-900",
      error: "border-rose-100 bg-rose-50 text-rose-900",
      warning: "border-amber-100 bg-amber-50 text-amber-900",
    };

    return (
      <div
        className={`flex items-center gap-4 p-5 rounded-3xl border shadow-lg animate-in slide-in-from-right-full ${styles[type]}`}
      >
        {icons[type]}
        <div className="flex-1">
          <p className="font-bold text-base">
            {type === "success"
              ? "Sukses!"
              : type === "error"
                ? "Gabim!"
                : "Kujdes!"}
          </p>
          <p className="text-sm font-medium opacity-90">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Container për Toasts (fixed poshtë djathtas) */}
      <div className="fixed bottom-8 right-8 z-50 space-y-4 w-96 max-w-full">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* SEKSIONI I FORMËS (Tani më kompakt) */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <UserPlus size={22} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
            Shto Anëtar Stafi
          </h1>
        </div>

        <form
          onSubmit={handleCreateStaff}
          className="grid grid-cols-1 md:grid-cols-4 gap-5"
        >
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
              Emri i Plotë
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                placeholder="Psh. Filan Fisteku"
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-red-300 outline-none transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                value={formData.fullName}
              />
            </div>
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
              Email Adresa
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                type="email"
                placeholder="email@shembull.com"
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-red-300 outline-none transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                value={formData.email}
              />
            </div>
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
              Fjalëkalimi
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-red-300 outline-none transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                value={formData.password}
              />
            </div>
          </div>
          <div className="md:col-span-1 self-end">
            <button
              disabled={isCreating}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-red-100 disabled:opacity-60"
            >
              {isCreating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={19} /> Shto Staf
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SEKSIONI I TABELËS (Tani më i pastër) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/70">
            <tr>
              <th className="p-6 pl-8 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Anëtari
              </th>
              <th className="p-6 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Email
              </th>
              <th className="p-6 pr-8 text-[11px] font-bold uppercase text-slate-500 tracking-wider text-right">
                Veprime
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-red-600 w-8 h-8" />
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                      Duke ngarkuar listën...
                    </span>
                  </div>
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-16 text-center text-slate-400 font-medium italic"
                >
                  Nuk u gjet asnjë anëtar stafi.
                </td>
              </tr>
            ) : (
              staff.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-6 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg">
                        {m.full_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800 text-base">
                        {m.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                      <Mail size={15} />
                      {m.email}
                    </div>
                  </td>
                  <td className="p-6 pr-8 text-right flex justify-end gap-3.5">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      title="Ndrysho"
                    >
                      <Pencil size={19} /> {/* IKONA E RE EDIT */}
                    </button>
                    <button
                      onClick={() => openDeleteModal(m.id, m.full_name)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Fshi"
                    >
                      <Trash2 size={19} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALI PËR EDIT (I ri dhe profesional) --- */}
      <Transition show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeEditModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[2.5rem] bg-white p-10 text-left align-middle shadow-2xl border border-slate-100 transition-all space-y-8">
                  {/* Header-i i Modalit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                        <Pencil size={24} />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-2xl font-black uppercase tracking-tighter text-slate-800"
                        >
                          Ndrysho Të Dhënat e Stafit
                        </Dialog.Title>
                        <p className="text-slate-500 font-medium">
                          Përditëso profilin e {editingUser?.full_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeEditModal}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-100 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Forma e Modalit */}
                  <form onSubmit={handleUpdateStaff} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
                          Emri i Plotë
                        </label>
                        <input
                          required
                          value={editFormData.fullName}
                          placeholder="Filan Fisteku"
                          className="w-full p-4.5 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-blue-300 outline-none transition-all"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              fullName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 col-span-1">
                        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
                          Email Adresa
                        </label>
                        <input
                          required
                          type="email"
                          value={editFormData.email}
                          placeholder="email@shembull.com"
                          className="w-full p-4.5 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-blue-300 outline-none transition-all"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 col-span-1">
                        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">
                          Fjalëkalimi i Ri
                        </label>
                        <input
                          type="password"
                          value={editFormData.password}
                          placeholder="Lëre bosh nëse nuk dëshiron ta ndryshosh"
                          className="w-full p-4.5 bg-slate-50 rounded-2xl border border-slate-100 font-semibold focus:ring-2 focus:ring-blue-300 outline-none transition-all"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Butonat e Modalit */}
                    <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-7 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Anulo
                      </button>
                      <button
                        disabled={isUpdating}
                        className="px-10 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isUpdating ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          "Ruaj Ndryshimet"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
              <Dialog.Title className="text-xl font-black text-slate-800">
                Fshi anëtarin?
              </Dialog.Title>
              <p className="text-slate-500 mt-2 text-sm">
                A jeni të sigurt që dëshironi të fshini{" "}
                <strong>{userToDelete?.name}</strong>? Ky veprim është i
                pakthyeshëm.
              </p>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                >
                  Anulo
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
                >
                  Fshi
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
