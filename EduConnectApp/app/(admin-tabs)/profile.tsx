import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có chắc chắn muốn đăng xuất giao diện Admin?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/'); // Trở về màn hình Đăng Nhập ở Root (index.tsx)
          } 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
         <Text style={styles.avatarText}>A</Text>
      </View>
      <Text style={styles.title}>Hồ Sơ Admin</Text>
      <Text style={styles.subtitle}>{user?.email || 'admin@educonnect.vn'}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng Xuất Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 10, marginBottom: 40 },
  logoutBtn: {
    backgroundColor: '#FFEAEA',
    borderWidth: 1,
    borderColor: '#D32F2F',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
});
