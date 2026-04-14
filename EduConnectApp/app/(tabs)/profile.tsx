import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const confirmLogout = () => {
    setModalVisible(false);
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.full_name ? user.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}</Text>
      </View>
      <Text style={styles.title}>{user?.full_name || 'Người Dùng'}</Text>
      <Text style={styles.subtitle}>{user?.role === 'teacher' ? '👨‍🏫 Giảng Viên' : '🎓 Sinh Viên'}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Thông Tin Tài Khoản</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoVal}>{user?.email}</Text>
        </View>

        {user?.student_code && (
           <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã SV:</Text>
              <Text style={styles.infoVal}>{user.student_code}</Text>
           </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vai trò:</Text>
          <Text style={styles.infoVal}>{user?.role === 'teacher' ? 'Giảng Viên' : 'Sinh Viên'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Đang hoạt động</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Đăng Xuất</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác Nhận Đăng Xuất</Text>
            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#B71C1C' }]} onPress={confirmLogout}>
                <Text style={styles.btnText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingBottom: Platform.OS === 'ios' ? 100 : 40 
  },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 30 },
  
  infoCard: { width: '85%', backgroundColor: '#FFF', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 30, elevation: 1 },
  infoCardTitle: { fontWeight: 'bold', color: '#B71C1C', fontSize: 16, marginBottom: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 10 },
  infoLabel: { color: '#888', fontSize: 14 },
  infoVal: { color: '#333', fontWeight: 'bold', fontSize: 14 },

  logoutBtn: {
    backgroundColor: '#FEEEEE',
    borderWidth: 1,
    borderColor: '#B71C1C',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  logoutText: { color: '#B71C1C', fontWeight: 'bold', fontSize: 16 },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', padding: 25, borderRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#B71C1C', textAlign: 'center' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
