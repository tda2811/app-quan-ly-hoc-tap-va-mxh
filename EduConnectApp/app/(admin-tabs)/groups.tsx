import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
   const [userSearchText, setUserSearchText] = useState('');

   useFocusEffect(
      React.useCallback(() => {
         fetchGroups(groups.length > 0);
      }, [])
   );

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

   const fetchGroups = async (silent = false) => {
      try {
         if (!silent) setLoading(true);
         const res = await axios.get(`${API_URL}/admin/groups`);
         if (res.data && res.data.success) {
            setGroups(res.data.data);
         }
      } catch (err) {
         Alert.alert('Lỗi', 'Không thể lấy danh sách hội nhóm.');
      } finally {
         setLoading(false);
      }
   };

   const fetchMembers = async (groupId?: number | null) => {
      const id = groupId != null ? groupId : selectedId;
      if (!id) return;
      try {
         const res = await axios.get(`${API_URL}/admin/groups/${id}/members`);
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
      if (selectedId !== item.id) {
         setMembers([]);
      }
      setSelectedId(item.id);
      setName(item.name);
      setGroupType(item.group_type || 'custom_group');
      setViewMembers(false);
      setViewAvailableUsers(false);
      setSelectedUserIds([]);
      setModalVisible(true);
      fetchMembers(item.id);
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
            fetchGroups(true);
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
            fetchGroups(true);
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
            fetchGroups(true);
         }
      } catch (error: any) {
         Alert.alert('Lỗi', error.response?.data?.message || 'Thao tác thất bại.');
      } finally {
         setActionLoading(false);
      }
   };

   const handleDeleteGroup = (id: number, gName: string) => {
      Alert.alert('Xác Nhận Xóa', `Bạn có chắc chắn muốn xóa hội nhóm "${gName}"? Thao tác này sẽ xóa toàn bộ bài viết liên quan.`, [
         { text: 'Hủy', style: 'cancel' },
         {
            text: 'Xóa', style: 'destructive',
            onPress: async () => {
               try {
                  const res = await axios.delete(`${API_URL}/admin/groups/${id}`);
                  if (res.data.success) {
                     Alert.alert('Thành công', 'Đã xóa hội nhóm.');
                     fetchGroups(true);
                  }
               } catch (error) {
                  Alert.alert('Lỗi', 'Không thể xóa hội nhóm.');
               }
            }
         }
      ]);
   };

   const renderItem = ({ item }: { item: any }) => (
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
               <Text style={styles.groupName}>👥 {item.name}</Text>
               <Text style={styles.groupSub}>Loại: <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>{item.group_type.toUpperCase()}</Text></Text>
               <Text style={styles.groupCount}>Thành viên: <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>{item.member_count || 0}</Text></Text>
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackDrop}>
               <View style={[styles.modalContent, { height: '80%' }]}>
                  <Text style={styles.modalTitle}>{viewMembers ? 'Thành Viên Nhóm' : isEditing ? 'Sửa Hội Nhóm' : 'Tạo Hội Nhóm'}</Text>

                  {!viewMembers ? (
                     <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                        <TextInput style={styles.input} placeholder="Tên nhóm / cộng đồng... (Vd: Câu lạc bộ IT)" value={name} onChangeText={setName} />

                        <Text style={{ fontSize: 13, color: '#666', marginBottom: 6, marginTop: 10, alignSelf: 'flex-start' }}>Phân Loại Nhóm:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, width: '100%', gap: 8 }}>
                           {[
                              { key: 'custom_group', label: 'CHUNG / TỰ DO' },
                              { key: 'class_group', label: 'LỚP HỌC' },
                              { key: 'cohort_group', label: 'KHÓA HỌC' }
                           ].map((item) => (
                              <TouchableOpacity key={item.key}
                                 style={[styles.typeBtn, groupType === item.key && styles.typeBtnActive, { marginBottom: 5 }]}
                                 onPress={() => setGroupType(item.key)}>
                                 <Text style={[styles.typeBtnText, groupType === item.key && styles.typeBtnTextActive]}>{item.label}</Text>
                              </TouchableOpacity>
                           ))}
                        </View>

                        {isEditing && (
                           <TouchableOpacity style={styles.btnLink} onPress={() => setViewMembers(true)}>
                              <Text style={{ color: '#1976D2', fontWeight: 'bold' }}>👥 Xem Danh Sách Thành Viên ({members.length})</Text>
                           </TouchableOpacity>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
                           <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>Hủy</Text></TouchableOpacity>
                           <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D32F2F' }]} onPress={handleSaveGroup}><Text style={styles.btnText}>Lưu</Text></TouchableOpacity>
                        </View>
                     </ScrollView>
                  ) : (
                     <View style={{ width: '100%', flex: 1 }}>
                        {!viewAvailableUsers ? (
                           <>
                              {/* BỘ LỌC THÊM THÀNH VIÊN ĐƠN LẺ */}
                              <View style={{ flexDirection: 'row', width: '100%', marginBottom: 12 }}>
                                 <TextInput style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]} placeholder="Email..." value={newMemberEmail} onChangeText={setNewMemberEmail} keyboardType="email-address" autoCapitalize="none" />
                                 <TouchableOpacity style={{ backgroundColor: '#D32F2F', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8 }} onPress={handleAddMember} disabled={actionLoading}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>+</Text>
                                 </TouchableOpacity>
                              </View>

                              <TouchableOpacity style={{ backgroundColor: '#E3F2FD', width: '100%', padding: 10, borderRadius: 8, marginBottom: 10, alignItems: 'center' }} onPress={() => setViewAvailableUsers(true)}>
                                 <Text style={{ color: '#1976D2', fontWeight: 'bold' }}>➕ CHỌN TỪ DANH SÁCH</Text>
                              </TouchableOpacity>

                              {/* DANH SÁCH THÀNH VIÊN HIỆN TẠI (KHÔNG CÒN LỒNG SCROLLVIEW) */}
                              <FlatList
                                 data={members}
                                 keyExtractor={(m) => m.user_id.toString()}
                                 style={{ flex: 1 }}
                                 renderItem={({ item }) => (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 }}>
                                       <View style={{ flex: 1 }}>
                                          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{item.full_name || 'Chưa cập nhật'}</Text>
                                          <Text style={{ fontSize: 11, color: '#666' }}>{item.email}</Text>
                                       </View>
                                       <TouchableOpacity onPress={() => handleDeleteMember(item.user_id)}>
                                          <Text style={{ color: '#D32F2F', fontSize: 13 }}>Xóa</Text>
                                       </TouchableOpacity>
                                    </View>
                                 )}
                                 ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>Nhóm trống.</Text>}
                              />

                              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC', width: '100%', marginTop: 16, flex: 0 }]} onPress={() => setViewMembers(false)}>
                                 <Text style={styles.btnText}>Quay Lại</Text>
                              </TouchableOpacity>
                           </>
                        ) : (
                           <>
                              <TextInput
                                 style={styles.input}
                                 placeholder="🔍 Tìm tên hoặc email..."
                                 value={userSearchText}
                                 onChangeText={setUserSearchText}
                              />
                              <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>Chọn thành viên ({selectedUserIds.length}):</Text>

                              <FlatList
                                 style={{ flex: 1 }}
                                 data={allUsers.filter((u: any) => (u.full_name || u.email || '').toLowerCase().includes(userSearchText.toLowerCase()))}
                                 keyExtractor={(item) => item.id.toString()}
                                 renderItem={({ item }) => {
                                    const isSelected = selectedUserIds.includes(item.id);
                                    return (
                                       <TouchableOpacity
                                          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' }}
                                          onPress={() => {
                                             if (isSelected) {
                                                setSelectedUserIds(selectedUserIds.filter(id => id !== item.id));
                                             } else {
                                                setSelectedUserIds([...selectedUserIds, item.id]);
                                             }
                                          }}
                                       >
                                          <View style={{ flex: 1 }}>
                                             <Text style={{ fontWeight: 'bold', fontSize: 13, color: isSelected ? '#D32F2F' : '#333' }}>{item.email}</Text>
                                             <Text style={{ fontSize: 12, color: '#666' }}>Vai trò: {item.role}</Text>
                                          </View>
                                          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D32F2F', backgroundColor: isSelected ? '#D32F2F' : '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                                             {isSelected && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                                          </View>
                                       </TouchableOpacity>
                                    );
                                 }}
                                 ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Không thấy sinh viên.</Text>}
                              />

                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16, flex: 0 }}>
                                 <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={() => setViewAvailableUsers(false)}>
                                    <Text style={styles.btnText}>Hủy</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D32F2F' }]} onPress={handleBulkAddMembers} disabled={actionLoading}>
                                    <Text style={styles.btnText}>Thêm đã chọn</Text>
                                 </TouchableOpacity>
                              </View>
                           </>
                        )}
                     </View>
                  )}
               </View>
            </KeyboardAvoidingView>
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

   fab: { position: 'absolute', bottom: 90, right: 25, backgroundColor: '#D32F2F', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4.65, shadowOffset: { width: 0, height: 4 } },
   fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold' },

   modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
   modalContent: { backgroundColor: '#FFF', width: '92%', padding: 20, borderRadius: 16, elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
   modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#D32F2F', textAlign: 'center' },
   input: { width: '100%', height: 48, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, marginBottom: 10 },

   typeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#CCC', backgroundColor: '#F9F9F9' },
   typeBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
   typeBtnText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
   typeBtnTextActive: { color: '#FFF' },

   modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
   btnText: { color: '#FFF', fontWeight: 'bold' },
   btnLink: { marginTop: 10, alignSelf: 'center', padding: 8 },
});
