import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, ScrollView, Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminClassesScreen() {
  const [activeTab, setActiveTab] = useState<'classes' | 'majors'>('classes');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Class States
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('');
  const [majorId, setMajorId] = useState('');

  // Major States
  const [majorCode, setMajorCode] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [majorsList, setMajorsList] = useState([]);
  const [majorDropdownVisible, setMajorDropdownVisible] = useState(false);
  const [majorFilter, setMajorFilter] = useState('');

  useEffect(() => {
    fetchData();
    if (activeTab === 'classes') fetchMajors();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'classes' ? 'classes' : 'majors';
      const res = await axios.get(`${API_URL}/admin/${endpoint}`);
      if (res.data && res.data.success) {
        setDataList(res.data.data);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối Backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/majors`);
      if (res.data && res.data.success) {
        setMajorsList(res.data.data);
      }
    } catch (e) {
      console.log('Lỗi fetch majors dropdown');
    }
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setSelectedId(item.id);
    if (activeTab === 'classes') {
      setName(item.name);
      setCohort(item.cohort.toString());
      setMajorId(item.major_id ? item.major_id.toString() : '');
    } else {
      setName(item.name);
      setMajorCode(item.code);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const endpoint = activeTab === 'classes' ? 'classes' : 'majors';
      const payload = activeTab === 'classes' 
        ? { name, major_id: parseInt(majorId), cohort: parseInt(cohort) }
        : { name, code: majorCode };

      if (!name || (activeTab === 'classes' && (!cohort || !majorId)) || (activeTab === 'majors' && !majorCode)) {
         Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.'); return;
      }

      if (isEditing && selectedId) {
        await axios.put(`${API_URL}/admin/${endpoint}/${selectedId}`, payload);
        Alert.alert('Thành công', 'Cập nhật hoàn tất!');
      } else {
        await axios.post(`${API_URL}/admin/${endpoint}`, payload);
        Alert.alert('Thành công', 'Thêm mới thành công!');
      }
      closeModal();
      fetchData();
    } catch (err) {
      Alert.alert('Lỗi', 'Thao tác thất bại.');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedId(null);
    setName(''); setCohort(''); setMajorId(''); setMajorCode('');
    setMajorFilter('');
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Xác Nhận Xóa',
      `Xóa ${activeTab === 'classes' ? 'lớp' : 'ngành'} ${title}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', style: 'destructive', 
          onPress: async () => {
             try {
               const endpoint = activeTab === 'classes' ? 'classes' : 'majors';
               await axios.delete(`${API_URL}/admin/${endpoint}/${id}`);
               fetchData();
             } catch (e) { Alert.alert('Lỗi', 'Xóa thất bại.'); }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} onLongPress={() => handleDelete(item.id, item.name)}>
      <Text style={styles.cardName}>{item.name}</Text>
      {activeTab === 'classes' ? (
        <>
          <Text style={styles.cardSub}>Khóa học: <Text style={{fontWeight: 'bold'}}>{item.cohort}</Text></Text>
          <Text style={styles.cardSub}>Ngành: <Text style={{fontWeight: 'bold', color: '#B71C1C'}}>{item.major_name ? `${item.major_name} (${item.major_code})` : 'Chưa gán'}</Text></Text>
         </>
      ) : (
        <Text style={styles.cardSub}>Mã ngành: <Text style={{fontWeight: 'bold'}}>{item.code}</Text></Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'classes' && styles.tabBtnActive]} onPress={() => setActiveTab('classes')}>
          <Text style={[styles.tabBtnText, activeTab === 'classes' && styles.tabBtnTextActive]}>Lớp Học</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'majors' && styles.tabBtnActive]} onPress={() => setActiveTab('majors')}>
          <Text style={[styles.tabBtnText, activeTab === 'majors' && styles.tabBtnTextActive]}>Khoa/Ngành</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={dataList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Trống</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Cập Nhật' : 'Thêm Mới'} {activeTab === 'classes' ? 'Lớp' : 'Khoa/Ngành'}</Text>
            
            <TextInput style={styles.input} placeholder="Tên gọi" value={name} onChangeText={setName} />
            {activeTab === 'classes' ? (
              <>
                <TextInput style={styles.input} placeholder="Khóa học (Ví dụ: 16)" keyboardType="numeric" value={cohort} onChangeText={setCohort} />
                
                {/* Custom Picker Giả lập */}
                <TouchableOpacity style={styles.inputPicker} onPress={() => setMajorDropdownVisible(!majorDropdownVisible)}>
                  <Text style={{color: majorId ? '#000' : '#888'}}>
                    {majorId ? (majorsList.find((m: any) => m.id.toString() === majorId) as any)?.name || 'Khoa/Ngành gán' : 'Chọn Khoa/Ngành'}
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
                    <ScrollView nestedScrollEnabled style={{maxHeight: 150}}>
                      {majorsList.filter((m: any) => m.name.toLowerCase().includes(majorFilter.toLowerCase())).map((m: any) => (
                        <TouchableOpacity key={m.id} style={styles.dropdownItem} onPress={() => { setMajorId(m.id.toString()); setMajorDropdownVisible(false); }}>
                          <Text style={{fontSize: 14}}>{m.name} ({m.code})</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            ) : (
                <TextInput style={styles.input} placeholder="Mã Ngành (Ví dụ: AT)" value={majorCode} onChangeText={setMajorCode} />
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={closeModal}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleSave}>
                <Text style={styles.btnText}>{isEditing ? 'Cập nhật' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => { setIsEditing(false); setModalVisible(true); }}>
         <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  tabHeader: { flexDirection: 'row', backgroundColor: '#FEF1F1', borderBottomWidth: 1, borderBottomColor: '#F5D3D3' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#B71C1C' },
  tabBtnText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  tabBtnTextActive: { color: '#B71C1C' },
  
  card: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  cardName: { fontSize: 17, fontWeight: 'bold', color: '#D32F2F' },
  cardSub: { fontSize: 14, color: '#555', marginTop: 4 },
  fab: {
    position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 80 : 20,
    backgroundColor: '#D32F2F', width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }
  },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  
  // Modal Styles
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Picker Styles
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#F9F9F9', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }
});
