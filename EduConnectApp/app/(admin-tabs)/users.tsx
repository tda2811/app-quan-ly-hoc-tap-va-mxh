import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, 
  TouchableOpacity, Modal, TextInput, Platform, Keyboard,
  TouchableWithoutFeedback, ScrollView
} from 'react-native';
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
  const [classId, setClassId] = useState('');
  const [majorId, setMajorId] = useState('');

  // Dropdown lists
  const [classList, setClassList] = useState([]);
  const [majorList, setMajorList] = useState([]);
  const [classDropdownVisible, setClassDropdownVisible] = useState(false);
  const [majorDropdownVisible, setMajorDropdownVisible] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchClasses();
    fetchMajors();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/classes`);
      if (res.data.success) setClassList(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchMajors = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/majors`);
      if (res.data.success) setMajorList(res.data.data);
    } catch (e) { console.error(e); }
  };

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
    setClassId(item.class_id ? item.class_id.toString() : '');
    setMajorId(item.major_id ? item.major_id.toString() : '');
    setClassDropdownVisible(false);
    setMajorDropdownVisible(false);
    setClassFilter('');
    setMajorFilter('');
    setModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setEmail(''); setPassword(''); setRole('student'); setStatus('active');
    setFullName(''); setStudentCode('');
    setClassId(''); setMajorId('');
    setClassDropdownVisible(false);
    setMajorDropdownVisible(false);
    setClassFilter('');
    setMajorFilter('');
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    Keyboard.dismiss();
    if (!email || (!isEditing && !password)) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ email/mật khẩu.');
      return;
    }
    try {
      if (isEditing && selectedId) {
        if (role === 'student') {
           const studentPayload = { 
             full_name: fullName, 
             class_id: classId ? parseInt(classId) : null,
             major_id: majorId ? parseInt(majorId) : null
           };
           await axios.put(`${API_URL}/admin/students/${selectedId}`, studentPayload);
        }
        Alert.alert('Thành công', 'Cập nhật tài khoản hoàn tất.');
      } else {
        const res = await axios.post(`${API_URL}/auth/register`, { 
           email, password, role, fullName, studentCode,
           classId: classId ? parseInt(classId) : null,
           majorId: majorId ? parseInt(majorId) : null
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackDrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>{isEditing ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản Mới'}</Text>
                
                <TextInput style={styles.input} placeholder="Email..." keyboardType="email-address" value={email} onChangeText={setEmail} editable={!isEditing} />
                {!isEditing && <TextInput style={styles.input} placeholder="Password..." secureTextEntry value={password} onChangeText={setPassword} />}

                {role === 'student' && (
                  <View style={{zIndex: 1000}}>
                    <TextInput style={styles.input} placeholder="Họ và Tên..." value={fullName} onChangeText={setFullName} />
                    {!isEditing && <TextInput style={styles.input} placeholder="Mã Sinh Viên (SVxxx)..." value={studentCode} onChangeText={setStudentCode} />}
                    
                    {/* Class Selector */}
                    <TouchableOpacity style={styles.inputPicker} onPress={() => setClassDropdownVisible(!classDropdownVisible)}>
                      <Text style={{color: classId ? '#000' : '#888'}}>
                        {classId ? (classList.find((c: any) => c.id.toString() === classId) as any)?.name || 'Lớp' : 'Chọn Lớp Học'}
                      </Text>
                    </TouchableOpacity>
                    {classDropdownVisible && (
                      <View style={styles.dropdownOverlay}>
                        <TextInput 
                          style={styles.dropdownSearch} 
                          placeholder="Tìm lớp..." 
                          value={classFilter}
                          onChangeText={setClassFilter}
                        />
                        <ScrollView 
                          nestedScrollEnabled 
                          style={{maxHeight: 120}}
                        >
                          {classList.filter((c: any) => c.name.toLowerCase().includes(classFilter.toLowerCase())).map((item: any) => (
                            <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => { setClassId(item.id.toString()); setClassDropdownVisible(false); }}>
                              <Text style={{fontSize: 14}}>{item.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Major Selector */}
                    <TouchableOpacity style={styles.inputPicker} onPress={() => setMajorDropdownVisible(!majorDropdownVisible)}>
                      <Text style={{color: majorId ? '#000' : '#888'}}>
                        {majorId ? (majorList.find((m: any) => m.id.toString() === majorId) as any)?.name || 'Ngành' : 'Chọn Khoa/Ngành'}
                      </Text>
                    </TouchableOpacity>
                    {majorDropdownVisible && (
                      <View style={styles.dropdownOverlay}>
                        <TextInput 
                          style={styles.dropdownSearch} 
                          placeholder="Tìm khoa/ngành..." 
                          value={majorFilter}
                          onChangeText={setMajorFilter}
                        />
                        <ScrollView 
                          nestedScrollEnabled 
                          style={{maxHeight: 120}}
                        >
                          {majorList.filter((m: any) => m.name.toLowerCase().includes(majorFilter.toLowerCase())).map((item: any) => (
                            <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => { setMajorId(item.id.toString()); setMajorDropdownVisible(false); }}>
                              <Text style={{fontSize: 14}}>{item.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
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
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', maxHeight: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  roleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#F0F0F0' },
  roleBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  roleBtnText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  fab: { position: 'absolute', bottom: 90, right: 25, backgroundColor: '#D32F2F', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4.65, shadowOffset: { width: 0, height: 4 } },
  fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold' },
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#F9F9F9', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }
});
