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
  Platform,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../../src/services/authService';

type SemesterItem = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

const formatDate = (raw?: string) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const toIsoDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function AdminSemestersScreen() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/semesters`);
      if (res.data?.success) setSemesters(res.data.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách học kỳ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setStartDate(null);
    setEndDate(null);
    setModalVisible(true);
  };

  const openEditModal = (item: SemesterItem) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setName(item.name);
    setStartDate(item.start_date ? new Date(item.start_date) : null);
    setEndDate(item.end_date ? new Date(item.end_date) : null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedId(null);
    setName('');
    setStartDate(null);
    setEndDate(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!name.trim() || !startDate || !endDate) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên học kỳ, Ngày bắt đầu, Ngày kết thúc.');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.');
      return;
    }

    const payload = {
      name: name.trim(),
      start_date: toIsoDate(startDate),
      end_date: toIsoDate(endDate),
    };

    try {
      if (isEditing && selectedId) {
        const res = await axios.put(`${API_URL}/admin/semesters/${selectedId}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Update failed');
        Alert.alert('Thành công', 'Cập nhật học kỳ thành công.');
      } else {
        const res = await axios.post(`${API_URL}/admin/semesters`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Create failed');
        Alert.alert('Thành công', 'Thêm học kỳ thành công.');
      }
      closeModal();
      fetchSemesters();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = (item: SemesterItem) => {
    Alert.alert('Xác nhận xóa', `Xóa học kỳ "${item.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/semesters/${item.id}`);
            if (!res.data?.success) throw new Error(res.data?.message || 'Delete failed');
            fetchSemesters();
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Xóa thất bại.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SemesterItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.badge}>ID: {item.id}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelSm}>Bắt đầu:</Text>
        <Text style={styles.valueSm}>{formatDate(item.start_date)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelSm}>Kết thúc:</Text>
        <Text style={styles.valueSm}>{formatDate(item.end_date)}</Text>
      </View>
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
            data={semesters}
            keyExtractor={(s) => s.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có học kỳ nào.</Text>}
          />
        )}

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>
                      {isEditing ? 'CẬP NHẬT HỌC KỲ' : 'THÊM HỌC KỲ'}
                    </Text>

                    <Text style={styles.label}>Tên học kỳ</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="VD: Học kỳ 1 - Năm 2025"
                      value={name}
                      onChangeText={setName}
                    />

                    <Text style={styles.label}>Ngày bắt đầu</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={{ color: startDate ? '#222' : '#999', fontSize: 14 }}>
                        {startDate ? formatDate(toIsoDate(startDate)) : 'Chọn ngày bắt đầu'}
                      </Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                      <DateTimePicker
                        value={startDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                          setShowStartPicker(Platform.OS === 'ios');
                          if (event.type === 'set' && selected) {
                            setStartDate(selected);
                          }
                        }}
                      />
                    )}

                    <Text style={styles.label}>Ngày kết thúc</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={{ color: endDate ? '#222' : '#999', fontSize: 14 }}>
                        {endDate ? formatDate(toIsoDate(endDate)) : 'Chọn ngày kết thúc'}
                      </Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={endDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                          setShowEndPicker(Platform.OS === 'ios');
                          if (event.type === 'set' && selected) {
                            setEndDate(selected);
                          }
                        }}
                      />
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
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
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  labelSm: { fontSize: 13, color: '#777', width: 80 },
  valueSm: { fontSize: 13, color: '#333', fontWeight: '600' },
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
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 8, fontSize: 14, justifyContent: 'center', minHeight: 44 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
