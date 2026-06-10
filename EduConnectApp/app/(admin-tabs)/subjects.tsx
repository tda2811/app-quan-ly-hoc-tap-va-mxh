import React, { useCallback, useEffect, useState } from 'react';
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
import { Stack } from 'expo-router';

type SemesterItem = {
  id: number;
  name: string;
};

type SubjectItem = {
  id: number;
  subject_code: string;
  name: string;
  credit: number;
  semester_id: number | null;
  semester_name: string | null;
};

export default function AdminSubjectsScreen() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterSemId, setFilterSemId] = useState<number | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form fields
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [credit, setCredit] = useState('');
  const [semesterId, setSemesterId] = useState<number | null>(null);

  // Semester dropdown in modal
  const [semDropdownVisible, setSemDropdownVisible] = useState(false);
  const [semFilter, setSemFilter] = useState('');

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/semesters`);
      if (res.data?.success) setSemesters(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterSemId) params.semester_id = filterSemId;
      const res = await axios.get(`${API_URL}/admin/subjects`, { params });
      if (res.data?.success) setSubjects(res.data.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách môn học.');
    } finally {
      setLoading(false);
    }
  }, [filterSemId]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setSubjectCode('');
    setSubjectName('');
    setCredit('');
    setSemesterId(null);
    setSemDropdownVisible(false);
    setSemFilter('');
    setModalVisible(true);
  };

  const openEditModal = (item: SubjectItem) => {
    setIsEditing(true);
    setSelectedId(item.id);
    setSubjectCode(item.subject_code);
    setSubjectName(item.name);
    setCredit(String(item.credit ?? ''));
    setSemesterId(item.semester_id ?? null);
    setSemDropdownVisible(false);
    setSemFilter('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedId(null);
    setSubjectCode('');
    setSubjectName('');
    setCredit('');
    setSemesterId(null);
    setSemDropdownVisible(false);
    setSemFilter('');
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
      semester_id: semesterId ?? null,
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

  const selectedSemName = semesterId
    ? semesters.find(s => s.id === semesterId)?.name || 'Học kỳ không xác định'
    : null;

  const renderItem = ({ item }: { item: SubjectItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.badge}>{item.credit} TC</Text>
      </View>
      <Text style={styles.cardSub}>Mã môn: <Text style={{ fontWeight: 'bold' }}>{item.subject_code}</Text></Text>
      {item.semester_name ? (
        <View style={styles.semBadgeRow}>
          <View style={styles.semBadge}>
            <Text style={styles.semBadgeText}>📅 {item.semester_name}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noSemText}>Chưa gán học kỳ</Text>
      )}
      <Text style={styles.hint}>Nhấn để sửa • Nhấn giữ để xóa</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Quản Lý Môn Học', headerBackTitle: 'Trở lại' }} />

        {/* Filter theo học kỳ */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, filterSemId === null && styles.filterChipActive]}
              onPress={() => setFilterSemId(null)}
            >
              <Text style={[styles.filterChipText, filterSemId === null && styles.filterChipTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {semesters.map(sem => (
              <TouchableOpacity
                key={sem.id}
                style={[styles.filterChip, filterSemId === sem.id && styles.filterChipActive]}
                onPress={() => setFilterSemId(sem.id)}
              >
                <Text style={[styles.filterChipText, filterSemId === sem.id && styles.filterChipTextActive]}>{sem.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(s) => s.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {filterSemId
                  ? `Không có môn học nào trong học kỳ "${semesters.find(s => s.id === filterSemId)?.name}".`
                  : 'Chưa có môn học nào.'}
              </Text>
            }
          />
        )}

        {/* Modal thêm / sửa */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackDrop}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{isEditing ? 'CẬP NHẬT MÔN HỌC' : 'THÊM MÔN HỌC'}</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Mã môn (VD: OOP101) (*)"
                      value={subjectCode}
                      onChangeText={setSubjectCode}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Tên môn học (*)"
                      value={subjectName}
                      onChangeText={setSubjectName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Số tín chỉ (VD: 3) (*)"
                      keyboardType="numeric"
                      value={credit}
                      onChangeText={setCredit}
                    />

                    {/* Dropdown chọn học kỳ */}
                    <Text style={styles.fieldLabel}>Gán vào học kỳ (tùy chọn):</Text>
                    <TouchableOpacity
                      style={styles.inputPicker}
                      onPress={() => { setSemDropdownVisible(!semDropdownVisible); Keyboard.dismiss(); }}
                    >
                      <Text style={{ color: semesterId ? '#111' : '#888', fontSize: 14 }}>
                        {selectedSemName ?? '— Chưa gán học kỳ —'}
                      </Text>
                    </TouchableOpacity>

                    {semDropdownVisible && (
                      <View style={styles.dropdownBox}>
                        <TextInput
                          style={styles.dropdownSearch}
                          placeholder="Tìm học kỳ..."
                          value={semFilter}
                          onChangeText={setSemFilter}
                        />
                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 160 }}>
                          {/* Option "Không gán" */}
                          <TouchableOpacity
                            style={[styles.dropdownItem, semesterId === null && styles.dropdownItemSelected]}
                            onPress={() => { setSemesterId(null); setSemDropdownVisible(false); }}
                          >
                            <Text style={{ fontSize: 14, color: semesterId === null ? '#D32F2F' : '#333' }}>
                              — Không gán học kỳ —
                            </Text>
                            {semesterId === null && <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>✓</Text>}
                          </TouchableOpacity>
                          {semesters
                            .filter(s => s.name.toLowerCase().includes(semFilter.toLowerCase()))
                            .map(s => (
                              <TouchableOpacity
                                key={s.id}
                                style={[styles.dropdownItem, semesterId === s.id && styles.dropdownItemSelected]}
                                onPress={() => { setSemesterId(s.id); setSemDropdownVisible(false); }}
                              >
                                <Text style={{ fontSize: 14, color: semesterId === s.id ? '#D32F2F' : '#333' }}>{s.name}</Text>
                                {semesterId === s.id && <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>✓</Text>}
                              </TouchableOpacity>
                            ))
                          }
                        </ScrollView>
                      </View>
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
  container: { flex: 1, backgroundColor: '#F7F7F7' },

  filterBar: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 10 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD',
  },
  filterChipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF', fontWeight: 'bold' },

  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F', flex: 1, paddingRight: 8 },
  badge: {
    fontSize: 12, fontWeight: 'bold', color: '#1B5E20',
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  cardSub: { fontSize: 13, color: '#555', marginTop: 6 },
  semBadgeRow: { flexDirection: 'row', marginTop: 8 },
  semBadge: {
    backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#BBDEFB',
  },
  semBadgeText: { fontSize: 12, color: '#1565C0', fontWeight: '600' },
  noSemText: { fontSize: 12, color: '#BDBDBD', marginTop: 8, fontStyle: 'italic' },
  hint: { fontSize: 11, color: '#CCC', marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14, lineHeight: 22 },

  fab: {
    position: 'absolute', right: 25, bottom: 90, backgroundColor: '#D32F2F',
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 30, fontWeight: 'bold' },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '88%', maxHeight: '90%', padding: 20, borderRadius: 14, elevation: 6 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  inputPicker: {
    borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8,
    marginBottom: 8, backgroundColor: '#FAFAFA', justifyContent: 'center',
  },
  dropdownBox: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownSearch: { backgroundColor: '#F5F5F5', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownItemSelected: { backgroundColor: '#FFF8F8' },
  modalBtn: { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
