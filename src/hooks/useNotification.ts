import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // 1. Leximi i njoftimeve nga Databaza
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Gabim te Supabase Fetch:", error.message);
        return [];
      }
      return data || [];
    }
  });

  // 2. Logjika Real-time (Sync automatik me databazën)
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications') // Emër i përditësuar për të shmangur konfliktet
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        (payload) => {
          console.log("Realtime event u kap:", payload); // Për debugging
          // Kur ndodh çdo lloj ndryshimi (Insert/Update/Delete), rifresko të dhënat
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Supabase Realtime: Lidhja për njoftimet është AKTIVE!");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 3. Funksioni për të shtuar një njoftim të ri (p.sh. nga AI ose Inventory)
  const addNotification = async (message: string) => {
    const { error } = await supabase
      .from('notifications')
      .insert([{ 
        message, 
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Gabim gjatë shtimit të njoftimit:", error.message);
    } else {
      // RREGULLIMI KRYESOR: Rifresko zilen MENJËHERË sapo shtohet njoftimi!
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // 4. Funksioni për të fshirë njoftimin (Butoni X)
  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Gabim gjatë fshirjes:", error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // 5. Funksioni për të hequr "pikën e kuqe" (Shëno si i lexuar)
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error("Gabim gjatë shënimit si i lexuar:", error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // Llogaritja e njoftimeve që nuk janë lexuar ende
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return { 
    notifications, 
    unreadCount, 
    addNotification, 
    deleteNotification, 
    markAsRead 
  };
}