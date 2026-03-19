import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [status, setStatus] = useState<'active' | 'banned'>('active');

  // Student Profile Profile states
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');

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

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setEmail(item.email);
    setRole(item.role);
    setStatus(item.status);
    setFullName(item.full_name || '');
    setStudentCode(item.student_code || '');
    setModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setEmail(''); setPassword(''); setRole('student'); setStatus('active');
    setFullName(''); setStudentCode('');
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!email || (!isEditing && !password)) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ email/mật khẩu.');
      return;
    }
    try {
      if (isEditing && selectedId) {
        // Cập nhật User Base (Role / Status)
        await axios.put(`${API_URL}/admin/users/${selectedId}`, { role, status });
        
        // Nếu là Sinh Viên, cập nhật thêm Profile (Full Name)
        if (role === 'student' && fullName) {
           await axios.put(`${API_URL}/admin/students/${selectedId}`, { full_name: fullName });
        }
        Alert.alert('Thành công', 'Cập nhật tài khoản hoàn tất.');
      } else {
        // Gọi API Đăng ký tài khoản mới 
        const res = await axios.post(`${API_URL}/auth/register`, { 
           email, password, role, fullName, studentCode 
        });
        if (res.data.success) { Alert.alert('Thành công', 'Đã tạo tài khoản mới.'); }
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err) {
      Alert.alert('Lỗi', 'Thao tác thất bại.');
    }
  };

  const handleDeleteUser = (id: string, mail: string) => {
    Alert.alert('Xác Nhận Xóa', `Bạn thực sự muốn xóa tài khoản ${mail}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
             await axios.delete(`${API_URL}/admin/users/${id}`);
             fetchUsers();
          } catch (e) { Alert.alert('Lỗi', 'Xóa người dùng thất bại.'); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => openEditModal(item)} onLongPress={() => handleDeleteUser(item.id, item.email)}>
      <Text style={styles.userName}>{item.full_name || 'Chưa Tạo Profile'}</Text>
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

      {/* Modal CRUD User */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản Mới'}</Text>
            
            <TextInput style={styles.input} placeholder="Email..." keyboardType="email-address" value={email} onChangeText={setEmail} editable={!isEditing} />
            {!isEditing && <TextInput style={styles.input} placeholder="Password..." secureTextEntry value={password} onChangeText={setPassword} />}

            {/* Thêm Name / Mã cho Sinh Viên */}
            {role === 'student' && (
              <>
                <TextInput style={styles.input} placeholder="Họ và Tên..." value={fullName} onChangeText={setFullName} />
                {!isEditing && <TextInput style={styles.input} placeholder="Mã Sinh Viên (SVxxx)..." value={studentCode} onChangeText={setStudentCode} />}
              </>
            )}

            <Text style={{fontSize: 14, color: '#444', marginBottom: 6, fontWeight: 'bold'}}>Vai trò (Role):</Text>
            <View style={{flexDirection: 'row', marginBottom: 12}}>
              {['student', 'teacher', 'admin'].map((r) => (
                <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r as any)}>
                  <Text style={[styles.roleBtnText, role === r && {color: '#FFF'}]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isEditing && (
              <>
                <Text style={{fontSize: 14, color: '#444', marginBottom: 6, fontWeight: 'bold'}}>Trạng thái:</Text>
                <View style={{flexDirection: 'row', marginBottom: 16}}>
                  {['active', 'banned'].map((s) => (
                    <TouchableOpacity key={s} style={[styles.roleBtn, status === s && styles.roleBtnActive]} onPress={() => setStatus(s as any)}>
                      <Text style={[styles.roleBtnText, status === s && {color: '#FFF'}]}>{s.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleSaveUser}>
                <Text style={styles.btnText}>{isEditing ? 'Cập nhật' : 'Thêm mới'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
         <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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

  // Modal Styles
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  roleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#F0F0F0' },
  roleBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  roleBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#D32F2F', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' }
});
