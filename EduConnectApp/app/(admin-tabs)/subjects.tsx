import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';

type SubjectItem = {
  id: number;
  subject_code: string;
  name: string;
  credit: number;
};

export default function AdminSubjectsScreen() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [credit, setCredit] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/subjects`);
      if (res.data?.success) setSubjects(res.data.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách môn học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setSubjectCode('');
    setSubjectName('');
    setCredit('');
    setModalVisible(true);
  };

  const openEditModal = (item: SubjectItem) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setSubjectCode(item.subject_code);
    setSubjectName(item.name);
    setCredit(String(item.credit ?? ''));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedId(null);
    setSubjectCode('');
    setSubjectName('');
    setCredit('');
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const creditNum = parseInt(credit);
    if (!subjectCode.trim() || !subjectName.trim() || Number.isNaN(creditNum) || creditNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập Mã môn, Tên môn và Số tín chỉ hợp lệ.');
      return;
    }

    const payload = {
      subject_code: subjectCode.trim(),
      name: subjectName.trim(),
      credit: creditNum,
    };

    try {
      if (isEditing && selectedId) {
        const res = await axios.put(`${API_URL}/admin/subjects/${selectedId}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');
        Alert.alert('Thành công', 'Cập nhật môn học thành công.');
      } else {
        const res = await axios.post(`${API_URL}/admin/subjects`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Create failed');
        Alert.alert('Thành công', 'Thêm môn học thành công.');
      }
      closeModal();
      fetchSubjects();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = (item: SubjectItem) => {
    Alert.alert('Xác nhận xóa', `Xóa môn "${item.name}" (${item.subject_code})?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/subjects/${item.id}`);
            if (!res.data?.success) throw new Error(res.data?.message || 'Delete failed');
            fetchSubjects();
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Xóa thất bại.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SubjectItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.badge}>{item.credit} TC</Text>
      </View>
      <Text style={styles.cardSub}>Mã môn: <Text style={{ fontWeight: 'bold' }}>{item.subject_code}</Text></Text>
      <Text style={styles.hint}>Nhấn để sửa • Nhấn giữ để xóa</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(s) => s.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có môn học nào.</Text>}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{isEditing ? 'CẬP NHẬT MÔN HỌC' : 'THÊM MÔN HỌC'}</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Mã môn (VD: OOP101)"
                      value={subjectCode}
                      onChangeText={setSubjectCode}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Tên môn học"
                      value={subjectName}
                      onChangeText={setSubjectName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Số tín chỉ (VD: 3)"
                      keyboardType="numeric"
                      value={credit}
                      onChangeText={setCredit}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                      <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={closeModal}>
                        <Text style={styles.btnText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#D32F2F' }]} onPress={handleSave}>
                        <Text style={styles.btnText}>{isEditing ? 'Cập nhật' : 'Thêm'}</Text>
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  card: {
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F', flex: 1, paddingRight: 10 },
  badge: { fontSize: 12, fontWeight: 'bold', color: '#1B5E20', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  cardSub: { fontSize: 13, color: '#555', marginTop: 6 },
  hint: { fontSize: 11, color: '#999', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },

  fab: {
    position: 'absolute',
    right: 25,
    bottom: 90,
    backgroundColor: '#D32F2F',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold' },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', maxHeight: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

