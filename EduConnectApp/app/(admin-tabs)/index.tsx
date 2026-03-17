import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ studentCount: 0, teacherCount: 0, classCount: 0, majorCount: 0 });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn có muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => { logout(); router.replace('/'); } }
    ]);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/stats`);
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi lấy stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = [
    { title: 'Tổng Sinh Viên', count: stats.studentCount, icon: '👥', color: '#E3F2FD' },
    { title: 'Giảng Viên', count: stats.teacherCount, icon: '👨‍🏫', color: '#E8F5E9' },
    { title: 'Lớp Học', count: stats.classCount, icon: '🏫', color: '#FFF3E0' },
    { title: 'Ngành Học', count: stats.majorCount, icon: '🎓', color: '#F3E5F5' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng Admin!</Text>
            <Text style={styles.emailText}>{user?.email || 'admin@educonnect.vn'}</Text>
          </View>
          <TouchableOpacity style={styles.miniLogout} onPress={handleLogout}>
             <Text style={styles.miniLogoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.statsGrid}>
          {displayStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Chức Năng Gần Đây</Text>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>📁 Quản Lý File / Tài Liệu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionText}>🔔 Gửi Thông Báo Toàn Trường</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerBox: { padding: 20, backgroundColor: '#D32F2F', paddingBottom: 40 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  emailText: { fontSize: 14, color: '#FFD54F', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '46%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statCount: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 13, color: '#666', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingHorizontal: 20, marginTop: 10, marginBottom: 12 },
  actionBtn: {
    marginHorizontal: 20,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  actionText: { fontSize: 15, color: '#444', fontWeight: '500' },
  miniLogout: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFF', borderRadius: 6 },
  miniLogoutText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' }
});
