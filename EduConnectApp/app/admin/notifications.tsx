import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { Stack, useRouter } from 'expo-router';

interface NotificationItem {
  id: number | string;
  title: string;
  type: string;
  user_email?: string;
  content: string;
  created_at: string;
}

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/notifications`);
      if (res.data.success) setNotifications(res.data.data);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number | string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/notifications/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa thông báo.');
              fetchNotifications();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa thông báo.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.typeBadge}>{item.type}</Text>
      </View>
      <Text style={styles.cardDesc}>Gửi tới: {item.user_email || 'Người dùng'}</Text>
      <Text style={styles.contentPreview} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.timeText}>{new Date(item.created_at).toLocaleString('vi-VN')}</Text>
      <View style={styles.actRow}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>Xóa Thông Báo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản Lý Thông Báo', headerBackTitle: 'Trở lại' }} />
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  typeBadge: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: { color: '#666', fontSize: 13, marginBottom: 4 },
  contentPreview: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 8 },
  timeText: { fontSize: 12, color: '#888' },
  actRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 13 },
});
