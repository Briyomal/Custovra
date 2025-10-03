import { useState, useEffect } from 'react';
import axios from 'axios';

export const useUnreadSubmissions = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/submissions/unread/${userId}`, {
          withCredentials: true
        });
        setUnreadCount(response.data.count);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
  }, [userId]);

  const markAsRead = async () => {
    if (!userId) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/submissions/mark-as-read/${userId}`, {}, {
        withCredentials: true
      });
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    }
  };

  return { unreadCount, loading, error, markAsRead };
};