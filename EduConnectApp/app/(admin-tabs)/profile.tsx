import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const confirmLogout = () => {
    setModalVisible(false);
    setTimeout(() => {
      logout();
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    }, 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.email ? user.email[0].toUpperCase() : 'A'}</Text>
      </View>
      <Text style={styles.title}>Bảng Điểm Admin</Text>
      <Text style={styles.subtitle}>{user?.email || 'admin@educonnect.vn'}</Text>

      <View style={{ width: '85%', backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', marginBottom: 40 }}>
        <Text style={{ fontWeight: 'bold', color: '#333' }}>Thông Tin Tài Khoản</Text>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Email:</Text><Text style={styles.infoVal}>{user?.email}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Role:</Text><Text style={styles.infoVal}>System Administrator</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Status:</Text><Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Active</Text></View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Đăng Xuất Admin</Text>
      </TouchableOpacity>

      {/* Modal Đăng Xuất Đẹp Mắt */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác Nhận Đăng Xuất</Text>
            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>Bạn có chắc chắn muốn rời khỏi ứng dụng giao diện Admin?</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D32F2F' }]} onPress={confirmLogout}>
                <Text style={styles.btnText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    zIndex: 100,
  },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 8 },
  infoLabel: { color: '#666', fontSize: 14 },
  infoVal: { color: '#333', fontWeight: 'bold', fontSize: 14 },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#D32F2F', textAlign: 'center' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
