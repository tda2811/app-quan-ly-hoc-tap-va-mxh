import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduleItem {
  id: number | string;
  subject_id: number | string;
  subject_name?: string;
  semester_id?: number | null;
  semester_name?: string | null;
  teacher_ids?: string;
  teacher_email?: string;
  teacher_name?: string;
  room_name: string;
  schedule_type: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
}

// Separate Card component for List Items
const ScheduleItemCard = React.memo(({ item, onEdit, onDelete }: { item: ScheduleItem, onEdit: (item: ScheduleItem) => void, onDelete: (id: number | string) => void }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{item.subject_name}</Text>
      <Text style={[styles.typeBadge, item.schedule_type === 'practice' && { backgroundColor: '#E3F2FD', color: '#1976D2' }]}>
        {item.schedule_type === 'theory' ? 'LÝ THUYẾT' : 'THỰC HÀNH'}
      </Text>
    </View>
    <Text style={styles.cardDesc}>Học kỳ: {item.semester_name || '—'}</Text>
    <Text style={styles.cardDesc}>Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
    <Text style={styles.cardDesc}>Thời gian: {item.start_time} - {item.end_time}</Text>
    <Text style={styles.cardDesc}>Phòng: {item.room_name}</Text>
    <Text style={styles.cardDesc}>Giảng viên: {item.teacher_name || item.teacher_email || 'Chờ phân công'}</Text>
    <View style={styles.actRow}>
      <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
        <Text style={styles.editBtnText}>Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
        <Text style={styles.deleteBtnText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  </View>
));

// Separate Modal Component to isolate form state and prevent full-screen re-renders
const ScheduleModal = React.memo(({ visible, onClose, onSave, editingItem, subjectsList, teachersList, semestersList }: any) => {
  const [subjectId, setSubjectId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState('theory');
  const [roomName, setRoomName] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [subjectDropdownVisible, setSubjectDropdownVisible] = useState(false);
  const [semesterDropdownVisible, setSemesterDropdownVisible] = useState(false);
  const [teacherDropdownVisible, setTeacherDropdownVisible] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const editingItemRef = useRef(editingItem);
  const semestersListRef = useRef(semestersList);
  editingItemRef.current = editingItem;
  semestersListRef.current = semestersList;

  useEffect(() => {
    if (!visible) return;
    const item = editingItemRef.current;
    const sems = semestersListRef.current;
    if (item) {
      setSubjectId(String(item.subject_id));
      setSemesterId(item.semester_id != null ? String(item.semester_id) : '');
      setTeacherIds(item.teacher_ids ? item.teacher_ids.split(',').filter((d: any) => d) : []);
      setRoomName(item.room_name);
      setScheduleType(item.schedule_type);
      setScheduleDate(new Date(item.schedule_date));
      const stParts = item.start_time.split(':');
      const etParts = item.end_time.split(':');
      const st = new Date(); st.setHours(parseInt(stParts[0]), parseInt(stParts[1]), 0);
      const et = new Date(); et.setHours(parseInt(etParts[0]), parseInt(etParts[1]), 0);
      setStartTime(st);
      setEndTime(et);
    } else {
      setSubjectId('');
      setSemesterId(sems?.[0]?.id != null ? String(sems[0].id) : '');
      setTeacherIds([]);
      setRoomName('');
      setScheduleType('theory');
      setScheduleDate(new Date());
      setStartTime(new Date());
      setEndTime(new Date());
    }
    setSubjectFilter('');
    setSemesterFilter('');
    setTeacherFilter('');
    setSubjectDropdownVisible(false);
    setSemesterDropdownVisible(false);
    setTeacherDropdownVisible(false);
  }, [visible]);

  const toggleTeacher = (id: string) => {
    setTeacherIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleLocalSave = () => {
    if (!subjectId || !roomName || !semesterId) {
      Alert.alert('Lỗi', 'Vui lòng chọn học kỳ và nhập đầy đủ thông tin bắt buộc.');
      return;
    }
    const payload = {
      subject_id: subjectId,
      semester_id: semesterId,
      teacher_ids: teacherIds,
      room_name: roomName,
      schedule_type: scheduleType,
      schedule_date: scheduleDate.toISOString().split('T')[0],
      start_time: startTime.toTimeString().split(' ')[0],
      end_time: endTime.toTimeString().split(' ')[0],
    };
    onSave(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBackDrop}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.modalTitle, { color: '#1565C0' }]}>{editingItem ? 'Chỉnh Sửa Lịch Học' : 'Tạo Lịch Học Mới'}</Text>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity style={[styles.typeToggle, scheduleType === 'theory' && styles.typeToggleActive]} onPress={() => setScheduleType('theory')}>
                <Text style={[styles.typeToggleText, scheduleType === 'theory' && { color: '#FFF' }]}>Lý Thuyết</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeToggle, scheduleType === 'practice' && styles.typeToggleActive]} onPress={() => setScheduleType('practice')}>
                <Text style={[styles.typeToggleText, scheduleType === 'practice' && { color: '#FFF' }]}>Thực Hành</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.inputPicker} onPress={() => { setSubjectDropdownVisible(!subjectDropdownVisible); setSemesterDropdownVisible(false); }}>
              <Text style={{ color: subjectId ? '#000' : '#888' }}>
                {subjectId ? (subjectsList.find((s: any) => s.id.toString() === subjectId) as any)?.name || 'Môn học' : 'Chọn Môn học (*)'}
              </Text>
            </TouchableOpacity>

            {subjectDropdownVisible && (
              <View style={styles.dropdownOverlay}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Tìm môn học..."
                  value={subjectFilter}
                  onChangeText={setSubjectFilter}
                />
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                  {subjectsList.filter((s: any) => s.name.toLowerCase().includes(subjectFilter.toLowerCase())).map((item: any) => (
                    <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => { setSubjectId(item.id.toString()); setSubjectDropdownVisible(false); }}>
                      <Text style={{ fontSize: 14 }}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity style={styles.inputPicker} onPress={() => { setSemesterDropdownVisible(!semesterDropdownVisible); setSubjectDropdownVisible(false); setTeacherDropdownVisible(false); }}>
              <Text style={{ color: semesterId ? '#000' : '#888' }}>
                {semesterId ? (semestersList.find((x: any) => x.id.toString() === semesterId) as any)?.name || 'Học kỳ' : 'Chọn Học kỳ (*)'}
              </Text>
            </TouchableOpacity>

            {semesterDropdownVisible && (
              <View style={styles.dropdownOverlay}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Tìm học kỳ..."
                  value={semesterFilter}
                  onChangeText={setSemesterFilter}
                />
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                  {semestersList.filter((x: any) => (x.name || '').toLowerCase().includes(semesterFilter.toLowerCase())).map((item: any) => (
                    <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => { setSemesterId(item.id.toString()); setSemesterDropdownVisible(false); }}>
                      <Text style={{ fontSize: 14 }}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput style={styles.input} placeholder="Phòng học (*)" value={roomName} onChangeText={setRoomName} />

            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.input}
                {...({ type: 'date' } as any)}
                value={scheduleDate.toISOString().split('T')[0]}
                onChangeText={(text) => {
                  const d = new Date(text);
                  if (!isNaN(d.getTime())) setScheduleDate(d);
                }}
              />
            ) : (
              <TouchableOpacity style={styles.inputPicker} onPress={() => setShowDatePicker(true)}>
                <Text style={{ color: '#000' }}>📅 Ngày: {scheduleDate.toLocaleDateString('vi-VN')}</Text>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={scheduleDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setScheduleDate(selectedDate);
                }}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {Platform.OS === 'web' ? (
                <>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 5 }]}
                    {...({ type: 'time' } as any)}
                    value={startTime.toTimeString().substring(0, 5)}
                    onChangeText={(text) => {
                      const [h, m] = text.split(':');
                      if (h && m) {
                        const d = new Date(startTime);
                        d.setHours(parseInt(h), parseInt(m));
                        setStartTime(d);
                      }
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 5 }]}
                    {...({ type: 'time' } as any)}
                    value={endTime.toTimeString().substring(0, 5)}
                    onChangeText={(text) => {
                      const [h, m] = text.split(':');
                      if (h && m) {
                        const d = new Date(endTime);
                        d.setHours(parseInt(h), parseInt(m));
                        setEndTime(d);
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.inputPicker, { flex: 1, marginRight: 5 }]} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={{ fontSize: 13, color: '#000' }}>⏰ Từ: {startTime.toTimeString().substring(0, 5)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.inputPicker, { flex: 1, marginLeft: 5 }]} onPress={() => setShowEndTimePicker(true)}>
                    <Text style={{ fontSize: 13, color: '#000' }}>⏰ Đến: {endTime.toTimeString().substring(0, 5)}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {(showStartTimePicker || showEndTimePicker) && Platform.OS !== 'web' && (
              <DateTimePicker
                value={showStartTimePicker ? startTime : endTime}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                  if (selectedDate) showStartTimePicker ? setStartTime(selectedDate) : setEndTime(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={styles.inputPicker} onPress={() => { setTeacherDropdownVisible(!teacherDropdownVisible); setSemesterDropdownVisible(false); }}>
              <Text style={{ color: teacherIds.length > 0 ? '#000' : '#888' }}>
                {teacherIds.length > 0
                  ? teachersList.filter((t: any) => teacherIds.includes(t.id.toString())).map((t: any) => t.full_name || t.email).join(', ')
                  : 'Giảng viên (Tùy chọn)'}
              </Text>
            </TouchableOpacity>

            {teacherDropdownVisible && (
              <View style={styles.dropdownOverlay}>
                <TextInput
                  style={styles.dropdownSearch}
                  placeholder="Tìm giảng viên..."
                  value={teacherFilter}
                  onChangeText={setTeacherFilter}
                />
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                  {teachersList.filter((t: any) => (t.full_name || t.email).toLowerCase().includes(teacherFilter.toLowerCase())).map((item: any) => (
                    <TouchableOpacity key={item.id} style={[styles.dropdownItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: teacherIds.includes(item.id.toString()) ? '#E3F2FD' : '#FFF' }]} onPress={() => toggleTeacher(item.id.toString())}>
                      <Text style={{ fontSize: 14 }}>{item.full_name || item.email}</Text>
                      {teacherIds.includes(item.id.toString()) && <Text style={{ color: '#1565C0', fontWeight: 'bold' }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={onClose}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1565C0' }]} onPress={handleLocalSave}>
                <Text style={styles.btnText}>Lưu Lại</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

export default function AdminSchedulesScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown data
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);

  // Modal Control
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchSubjects();
    fetchTeachers();
    fetchSemesters();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/subjects`);
      if (res.data.success) setSubjectsList(res.data.data);
    } catch (err) { console.error('Lỗi fetch subjects:', err); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      if (res.data.success) {
        setTeachersList(res.data.data.filter((u: any) => u.role === 'teacher'));
      }
    } catch (err) { console.error('Lỗi fetch teachers:', err); }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/semesters`);
      if (res.data.success) setSemestersList(res.data.data);
    } catch (err) { console.error('Lỗi fetch semesters:', err); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/schedules`);
      if (res.data.success) setSchedules(res.data.data);
    } catch (err) {
      console.error('Lỗi tải lịch học:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = useCallback(() => {
    setEditingItem(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item: ScheduleItem) => {
    setEditingItem(item);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => setModalVisible(false), []);

  const editingItemRef = useRef(editingItem);
  editingItemRef.current = editingItem;

  const handleSave = useCallback(async (payload: any) => {
    try {
      const current = editingItemRef.current;
      if (current) {
        await axios.put(`${API_URL}/admin/schedules/${current.id}`, payload);
        Alert.alert('Thành công', 'Đã cập nhật lịch học.');
      } else {
        await axios.post(`${API_URL}/admin/schedules`, payload);
        Alert.alert('Thành công', 'Đã tạo lịch học mới.');
      }
      setModalVisible(false);
      fetchSchedules();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu lịch học.');
    }
  }, []);

  const handleDelete = (id: number | string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa lịch học này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/schedules/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa lịch học.');
              fetchSchedules();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa lịch học.');
          }
        },
      },
    ]);
  };

  const filteredSchedules = schedules.filter(item =>
    item.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.schedule_date.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Quản Lý Lịch Học',
        headerBackTitle: 'Trở lại',
        headerRight: () => (
          <TouchableOpacity onPress={openAddModal} style={{ marginRight: 10 }}>
            <IconSymbol name="plus" size={28} color="#1565C0" />
          </TouchableOpacity>
        )
      }} />

      {loading ? (
        <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 20 }} />
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Tìm môn hoặc ngày (YYYY-MM-DD)..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {filteredSchedules.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy lịch học nào.</Text>
          ) : (
            <FlatList
              data={filteredSchedules}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ScheduleItemCard item={item} onEdit={openEditModal} onDelete={handleDelete} />
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </>
      )}

      <ScheduleModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={handleSave}
        editingItem={editingItem}
        subjectsList={subjectsList}
        teachersList={teachersList}
        semestersList={semestersList}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <IconSymbol name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    marginHorizontal: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDesc: { color: '#666', fontSize: 13, marginBottom: 4 },
  actRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 13 },
  editBtn: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editBtnText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', maxHeight: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Dropdown Picker Styles
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#FAFAFA', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },

  typeToggle: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1565C0', borderRadius: 8, marginHorizontal: 4 },
  typeToggleActive: { backgroundColor: '#1565C0' },
  typeToggleText: { fontWeight: 'bold', color: '#1565C0', fontSize: 13 },
  searchContainer: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  searchInput: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14 },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 25,
    backgroundColor: '#1565C0',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
