import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ studentCount: 0, teacherCount: 0, classCount: 0, majorCount: 0 });
  const [loading, setLoading] = useState(true);

  // Notification Broadcast Modal States
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nMessage, setNMessage] = useState('');

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

  const handleSendBroadcast = async () => {
    if (!nTitle || !nMessage) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin thông báo.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/admin/notifications/broadcast`, { title: nTitle, message: nMessage });
      if (res.data.success) {
        Alert.alert('Thành công', 'Đã gửi thông báo cho toàn bộ người dùng.');
        setNotifyModalVisible(false);
        setNTitle(''); setNMessage('');
      }
    } catch (error) {
       Alert.alert('Lỗi', 'Gửi thông báo thất bại.');
    }
  };

  const displayStats = [
    { title: 'Tổng Sinh Viên', count: stats.studentCount, icon: 'person.2.fill', color: '#E3F2FD' },
    { title: 'Giảng Viên', count: stats.teacherCount, icon: 'person.fill', color: '#E8F5E9' },
    { title: 'Lớp Học', count: stats.classCount, icon: 'book.fill', color: '#FFF3E0' },
    { title: 'Ngành Học', count: stats.majorCount, icon: 'list.bullet.indent', color: '#F3E5F5' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng Admin!</Text>
            <Text style={styles.emailText}>{user?.email || 'admin@educonnect.vn'}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.statsGrid}>
          {displayStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
              <IconSymbol name={stat.icon as any} size={28} color="#333" style={{marginBottom: 8}} />
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Chức Năng Gần Đây</Text>
      
      <View style={styles.quickAccessGrid}>
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push('/admin/documents')}>
          <IconSymbol name={"folder.fill" as any} size={32} color="#D32F2F" style={{ marginBottom: 8 }} />
          <Text style={styles.gridActionText}>Quản Lý File</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push('/(admin-tabs)/schedules')}>
          <IconSymbol name={"calendar" as any} size={32} color="#1565C0" style={{ marginBottom: 8 }} />
          <Text style={styles.gridActionText}>Lịch Học</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push('/(admin-tabs)/exams')}>
          <IconSymbol name={"calendar.fill" as any} size={32} color="#D32F2F" style={{ marginBottom: 8 }} />
          <Text style={styles.gridActionText}>Lịch Thi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push('/admin/posts')}>
          <IconSymbol name={"doc.text.fill" as any} size={32} color="#D32F2F" style={{ marginBottom: 8 }} />
          <Text style={styles.gridActionText}>Bài Viết</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.gridActionBtn} onPress={() => router.push('/admin/notifications')}>
          <IconSymbol name={"bell.fill" as any} size={32} color="#D32F2F" style={{ marginBottom: 8 }} />
          <Text style={styles.gridActionText}>Thông Báo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => setNotifyModalVisible(true)}>
        <Text style={styles.actionText}>📣 Gửi Thông Báo Toàn Trường</Text>
      </TouchableOpacity>

      {/* Modal Broadcast */}
      <Modal visible={notifyModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Phát Bản Tin Toàn Trường</Text>
            <TextInput style={styles.input} placeholder="Tiêu đề thông báo..." value={nTitle} onChangeText={setNTitle} />
            <TextInput style={[styles.input, {height: 80}]} multiline placeholder="Nội dung thông báo..." value={nMessage} onChangeText={setNMessage} />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setNotifyModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleSendBroadcast}>
                <Text style={styles.btnText}>Gửi đi</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: Platform.OS === 'ios' ? 100 : 40 
  },
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
  miniLogoutText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' },

  // Modal Styles
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', maxHeight: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Grid Styles
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridActionBtn: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridActionIcon: { fontSize: 28, marginBottom: 8 },
  gridActionText: { fontSize: 14, color: '#444', fontWeight: '600' },
});
