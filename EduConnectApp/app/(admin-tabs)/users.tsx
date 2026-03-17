import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/users`);
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối Backend để lấy danh sách User.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (item: any) => {
    Alert.alert(
      'Quản Lý Thành Viên',
      `Người dùng: ${item.email}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: item.role === 'student' ? 'Nâng lên Giảng Viên' : 'Xuống Sinh Viên', 
          onPress: () => updateUser(item.id, { role: item.role === 'student' ? 'teacher' : 'student', status: item.status }) 
        },
        { 
          text: item.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa', 
          style: item.status === 'active' ? 'destructive' : 'default',
          onPress: () => updateUser(item.id, { role: item.role, status: item.status === 'active' ? 'banned' : 'active' }) 
        },
      ]
    );
  };

  const updateUser = async (id: string, payload: any) => {
    try {
      const res = await axios.put(`${API_URL}/admin/users/${id}`, payload);
      if (res.data.success) {
        Alert.alert('Thành công', 'Cập nhật tài khoản hoàn tất.');
        fetchUsers();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật người dùng.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserAction(item)}>
      <Text style={styles.userName}>{item.full_name || 'Học Viên Chưa Tạo Profile'}</Text>
      <Text style={styles.userEmail}>📧 {item.email}</Text>
      <View style={styles.badgeRow}>
         <View style={[styles.badge, (styles as any)[`badge_${item.role}`]]}>
             <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
         </View>
         <View style={[styles.badge, (styles as any)[`badge_${item.status}`]]}>
             <Text style={styles.badgeText}>{item.status}</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Trống</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  userCard: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 1,
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  
  badge_student: { backgroundColor: '#2196F3' },
  badge_teacher: { backgroundColor: '#FF9800' },
  badge_admin: { backgroundColor: '#E91E63' },
  badge_active: { backgroundColor: '#4CAF50' },
  badge_banned: { backgroundColor: '#F44336' },
});
