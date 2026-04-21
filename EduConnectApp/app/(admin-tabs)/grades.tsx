import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, 
  ActivityIndicator, Modal, TextInput, ScrollView, Keyboard, 
  TouchableWithoutFeedback 
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminGradesScreen() {
  const { user } = useAuth();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [selectedSemId, setSelectedSemId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [scoreInput, setScoreInput] = useState({ att: '', mid: '', final: '' });
  
  const [dropdowns, setDropdowns] = useState({ sub: false, sem: false, cls: false });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subRes, semRes, clsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/subjects`),
        axios.get(`${API_URL}/admin/semesters`),
        axios.get(`${API_URL}/admin/classes`)
      ]);
      
      if (subRes.data.success) setSubjects(subRes.data.data);
      if (semRes.data.success) {
        setSemesters(semRes.data.data);
        if (semRes.data.data.length > 0) setSelectedSemId(semRes.data.data[0].id);
      }
      if (clsRes.data.success) setClasses(clsRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/admin/enrollments?`;
      if (selectedSubId) url += `subject_id=${selectedSubId}&`;
      if (selectedSemId) url += `semester_id=${selectedSemId}&`;
      if (selectedClassId) url += `class_id=${selectedClassId}&`;
      
      const res = await axios.get(url);
      if (res.data.success) setEnrollments(res.data.data);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy danh sách sinh viên.');
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setScoreInput({
      att: enrollment.attendance_score?.toString() || '',
      mid: enrollment.midterm_score?.toString() || '',
      final: enrollment.final_score?.toString() || '',
    });
    setGradeModalVisible(true);
  };

  const handleUpdateGrade = async () => {
    if (!selectedEnrollment) return;
    try {
      const res = await axios.put(`${API_URL}/admin/grades`, {
        enrollment_id: selectedEnrollment.enrollment_id,
        attendance_score: scoreInput.att === '' ? null : parseFloat(scoreInput.att),
        midterm_score: scoreInput.mid === '' ? null : parseFloat(scoreInput.mid),
        final_score: scoreInput.final === '' ? null : parseFloat(scoreInput.final),
      });
      if (res.data.success) {
        Alert.alert('Thành công', 'Cập nhật điểm thành công.');
        setGradeModalVisible(false);
        fetchEnrollments();
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật điểm.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.filterCard}>
          <Text style={styles.label}>Học Kỳ:</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setDropdowns({ ...dropdowns, sem: !dropdowns.sem })}>
            <Text>{semesters.find(s => s.id === selectedSemId)?.name || 'Chọn Học Kỳ'}</Text>
          </TouchableOpacity>
          {dropdowns.sem && (
            <View style={styles.dropdown}>
              {semesters.map(s => (
                <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSelectedSemId(s.id); setDropdowns({ ...dropdowns, sem: false }); }}>
                  <Text>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Môn Học:</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setDropdowns({ ...dropdowns, sub: !dropdowns.sub })}>
            <Text>{subjects.find(s => s.id === selectedSubId)?.name || 'Tất cả Môn Học'}</Text>
          </TouchableOpacity>
          {dropdowns.sub && (
            <View style={[styles.dropdown, { maxHeight: 200 }]}>
              <ScrollView nestedScrollEnabled>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedSubId(null); setDropdowns({ ...dropdowns, sub: false }); }}>
                  <Text style={{color: '#B71C1C'}}>-- Tất cả --</Text>
                </TouchableOpacity>
                {subjects.map(s => (
                  <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSelectedSubId(s.id); setDropdowns({ ...dropdowns, sub: false }); }}>
                    <Text>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Lớp:</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setDropdowns({ ...dropdowns, cls: !dropdowns.cls })}>
            <Text>{classes.find(c => c.id === selectedClassId)?.name || 'Tất cả Lớp'}</Text>
          </TouchableOpacity>
          {dropdowns.cls && (
            <View style={[styles.dropdown, { maxHeight: 200 }]}>
              <ScrollView nestedScrollEnabled>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedClassId(null); setDropdowns({ ...dropdowns, cls: false }); }}>
                  <Text style={{color: '#B71C1C'}}>-- Tất cả --</Text>
                </TouchableOpacity>
                {classes.map(c => (
                  <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setSelectedClassId(c.id); setDropdowns({ ...dropdowns, cls: false }); }}>
                    <Text>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.searchBtn} onPress={fetchEnrollments}>
            <Text style={styles.searchBtnText}>LẤY DANH SÁCH</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#B71C1C" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={enrollments}
            keyExtractor={e => e.enrollment_id.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có dữ liệu. Vui lòng chọn bộ lọc và nhấn "Lấy danh sách".</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.studentCard} onPress={() => openGradeModal(item)}>
                <View style={styles.studentHeader}>
                  <Text style={styles.studentName}>{item.full_name}</Text>
                  <Text style={styles.studentCode}>{item.student_code}</Text>
                </View>
                <Text style={styles.subjectText}>{item.subject_name}</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreItem}><Text style={styles.scoreLabel}>CC: {item.attendance_score ?? '-'}</Text></View>
                  <View style={styles.scoreItem}><Text style={styles.scoreLabel}>GK: {item.midterm_score ?? '-'}</Text></View>
                  <View style={styles.scoreItem}><Text style={styles.scoreLabel}>CK: {item.final_score ?? '-'}</Text></View>
                  <View style={styles.scoreItem}><Text style={[styles.scoreLabel, {fontWeight: 'bold', color: '#B71C1C'}]}>TK: {item.overall_score ?? '-'}</Text></View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Modal visible={gradeModalVisible} animationType="fade" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>NHẬP ĐIỂM SINH VIÊN</Text>
                <Text style={styles.modalSub}>{selectedEnrollment?.full_name} ({selectedEnrollment?.student_code})</Text>
                
                <Text style={styles.inputLabel}>Chuyên cần (10%):</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={scoreInput.att} onChangeText={t => setScoreInput({ ...scoreInput, att: t })} />
                
                <Text style={styles.inputLabel}>Giữa kỳ (30%):</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={scoreInput.mid} onChangeText={t => setScoreInput({ ...scoreInput, mid: t })} />

                <Text style={styles.inputLabel}>Cuối kỳ (60%):</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={scoreInput.final} onChangeText={t => setScoreInput({ ...scoreInput, final: t })} />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setGradeModalVisible(false)}>
                    <Text>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleUpdateGrade}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Lưu Điểm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterCard: { backgroundColor: '#FFF', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', elevation: 3 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  picker: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 6, marginBottom: 10, backgroundColor: '#FAFAFA' },
  dropdown: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, backgroundColor: '#FFF', marginBottom: 10 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  searchBtn: { backgroundColor: '#B71C1C', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  searchBtnText: { color: '#FFF', fontWeight: 'bold' },
  studentCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  studentName: { fontWeight: 'bold', fontSize: 14 },
  studentCode: { color: '#666', fontSize: 12 },
  subjectText: { fontSize: 13, color: '#1B5E20', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9F9F9', padding: 8, borderRadius: 4 },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 11 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, paddingHorizontal: 40 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 10 },
  modalTitle: { fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 5 },
  modalSub: { textAlign: 'center', color: '#666', marginBottom: 15 },
  inputLabel: { fontSize: 12, color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 8, borderRadius: 6, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { padding: 12, borderRadius: 6, flex: 0.48, alignItems: 'center' },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: '#B71C1C' }
});
