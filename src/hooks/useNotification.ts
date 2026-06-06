import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [targetAdminId, setTargetAdminId] = useState<string | null>(null);

  // 1. Gjejmë automatikisht se cilës kompani i përket ky përdorues (Admin ose Staff)
  useEffect(() => {
    let isMounted = true; // Parandalon thirrjet e dyfishta paralele

    const fetchAdminId = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        if (!isMounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, admin_id')
          .eq('id', user.id)
          .single();

        if (!isMounted) return;

        if (profile && profile.role === 'staff' && profile.admin_id) {
          setTargetAdminId(profile.admin_id);
        } else {
          setTargetAdminId(user.id);
        }
      } catch (err) {
        console.error("Gabim gjatë vërtetimit të përdoruesit:", err);
      }
    };

    fetchAdminId();

    return () => {
      isMounted = false; // Pastron thirrjen kur komponenti unmount-ohet ose rifreskohet
    };
  }, []);

  // 2. Leximi i njoftimeve TË FILTRUARA vetëm për këtë kompani
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', targetAdminId],
    enabled: !!targetAdminId, 
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('admin_id', targetAdminId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Gabim te Supabase Fetch:", error.message);
        return [];
      }
      return data || [];
    }
  });

  // 3. Logjika Real-time TË FILTRUARA vetëm për këtë kompani
  useEffect(() => {
    if (!targetAdminId) return;

    const channel = supabase
      .channel(`notifications-${targetAdminId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `admin_id=eq.${targetAdminId}`
        }, 
        (payload) => {
          console.log("Realtime event u kap për këtë kompani:", payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', targetAdminId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetAdminId, queryClient]);

  // 4. Funksioni për të shtuar një njoftim të ri
  const addNotification = async (message: string) => {
    if (!targetAdminId) return;

    const { error } = await supabase
      .from('notifications')
      .insert([{ 
        message, 
        is_read: false,
        admin_id: targetAdminId,
        created_at: new Date().toISOString()
      }]);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', targetAdminId] });
    }
  };

  // 5. Funksioni për të fshirë njoftimin
  const deleteNotification = async (id: string) => {
    if (!targetAdminId) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) queryClient.invalidateQueries({ queryKey: ['notifications', targetAdminId] });
  };

  // 6. Shëno një njoftim specifik si të lexuar
  const markAsRead = async (id: string) => {
    if (!targetAdminId) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) queryClient.invalidateQueries({ queryKey: ['notifications', targetAdminId] });
  };

  // 7. Shëno të gjitha njoftimet si të lexuara
  const markAllAsRead = async () => {
    if (!targetAdminId) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .eq('admin_id', targetAdminId);

    if (!error) queryClient.invalidateQueries({ queryKey: ['notifications', targetAdminId] });
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return { 
    notifications, 
    unreadCount, 
    addNotification, 
    deleteNotification, 
    markAsRead,
    markAllAsRead 
  };
};