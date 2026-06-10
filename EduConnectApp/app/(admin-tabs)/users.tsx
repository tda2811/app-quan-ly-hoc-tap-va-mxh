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

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [listClassFilter, setListClassFilter] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [status, setStatus] = useState<'active' | 'banned'>('active');

  // Student Profile states
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
    setEmail(''); setPassword(''); setRole(activeTab); setStatus('active');
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
    if ((role === 'teacher' || role === 'student') && !fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Họ và Tên.');
      return;
    }
    try {
      if (isEditing && selectedId) {
        if (role === 'student') {
           const studentPayload = { 
             full_name: fullName.trim(), 
             class_id: classId ? parseInt(classId) : null,
             major_id: majorId ? parseInt(majorId) : null
           };
           await axios.put(`${API_URL}/admin/students/${selectedId}`, studentPayload);
        }
        if (role === 'teacher') {
           await axios.put(`${API_URL}/admin/teachers/${selectedId}`, { full_name: fullName.trim() });
        }
        await axios.put(`${API_URL}/admin/users/${selectedId}`, { role, status });
        Alert.alert('Thành công', 'Cập nhật tài khoản hoàn tất.');
      } else {
        const res = await axios.post(`${API_URL}/auth/register`, { 
           email, password, role, fullName: fullName.trim(), studentCode,
           classId: classId ? parseInt(classId) : null,
           majorId: majorId ? parseInt(majorId) : null
        });
        if (res.data.success) { Alert.alert('Thành công', 'Đã tạo tài khoản mới.'); }
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thao tác thất bại.';
      Alert.alert('Lỗi', msg);
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

  const filteredUsers = users.filter((u: any) => {
    if (u.role !== activeTab) return false;
    if (activeTab === 'student') {
      if (listClassFilter && u.class_id?.toString() !== listClassFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.full_name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchCode = (u.student_code || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCode) return false;
      }
    } else if (activeTab === 'teacher') {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.full_name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
    }
    return true;
  });

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => openEditModal(item)} onLongPress={() => handleDeleteUser(item.id, item.email)}>
      <Text style={styles.userName}>{item.full_name || 'Chưa Tạo Profile'}</Text>
      <Text style={styles.userEmail}>📧 {item.email}</Text>
      {item.role === 'student' && item.student_code && (
        <Text style={styles.userCode}>Mã SV: {item.student_code}</Text>
      )}
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
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'student' && styles.tabBtnActive]} onPress={() => { setActiveTab('student'); setSearchQuery(''); }}>
          <Text style={[styles.tabBtnText, activeTab === 'student' && styles.tabBtnTextActive]}>Sinh Viên</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'teacher' && styles.tabBtnActive]} onPress={() => { setActiveTab('teacher'); setSearchQuery(''); }}>
          <Text style={[styles.tabBtnText, activeTab === 'teacher' && styles.tabBtnTextActive]}>Giảng Viên</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'admin' && styles.tabBtnActive]} onPress={() => { setActiveTab('admin'); setSearchQuery(''); }}>
          <Text style={[styles.tabBtnText, activeTab === 'admin' && styles.tabBtnTextActive]}>Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {(activeTab === 'student' || activeTab === 'teacher') && (
        <View style={styles.filterContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder={activeTab === 'student' ? "Tìm tên, email, mã SV..." : "Tìm tên, email..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {activeTab === 'student' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classFilterScroll}>
              <TouchableOpacity 
                style={[styles.filterChip, listClassFilter === null && styles.filterChipActive]}
                onPress={() => setListClassFilter(null)}
              >
                <Text style={[styles.filterChipText, listClassFilter === null && styles.filterChipTextActive]}>Tất cả lớp</Text>
              </TouchableOpacity>
              {classList.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, listClassFilter === c.id.toString() && styles.filterChipActive]}
                  onPress={() => setListClassFilter(c.id.toString())}
                >
                  <Text style={[styles.filterChipText, listClassFilter === c.id.toString() && styles.filterChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Không tìm thấy tài khoản nào.</Text>}
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

                {/* Họ và Tên – hiện cho cả student lẫn teacher */}
                {(role === 'student' || role === 'teacher') && (
                  <TextInput
                    style={styles.input}
                    placeholder="Họ và Tên..."
                    value={fullName}
                    onChangeText={setFullName}
                  />
                )}

                {role === 'student' && (
                  <View style={{zIndex: 1000}}>
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
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#D32F2F' },
  tabBtnText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  tabBtnTextActive: { color: '#D32F2F' },

  filterContainer: { backgroundColor: '#FFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  searchInput: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginBottom: 8 },
  classFilterScroll: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  filterChipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF', fontWeight: 'bold' },

  userCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },
  userCode: { fontSize: 13, color: '#444', marginTop: 2, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', marginTop: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  badge_student: { backgroundColor: '#1976D2' },
  badge_teacher: { backgroundColor: '#388E3C' },
  badge_admin: { backgroundColor: '#E91E63' },
  badge_active: { backgroundColor: '#4CAF50' },
  badge_banned: { backgroundColor: '#D32F2F' },
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
  dropdownSearch: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  inputNarrow: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 }
});
