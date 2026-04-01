import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/student/notifications?user_id=${user.id}`);
      if (res.data.success) setNotifs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.card, !item.is_read && styles.unreadCard]}>
      <View style={styles.iconContainer}>
        <IconSymbol name="bell.fill" size={24} color={item.is_read ? "#999" : "#B71C1C"} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.notifTitle, !item.is_read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.notifContent}>{item.content}</Text>
        <Text style={styles.timeText}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#B71C1C" style={{ marginTop: 20 }} />
      ) : notifs.length === 0 ? (
        <View style={styles.empty}>
           <IconSymbol name="bell.slash.fill" size={60} color="#DDD" />
           <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchNotifs}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  unreadCard: { backgroundColor: '#FFEBEE' },
  iconContainer: { marginRight: 15, justifyContent: 'center' },
  content: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  unreadText: { color: '#B71C1C' },
  notifContent: { fontSize: 13, color: '#666', lineHeight: 18 },
  timeText: { fontSize: 11, color: '#999', marginTop: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 15, color: '#999', fontSize: 16 }
});
