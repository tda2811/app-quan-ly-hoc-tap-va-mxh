import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ExamItem {
  id: number | string;
  subject_id: number | string;
  subject_name?: string;
  teacher_ids?: string;
  teacher_email?: string;
  room_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
}

export default function AdminExamsScreen() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);

  const toggleTeacher = (id: string) => {
    setTeacherIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };
  const [roomName, setRoomName] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Dropdown states
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [subjectDropdownVisible, setSubjectDropdownVisible] = useState(false);
  const [teacherDropdownVisible, setTeacherDropdownVisible] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchTeachers();
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

  const fetchExams = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/exams`);
      if (res.data.success) setExams(res.data.data);
    } catch (err) {
      console.error('Lỗi tải lịch thi:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setSubjectId('');
    setTeacherIds([]);
    setRoomName('');
    setScheduleDate('');
    setStartTime('');
    setEndTime('');
    setSubjectDropdownVisible(false);
    setTeacherDropdownVisible(false);
    setModalVisible(true);
  };

  const openEditModal = (exam: ExamItem) => {
    setEditingId(exam.id);
    setSubjectId(String(exam.subject_id));
    setTeacherIds(exam.teacher_ids ? exam.teacher_ids.split(',').filter(d => d) : []);
    setRoomName(exam.room_name);
    setScheduleDate(exam.schedule_date.split('T')[0]);
    setStartTime(exam.start_time);
    setEndTime(exam.end_time);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!subjectId || !roomName || !scheduleDate || !startTime || !endTime) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      const payload = {
        subject_id: subjectId,
        teacher_ids: teacherIds,
        room_name: roomName,
        schedule_date: scheduleDate,
        start_time: startTime,
        end_time: endTime,
      };

      if (editingId) {
        await axios.put(`${API_URL}/admin/exams/${editingId}`, payload);
        Alert.alert('Thành công', 'Đã cập nhật lịch thi.');
      } else {
        await axios.post(`${API_URL}/admin/exams`, payload);
        Alert.alert('Thành công', 'Đã tạo lịch thi mới.');
      }
      setModalVisible(false);
      fetchExams();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu lịch thi.');
    }
  };

  const handleDelete = (id: number | string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa lịch thi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${API_URL}/admin/exams/${id}`);
            if (res.data.success) {
              Alert.alert('Thành công', 'Đã xóa lịch thi.');
              fetchExams();
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa lịch thi.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ExamItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.subject_name}</Text>
        <Text style={styles.typeBadge}>LỊCH THI</Text>
      </View>
      <Text style={styles.cardDesc}>Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
      <Text style={styles.cardDesc}>Thời gian: {item.start_time} - {item.end_time}</Text>
      <Text style={styles.cardDesc}>Phòng thi: {item.room_name}</Text>
      <Text style={styles.cardDesc}>Giám thị: {item.teacher_email || 'Chờ phân công'}</Text>
      <View style={styles.actRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
          <Text style={styles.editBtnText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtnText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Quản Lý Lịch Thi', 
        headerBackTitle: 'Trở lại',
        headerRight: () => (
          <TouchableOpacity onPress={openAddModal} style={{ marginRight: 10 }}>
            <IconSymbol name="plus" size={28} color="#D32F2F" />
          </TouchableOpacity>
        )
      }} />
      
      {loading ? (
        <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
      ) : exams.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có lịch thi nào.</Text>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* Modal Cập Nhật / Thêm Mới */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Chỉnh Sửa Lịch Thi' : 'Tạo Lịch Thi Mới'}</Text>
            
            {/* Dropdown Môn Học */}
            <TouchableOpacity style={styles.inputPicker} onPress={() => setSubjectDropdownVisible(!subjectDropdownVisible)}>
              <Text style={{color: subjectId ? '#000' : '#888'}}>
                {subjectId ? (subjectsList.find((s: any) => s.id.toString() === subjectId) as any)?.name || 'Môn học gán' : 'Chọn Môn học (*)'}
              </Text>
            </TouchableOpacity>

            {subjectDropdownVisible && (
              <View style={styles.dropdownOverlay}>
                <FlatList nestedScrollEnabled style={{maxHeight: 150}} data={subjectsList} keyExtractor={(s: any) => s.id.toString()} renderItem={({item}: {item: any}) => (
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSubjectId(item.id.toString()); setSubjectDropdownVisible(false); }}>
                    <Text style={{fontSize: 14}}>{item.name}</Text>
                  </TouchableOpacity>
                )} />
              </View>
            )}

            <TextInput style={styles.input} placeholder="Phòng thi (*)" value={roomName} onChangeText={setRoomName} />
            <TextInput style={styles.input} placeholder="Ngày thi (YYYY-MM-DD)" value={scheduleDate} onChangeText={setScheduleDate} />
            <TextInput style={styles.input} placeholder="Giờ bắt đầu (HH:MM:SS)" value={startTime} onChangeText={setStartTime} />
            <TextInput style={styles.input} placeholder="Giờ kết thúc (HH:MM:SS)" value={endTime} onChangeText={setEndTime} />

            {/* Dropdown Giám Thị */}
            <TouchableOpacity style={styles.inputPicker} onPress={() => setTeacherDropdownVisible(!teacherDropdownVisible)}>
              <Text style={{color: teacherIds.length > 0 ? '#000' : '#888'}}>
                {teacherIds.length > 0 
                  ? teachersList.filter((t: any) => teacherIds.includes(t.id.toString())).map((t: any) => t.full_name || t.email).join(', ') 
                  : 'Chọn Giám thị (Tùy chọn)'}
              </Text>
            </TouchableOpacity>

            {teacherDropdownVisible && (
              <View style={styles.dropdownOverlay}>
                <FlatList nestedScrollEnabled style={{maxHeight: 150}} data={teachersList} keyExtractor={(t: any) => t.id.toString()} renderItem={({item}: {item: any}) => (
                  <TouchableOpacity style={[styles.dropdownItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: teacherIds.includes(item.id.toString()) ? '#FFEBEE' : '#FFF' }]} onPress={() => toggleTeacher(item.id.toString())}>
                    <Text style={{fontSize: 14}}>{item.full_name || item.email}</Text>
                    {teacherIds.includes(item.id.toString()) && <Text style={{color: '#D32F2F', fontWeight: 'bold'}}>✓</Text>}
                  </TouchableOpacity>
                )} />
              </View>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#CCC'}]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#D32F2F'}]} onPress={handleSave}>
                <Text style={styles.btnText}>Lưu Lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDesc: { color: '#666', fontSize: 14, marginBottom: 4 },
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
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#D32F2F', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 15 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Dropdown Picker Styles
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#FAFAFA', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' }
});
