import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

export default function AdminClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // States for new class
  const [name, setName] = useState('');
  const [cohort, setCohort] = useState('');
  const [majorId, setMajorId] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/classes`);
      if (res.data && res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối Backend để lấy danh sách Lớp.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!name || !cohort || !majorId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/admin/classes`, {
        name,
        major_id: parseInt(majorId),
        cohort: parseInt(cohort)
      });
      if (res.data.success) {
        Alert.alert('Thành công', 'Đã thêm lớp học mới!');
        setModalVisible(false);
        setName(''); setCohort(''); setMajorId('');
        fetchClasses();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể thêm lớp học mới.');
    }
  };

  const handleDeleteClass = (id: number, name: string) => {
    Alert.alert(
      'Xóa Lớp Học',
      `Bạn có chắc chắn muốn xóa lớp ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const res = await axios.delete(`${API_URL}/admin/classes/${id}`);
              if (res.data.success) {
                Alert.alert('Thành công', 'Đã xóa lớp học.');
                fetchClasses();
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa lớp học.');
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onLongPress={() => handleDeleteClass(item.id, item.name)}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardSub}>Khóa học (Cohort): <Text style={{fontWeight: 'bold'}}>{item.cohort}</Text></Text>
      <Text style={styles.cardSub}>Major ID: {item.major_id || 'Chưa gán'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Danh Sách Lớp Học</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" />
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>Chưa có lớp nào</Text>}
        />
      )}
      {/* Modal Thêm Lớp */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm Lớp Học Mới</Text>
            
            <TextInput style={styles.input} placeholder="Tên Lớp (Ví dụ: 12A1, AT16...)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Khóa học (Ví dụ: 16)" keyboardType="numeric" value={cohort} onChangeText={setCohort} />
            <TextInput style={styles.input} placeholder="Major ID (Tạm thời nhập ID)" keyboardType="numeric" value={majorId} onChangeText={setMajorId} />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleAddClass}>
                <Text style={styles.btnText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
         <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', padding: 16, backgroundColor: '#FEF1F1', color: '#B71C1C' },
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
    position: 'absolute', right: 20, bottom: 20,
    backgroundColor: '#D32F2F', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 24, elevation: 3, shadowOpacity: 0.2
  },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  
  // Modal Styles
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
