import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminGroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('custom_group'); 

  // Sub-Modal Member States
  const [viewMembers, setViewMembers] = useState(false); 
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk Multi-Select States
  const [viewAvailableUsers, setViewAvailableUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (viewMembers && selectedId) {
      fetchMembers();
    }
  }, [viewMembers, selectedId]);

  useEffect(() => {
    if (viewAvailableUsers && selectedId) {
      fetchAvailableUsers();
    }
  }, [viewAvailableUsers, selectedId]);

  const fetchAvailableUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      if (res.data && res.data.success) {
         // Filter out already members
         const memberIds = members.map(m => m.user_id);
         const list = res.data.data.filter((u: any) => !memberIds.includes(u.id));
         setAllUsers(list);
      }
    } catch (error) {
       console.error(error);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/groups`);
      if (res.data && res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách nhóm chat.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/groups/${selectedId}/members`);
      if (res.data.success) {
         setMembers(res.data.data);
      }
    } catch (error) {
       console.error(error);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setGroupType('custom_group');
    setViewMembers(false);
    setViewAvailableUsers(false);
    setSelectedUserIds([]);
    setMembers([]);
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setName(item.name);
    setGroupType(item.group_type || 'custom_group');
    setViewMembers(false);
    setViewAvailableUsers(false);
    setSelectedUserIds([]);
    setMembers([]);
    setModalVisible(true);
  };

  const handleSaveGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm.');
      return;
    }

    try {
      if (isEditing && selectedId) {
        await axios.put(`${API_URL}/admin/groups/${selectedId}`, { name, group_type: groupType });
        Alert.alert('Thành công', 'Cập nhật nhóm thành công.');
      } else {
        await axios.post(`${API_URL}/admin/groups`, { name, group_type: groupType });
        Alert.alert('Thành công', 'Tạo nhóm thành công.');
      }
      setModalVisible(false);
      fetchGroups();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      Alert.alert('Lỗi', 'Gửi thông tin thất bại: ' + msg);
    }
  };

  const handleAddMember = async () => {
      if (!newMemberEmail.trim()) return;
      try {
        setActionLoading(true);
        const res = await axios.post(`${API_URL}/admin/groups/${selectedId}/members`, { email: newMemberEmail });
        if (res.data.success) {
           Alert.alert('Thành công', 'Đã thêm thành viên.');
           setNewMemberEmail('');
           fetchMembers();
           fetchGroups(); 
        }
      } catch (error: any) {
         Alert.alert('Lỗi', error.response?.data?.message || 'Thêm thành viên thất bại.');
      } finally {
         setActionLoading(false);
      }
  };

  const handleDeleteMember = async (userId: number) => {
      try {
         const res = await axios.delete(`${API_URL}/admin/groups/${selectedId}/members/${userId}`);
         if (res.data.success) {
            fetchMembers();
            fetchGroups(); 
         }
      } catch (error) {
         Alert.alert('Lỗi', 'Xóa thành viên thất bại.');
      }
  };

  const handleBulkAddMembers = async () => {
      if (selectedUserIds.length === 0) {
         Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 thành viên.');
         return;
      }
      try {
        setActionLoading(true);
        const res = await axios.post(`${API_URL}/admin/groups/${selectedId}/members/bulk`, { userIds: selectedUserIds });
        if (res.data.success) {
           Alert.alert('Thành công', 'Đã thêm thành viên hàng loạt.');
           setSelectedUserIds([]);
           setViewAvailableUsers(false); // Back to member list
           fetchMembers();
           fetchGroups(); 
        }
      } catch (error: any) {
         Alert.alert('Lỗi', error.response?.data?.message || 'Thao tác thất bại.');
      } finally {
         setActionLoading(false);
      }
  };

  const handleDeleteGroup = (id: number, gName: string) => {
    Alert.alert('Xác Nhận Xóa', `Bạn có chắc chắn muốn xóa nhóm "${gName}"? Thao tác này sẽ xóa toàn bộ tin nhắn liên quan.`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', style: 'destructive', 
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/groups/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa nhóm chat.');
              fetchGroups();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa nhóm chat.');
          }
        } 
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View style={{flex: 1}}>
          <Text style={styles.groupName}>👥 {item.name}</Text>
          <Text style={styles.groupSub}>Loại: <Text style={{fontWeight: 'bold', color: '#1976D2'}}>{item.group_type.toUpperCase()}</Text></Text>
          <Text style={styles.groupCount}>Thành viên: <Text style={{color: '#D32F2F', fontWeight: 'bold'}}>{item.member_count || 0}</Text></Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteGroup(item.id, item.name)}>
           <Text style={styles.deleteBtnText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Chưa có nhóm nào</Text>}
        />
      )}

      {/* Nút FAB Thêm Mới */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
         <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Add/Edit Group */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalBackDrop}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>{viewMembers ? 'Thành Viên Nhóm' : isEditing ? 'Sửa Nhóm Chat' : 'Tạo Nhóm Chat'}</Text>
               
               {!viewMembers ? (
                  <>
                     <TextInput style={styles.input} placeholder="Tên nhóm chat... (Vd: Câu lạc bộ IT)" value={name} onChangeText={setName} />
                     
                     <Text style={{fontSize: 13, color: '#666', marginBottom: 6, marginTop: 10, alignSelf: 'flex-start'}}>Phân Loại Nhóm:</Text>
                     <View style={{flexDirection: 'row', marginBottom: 20, justifyContent: 'space-around', width: '100%'}}>
                        {[
                          { key: 'custom_group', label: 'CHUNG / TỰ DO' },
                          { key: 'class_group', label: 'LỚP HỌC' },
                          { key: 'cohort_group', label: 'KHÓA HỌC' }
                        ].map((item) => (
                            <TouchableOpacity key={item.key} 
                                style={[styles.typeBtn, groupType === item.key && styles.typeBtnActive]} 
                                onPress={() => setGroupType(item.key)}>
                                <Text style={[styles.typeBtnText, groupType === item.key && styles.typeBtnTextActive]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                     </View>

                     {isEditing && (
                        <TouchableOpacity style={styles.btnLink} onPress={() => setViewMembers(true)}>
                           <Text style={{color: '#1976D2', fontWeight: 'bold'}}>👥 Xem Danh Sách Thành Viên ({members.length})</Text>
                        </TouchableOpacity>
                     )}

                     <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16}}>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>Hủy</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleSaveGroup}><Text style={styles.btnText}>Lưu</Text></TouchableOpacity>
                     </View>
                  </>
               ) : (
                  <>
                     {!viewAvailableUsers ? (
                        <>
                           {/* BỘ LỌC THÊM THÀNH VIÊN ĐƠN LẺ */}
                           <View style={{flexDirection: 'row', width: '100%', marginBottom: 12}}>
                              <TextInput style={[styles.input, {flex: 1, marginBottom: 0, marginRight: 8}]} placeholder="Kính gửi bằng Email..." value={newMemberEmail} onChangeText={setNewMemberEmail} keyboardType="email-address" autoCapitalize="none" />
                              <TouchableOpacity style={{backgroundColor: '#D32F2F', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8}} onPress={handleAddMember} disabled={actionLoading}>
                                 <Text style={{color: '#FFF', fontWeight: 'bold'}}>+</Text>
                              </TouchableOpacity>
                           </View>

                           <TouchableOpacity style={{backgroundColor: '#E3F2FD', width: '100%', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center'}} onPress={() => setViewAvailableUsers(true)}>
                              <Text style={{color: '#1976D2', fontWeight: 'bold'}}>➕ CHỌN THÀNH VIÊN TỪ DANH SÁCH</Text>
                           </TouchableOpacity>

                           {/* DANH SÁCH THÀNH VIÊN HIỆN TẠI */}
                           <FlatList 
                              data={members}
                              keyExtractor={(m) => m.user_id.toString()}
                              style={{width: '100%', maxHeight: 220}}
                              renderItem={({item}) => (
                                 <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8}}>
                                    <View style={{flex: 1}}>
                                       <Text style={{fontWeight: 'bold', fontSize: 13}}>{item.full_name || 'Chưa cập nhật'}</Text>
                                       <Text style={{fontSize: 12, color: '#666'}}>{item.email}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteMember(item.user_id)}>
                                       <Text style={{color: '#D32F2F', fontSize: 13}}>Xóa</Text>
                                    </TouchableOpacity>
                                 </View>
                              )}
                              ListEmptyComponent={<Text style={{textAlign: 'center', color: '#888', marginTop: 10}}>Nhóm chưa có thành viên nào.</Text>}
                           />

                           <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC', width: '100%', marginTop: 16}]} onPress={() => setViewMembers(false)}>
                              <Text style={styles.btnText}>Quay Lại</Text>
                           </TouchableOpacity>
                        </>
                     ) : (
                        <>
                           <Text style={{fontSize: 14, color: '#666', marginBottom: 10}}>Chọn thành viên cần thêm ({selectedUserIds.length}):</Text>
                           
                           <FlatList 
                              data={allUsers}
                              keyExtractor={(u) => u.id.toString()}
                              style={{width: '100%', maxHeight: 240}}
                              renderItem={({item}) => {
                                 const isSelected = selectedUserIds.includes(item.id);
                                 return (
                                    <TouchableOpacity 
                                       style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE'}}
                                       onPress={() => {
                                          if (isSelected) {
                                             setSelectedUserIds(selectedUserIds.filter(id => id !== item.id));
                                          } else {
                                             setSelectedUserIds([...selectedUserIds, item.id]);
                                          }
                                       }}
                                    >
                                       <View style={{flex: 1}}>
                                          <Text style={{fontWeight: 'bold', fontSize: 13, color: isSelected ? '#D32F2F' : '#333'}}>{item.email}</Text>
                                          <Text style={{fontSize: 12, color: '#666'}}>Vai trò: {item.role}</Text>
                                       </View>
                                       <View style={{width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D32F2F', backgroundColor: isSelected ? '#D32F2F' : '#FFF', justifyContent: 'center', alignItems: 'center'}}>
                                          {isSelected && <Text style={{color: '#FFF', fontSize: 11, fontWeight: 'bold'}}>✓</Text>}
                                       </View>
                                    </TouchableOpacity>
                                 );
                              }}
                              ListEmptyComponent={<Text style={{textAlign: 'center', color: '#888', marginTop: 20}}>Hết sinh viên khả dụng.</Text>}
                           />

                           <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16}}>
                              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setViewAvailableUsers(false)}>
                                 <Text style={styles.btnText}>Hủy</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleBulkAddMembers} disabled={actionLoading}>
                                 <Text style={styles.btnText}>Thêm đã chọn</Text>
                              </TouchableOpacity>
                           </View>
                        </>
                     )}
                  </>
               )}
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  card: { backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 12 },
  groupName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  groupSub: { fontSize: 13, color: '#666', marginTop: 4 },
  groupCount: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteBtn: { backgroundColor: '#FFEAEA', borderWidth: 1, borderColor: '#D32F2F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteBtnText: { color: '#D32F2F', fontSize: 13, fontWeight: 'bold' },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#D32F2F', width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F' },
  input: { width: '100%', height: 48, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10 },
  
  typeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#CCC', backgroundColor: '#F9F9F9' },
  typeBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  typeBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  typeBtnTextActive: { color: '#FFF' },

  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  btnLink: { marginTop: 10, alignSelf: 'center', padding: 8 },
});
