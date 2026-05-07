import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, Modal, Image, ScrollView, Platform, TextInput,
  Keyboard, TouchableWithoutFeedback, Pressable
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Schedule {
  id: number;
  subject_id: number;
  subject_name: string;
  room_name: string;
  schedule_type: 'theory' | 'practice' | 'exam';
  schedule_date: string;
  start_time: string;
  end_time: string;
  teacher_email?: string;
}

interface GradeItem {
  id: number;
  subject_name: string;
  attendance_score: number | null;
  midterm_score: number | null;
  final_score: number | null;
  overall_score: number | null;
  gpa_score: number | null;
  letter_grade: string | null;
  semester_name: string | null;
  credit: number | null;
}

interface DocumentItem {
  id: number;
  title: string;
  subject_name: string;
  file_url: string;
  file_type: string;
  uploader_email?: string;
}

export default function LMSScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'study' | 'exam' | 'grades' | 'documents' | 'attendance' | 'manage_grades' | 'teacher_history'>('study');
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState(false);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const isScanningRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subFilter, setSubFilter] = useState('');

  // Teacher Create Schedule states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [schDate, setSchDate] = useState(new Date());
  const [sTime, setSTime] = useState(new Date());
  const [eTime, setETime] = useState(new Date());
  const [schType, setSchType] = useState<'theory' | 'practice'>('theory');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null);
  const [examSubType, setExamSubType] = useState<'Lý Thuyết' | 'Tự Luận'>('Lý Thuyết');
  const [subjectDropdownVisible, setSubjectDropdownVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSTimePicker, setShowSTimePicker] = useState(false);
  const [showETimePicker, setShowETimePicker] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [teacherHistorySchedule, setTeacherHistorySchedule] = useState<Schedule | null>(null);
  const [teacherHistoryModalVisible, setTeacherHistoryModalVisible] = useState(false);
  const [teacherHistoryModalSchedule, setTeacherHistoryModalSchedule] = useState<Schedule | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Grade Management for Teacher
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [scoreInput, setScoreInput] = useState({ att: '', mid: '', final: '' });
  const [semDropdownVisible, setSemDropdownVisible] = useState(false);
  const [semFilter, setSemFilter] = useState('');

  useEffect(() => {
    fetchSchedules();
    if (user.role === 'teacher') {
      fetchSubjects();
      fetchSemesters();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (viewMode === 'study' || viewMode === 'exam' || viewMode === 'teacher_history') {
        await fetchSchedules();
        if (viewMode === 'teacher_history' && teacherHistoryModalSchedule) {
          await fetchAttendees(teacherHistoryModalSchedule.id);
        }
      }
      else if (viewMode === 'grades') await fetchGrades(true);
      else if (viewMode === 'documents') await fetchDocuments(true);
      else if (viewMode === 'attendance') await fetchAttendances(true);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/subjects`);
      if (res.data.success) setSubjectsList(res.data.data);
    } catch (e) { console.log(e); }
  };

  const fetchSemesters = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/semesters`);
      if (res.data.success) {
        setSemesters(res.data.data);
        if (res.data.data.length > 0) setSelectedSemId(res.data.data[0].id);
      }
    } catch (e) { console.log(e); }
  };

  const fetchEnrollments = async () => {
    if (!selectedSubId) {
      Alert.alert('Thông báo', 'Vui lòng chọn môn học.');
      return;
    }
    if (!selectedSemId) {
      Alert.alert('Thông báo', 'Vui lòng chọn học kỳ.');
      return;
    }
    try {
      setLoadingEnrollments(true);
      const res = await axios.get(`${API_URL}/admin/enrollments`, {
        params: {
          subject_id: selectedSubId,
          semester_id: selectedSemId
        }
      });
      if (res.data.success) {
        setEnrollments(res.data.data);
        if (res.data.data.length === 0) {
          Alert.alert('Thông báo', 'Không tìm thấy sinh viên nào đăng ký môn học này trong kỳ này.');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể lấy danh sách sinh viên.');
    }
    finally { setLoadingEnrollments(false); }
  };

  const fetchSchedules = async () => {
    try {
      if (!refreshing) setLoading(true);
      const url = user.role === 'teacher'
        ? `${API_URL}/attendance/schedules?teacher_id=${user.id}`
        : `${API_URL}/student/schedules?student_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.success) setSchedules(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingGrades(true);
      const res = await axios.get(`${API_URL}/student/grades?student_id=${user.id}`);
      if (res.data.success) setGrades(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
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
    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật điểm.'); }
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

  const fetchDocuments = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingDocs(true);
      const url = user.role === 'teacher'
        ? `${API_URL}/admin/documents`
        : `${API_URL}/student/documents?student_id=${user.id}`;
      const res = await axios.get(url);
      if (res.data.success) {
        if (user.role === 'teacher') {
          setDocuments(res.data.data.filter((d: any) => d.uploader_id === user.id));
        } else {
          setDocuments(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchAttendances = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingAttendances(true);
      const res = await axios.get(`${API_URL}/student/attendances?student_id=${user.id}`);
      if (res.data.success) setAttendances(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendances(false);
    }
  };

  const fetchAttendees = async (scheduleId: number) => {
    try {
      setLoadingAttendees(true);
      const res = await axios.get(`${API_URL}/attendance/list/${scheduleId}`);
      if (res.data.success) {
        setAttendees(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      fetchAttendees(selectedSchedule.id);
      return;
    }

    if (teacherHistoryModalVisible && teacherHistoryModalSchedule) {
      fetchAttendees(teacherHistoryModalSchedule.id);
      return;
    }

    setAttendees([]);
  }, [selectedSchedule, teacherHistoryModalVisible, teacherHistoryModalSchedule]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedFile(result.assets[0]);
      }
    } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    Keyboard.dismiss();
    if (!docTitle.trim() || !selectedSubId || !pickedFile) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề, chọn môn học và chọn file.');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', docTitle.trim());
      formData.append('subject_id', selectedSubId.toString());
      formData.append('uploader_id', user.id);
      formData.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.mimeType || 'application/octet-stream',
      } as any);

      const res = await axios.post(`${API_URL}/admin/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        Alert.alert('Thành công', 'Tải tài liệu lên thành công.');
        setDocTitle(''); setPickedFile(null); setSelectedSubId(null);
        setUploadModalVisible(false);
        fetchDocuments();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải tài liệu lên.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSchedule = async () => {
    Keyboard.dismiss();
    if (!selectedSubId || !roomName || !schDate) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin (Môn học, Phòng, Ngày).');
      return;
    }
    try {
      const payload = {
        teacher_id: user.id,
        subject_id: selectedSubId,
        room_name: viewMode === 'exam' ? `[${examSubType}] ${roomName}` : roomName,
        schedule_date: schDate.toISOString().split('T')[0],
        start_time: sTime.toTimeString().split(' ')[0].substring(0, 5),
        end_time: eTime.toTimeString().split(' ')[0].substring(0, 5),
        schedule_type: viewMode === 'exam' ? 'exam' : schType
      };

      if (isEditing && selectedEditId) {
        await axios.put(`${API_URL}/attendance/schedules/${selectedEditId}`, payload);
        Alert.alert('Thành công', 'Đã cập nhật lịch dạy.');
      } else {
        await axios.post(`${API_URL}/attendance/schedules`, payload);
        Alert.alert('Thành công', 'Đã thêm lịch dạy mới.');
      }
      setAddModalVisible(false);
      resetAddModal();
      fetchSchedules();
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu lịch dạy.'); }
  };

  const handleDeleteSchedule = (id: number) => {
    Alert.alert('Xác Nhận', 'Bạn có muốn xóa lịch dạy này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`${API_URL}/attendance/schedules/${id}?teacher_id=${user.id}`);
            fetchSchedules();
          } catch (e) { Alert.alert('Lỗi', 'Xóa thất bại.'); }
        }
      }
    ]);
  };

  const openEditModal = (item: Schedule) => {
    setIsEditing(true);
    setSelectedEditId(item.id);
    setSelectedSubId(item.subject_id);

    if (item.schedule_type === 'exam') {
      if (item.room_name.startsWith('[Lý Thuyết]')) {
        setExamSubType('Lý Thuyết');
        setRoomName(item.room_name.replace('[Lý Thuyết] ', ''));
      } else if (item.room_name.startsWith('[Tự Luận]')) {
        setExamSubType('Tự Luận');
        setRoomName(item.room_name.replace('[Tự Luận] ', ''));
      } else {
        setRoomName(item.room_name);
      }
    } else {
      setRoomName(item.room_name);
    }
    setSchDate(new Date(item.schedule_date));

    const [stH, stM] = item.start_time.split(':');
    const startD = new Date(); startD.setHours(parseInt(stH), parseInt(stM));
    setSTime(startD);

    const [etH, etM] = item.end_time.split(':');
    const endD = new Date(); endD.setHours(parseInt(etH), parseInt(etM));
    setETime(endD);

    setSchType(item.schedule_type as any);
    setAddModalVisible(true);
  };

  const resetAddModal = () => {
    setIsEditing(false);
    setSelectedEditId(null);
    setSelectedSubId(null);
    setRoomName('');
    setSchDate(new Date());
    setSTime(new Date());
    setETime(new Date());
    setSchType('theory');
    setExamSubType('Lý Thuyết');
    setSubFilter('');
    setSubjectDropdownVisible(false);
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      if (!fileUrl) {
        Alert.alert('Lỗi', 'Đường dẫn file không tồn tại.');
        return;
      }
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL.replace('/api', '')}${fileUrl}`;
      await WebBrowser.openBrowserAsync(fullUrl);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở file.');
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setScanned(true);
    setShowScanner(false);
    try {
      const scheduleId = parseInt(data);
      const res = await axios.post(`${API_URL}/attendance/check-in`, {
        schedule_id: scheduleId,
        student_id: user.id
      });
      if (res.data.success) {
        Alert.alert('Thành công', 'Điểm danh thành công!');
        // Refresh schedules after check-in
        setViewMode('study');
        fetchSchedules();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const renderItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => user.role === 'teacher' && setSelectedSchedule(item)}
      onLongPress={() => user.role === 'teacher' && openEditModal(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.subjName}>{item.subject_name}</Text>
        <TouchableOpacity
          onPress={() => user.role === 'teacher' && handleDeleteSchedule(item.id)}
          style={{ padding: 4 }}
        >
          {user.role === 'teacher' && <Text style={{ color: '#999', fontSize: 10 }}>Xóa</Text>}
        </TouchableOpacity>
        <Text style={[styles.roomBadge, item.schedule_type === 'exam' && { backgroundColor: '#FFEBEE', color: '#D32F2F' }]}>
          {item.schedule_type === 'exam' ? 'P. THI ' : 'P. HỌC '} {item.room_name}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <IconSymbol name="calendar" size={14} color="#666" style={styles.metaIcon} />
        <Text style={styles.cardText}>Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
      </View>
      <View style={styles.metaRow}>
        <IconSymbol name="clock.fill" size={14} color="#666" style={styles.metaIcon} />
        <Text style={styles.cardText}>Giờ: {item.start_time} - {item.end_time}</Text>
      </View>
      {item.teacher_email && (
        <View style={styles.metaRow}>
          <IconSymbol name="person.fill" size={14} color="#666" style={styles.metaIcon} />
          <Text style={styles.cardText}>{item.teacher_email}</Text>
        </View>
      )}
      {user.role === 'teacher' && <Text style={{ fontSize: 10, color: '#1B5E20', marginTop: 4, fontStyle: 'italic' }}>Nhấn giữ để sửa</Text>}
    </TouchableOpacity>
  );

  const renderDocItem = ({ item }: { item: DocumentItem }) => (
    <View style={styles.docCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.metaRow}>
          <IconSymbol name="doc.text.fill" size={16} color="#1B5E20" style={styles.metaIcon} />
          <Text style={styles.docTitle}>{item.title}</Text>
        </View>
        <Text style={styles.docTypeBadge}>{item.file_type.toUpperCase()}</Text>
      </View>
      <Text style={styles.docDesc}>Môn: {item.subject_name}</Text>
      <TouchableOpacity style={styles.viewDocBtn} onPress={() => handleViewFile(item.file_url)}>
        <View style={styles.metaRow}>
          <IconSymbol name="doc.text.fill" size={16} color="#1976D2" style={styles.metaIcon} />
          <Text style={styles.viewDocText}>Xem / Tải Xuống Tài Liệu</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const filteredSchedules = schedules.filter(s =>
    s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.schedule_date.includes(searchQuery)
  );
  const studySchedules = filteredSchedules.filter(s => s.schedule_type !== 'exam');
  const examSchedules = filteredSchedules.filter(s => s.schedule_type === 'exam');

  const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (Platform.OS === 'web') return <View style={{ flex: 1 }}>{children}</View>;
    return <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{children}</TouchableWithoutFeedback>;
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <IconSymbol name={user.role === 'teacher' ? 'list.bullet.indent' : 'calendar'} size={18} color="#B71C1C" style={{ marginRight: 8 }} />
          <Text style={styles.title}>{user.role === 'teacher' ? 'Quản Lý Giảng Dạy' : 'Quản Lý Học Tập'}</Text>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            <TouchableOpacity style={[styles.tabItem, viewMode === 'study' && styles.tabItemActive]} onPress={() => setViewMode('study')}>
              <View style={styles.tabInner}>
                <IconSymbol name="calendar" size={14} color={viewMode === 'study' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, viewMode === 'study' && styles.tabTextActive]}>Lịch Học</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, viewMode === 'exam' && styles.tabItemActive]} onPress={() => setViewMode('exam')}>
              <View style={styles.tabInner}>
                <IconSymbol name="calendar" size={14} color={viewMode === 'exam' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, viewMode === 'exam' && styles.tabTextActive]}>Lịch Thi</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, viewMode === 'documents' && styles.tabItemActive]} onPress={() => { setViewMode('documents'); fetchDocuments(); }}>
              <View style={styles.tabInner}>
                <IconSymbol name="doc.text" size={14} color={viewMode === 'documents' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, viewMode === 'documents' && styles.tabTextActive]}>Tài Liệu</Text>
              </View>
            </TouchableOpacity>
            {user.role === 'student' && (
              <>
                <TouchableOpacity style={[styles.tabItem, viewMode === 'attendance' && styles.tabItemActive]} onPress={() => { setViewMode('attendance'); fetchAttendances(); }}>
                  <View style={styles.tabInner}>
                    <IconSymbol name="clock" size={14} color={viewMode === 'attendance' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, viewMode === 'attendance' && styles.tabTextActive]}>Lịch Sử</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, viewMode === 'grades' && styles.tabItemActive]} onPress={() => { setViewMode('grades'); fetchGrades(); }}>
                  <View style={styles.tabInner}>
                    <IconSymbol name="chart.bar" size={14} color={viewMode === 'grades' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, viewMode === 'grades' && styles.tabTextActive]}>Bảng Điểm</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            {user.role === 'teacher' && (
              <>
                <TouchableOpacity
                  style={[styles.tabItem, viewMode === 'teacher_history' && styles.tabItemActive]}
                  onPress={() => { setSelectedSchedule(null); setTeacherHistorySchedule(null); setViewMode('teacher_history'); }}
                >
                  <View style={styles.tabInner}>
                    <IconSymbol name="clock" size={14} color={viewMode === 'teacher_history' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, viewMode === 'teacher_history' && styles.tabTextActive]}>Lịch Sử</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabItem, viewMode === 'manage_grades' && styles.tabItemActive]}
                  onPress={() => { setSelectedSchedule(null); setTeacherHistorySchedule(null); setViewMode('manage_grades'); }}
                >
                  <View style={styles.tabInner}>
                    <IconSymbol name="chart.bar" size={14} color={viewMode === 'manage_grades' ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, viewMode === 'manage_grades' && styles.tabTextActive]}>Điểm Số</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {user.role === 'student' && viewMode === 'study' && (
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => {
              setScanned(false);
              isScanningRef.current = false;
              setShowScanner(true);
            }}
          >
            <View style={styles.scanBtnContent}>
              <IconSymbol name="qrcode.viewfinder" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.scanBtnText}>QUÉT QR ĐIỂM DANH</Text>
            </View>
          </TouchableOpacity>
        )}

        {(viewMode === 'study' || viewMode === 'exam' || viewMode === 'teacher_history') && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo môn hoặc ngày (YYYY-MM-DD)..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {viewMode === 'study' ? (
          <FlatList
            data={studySchedules}
            keyExtractor={s => s.id.toString()}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Chưa có lịch học.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
          />
        ) : viewMode === 'exam' ? (
          <FlatList
            data={examSchedules}
            keyExtractor={s => s.id.toString()}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Chưa có lịch thi.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
          />
        ) : viewMode === 'documents' ? (
          <FlatList
            data={documents}
            keyExtractor={d => d.id.toString()}
            renderItem={renderDocItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={!loadingDocs ? <Text style={styles.emptyText}>Chưa có tài liệu.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
          />
        ) : viewMode === 'attendance' ? (
          <FlatList
            data={attendances}
            keyExtractor={a => a.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            style={styles.list}
            ListEmptyComponent={!loadingAttendances ? <Text style={styles.emptyText}>Chưa có lịch sử điểm danh.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
            renderItem={({ item }) => (
              <View style={styles.attendanceCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.subjName}>{item.subject_name}</Text>
                  <View style={styles.statusRow}>
                    <IconSymbol
                      name={item.status === 'present' ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                      size={14}
                      color={item.status === 'present' ? '#2E7D32' : '#D32F2F'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.statusBadge, { color: item.status === 'present' ? '#2E7D32' : '#D32F2F' }]}>
                      {item.status === 'present' ? 'CÓ MẶT' : 'VẮNG'}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <IconSymbol name="calendar" size={14} color="#666" style={styles.metaIcon} />
                  <Text style={styles.cardText}>Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
                </View>
                <View style={styles.metaRow}>
                  <IconSymbol name="clock.fill" size={14} color="#666" style={styles.metaIcon} />
                  <Text style={styles.cardText}>
                    Thời gian: {new Date(item.scanned_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <IconSymbol name="mappin.and.ellipse" size={14} color="#666" style={styles.metaIcon} />
                  <Text style={styles.cardText}>IP: {item.network_ip || 'N/A'}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : viewMode === 'teacher_history' ? (
          <FlatList
            data={filteredSchedules}
            keyExtractor={s => s.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Chưa có lịch để xem lịch sử.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
            renderItem={({ item }: { item: Schedule }) => {
              return (
                <View>
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => setTeacherHistorySchedule(item)}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.subjName}>{item.subject_name}</Text>
                      <Text style={[styles.roomBadge, item.schedule_type === 'exam' && { backgroundColor: '#FFEBEE', color: '#D32F2F' }]}>
                        {item.schedule_type === 'exam' ? 'P. THI ' : 'P. HỌC '} {item.room_name}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <IconSymbol name="calendar" size={14} color="#666" style={styles.metaIcon} />
                      <Text style={styles.cardText}>Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <IconSymbol name="clock.fill" size={14} color="#666" style={styles.metaIcon} />
                      <Text style={styles.cardText}>Giờ: {item.start_time} - {item.end_time}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.historyStatsBtn}
                      onPress={() => {
                        setTeacherHistoryModalSchedule(item);
                        setTeacherHistoryModalVisible(true);
                        setAttendees([]);
                        fetchAttendees(item.id);
                      }}
                    >
                      <View style={styles.metaRow}>
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#1976D2" style={styles.metaIcon} />
                        <Text style={styles.historyStatsText}>Thống kê điểm danh</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={18} color="#BBB" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        ) : viewMode === 'manage_grades' ? (
          <View style={{ flex: 1 }}>
            <View style={{ padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
              <Text style={styles.label}>1. Chọn Học Kỳ:</Text>
              <TouchableOpacity style={styles.inputPicker} onPress={() => setSemDropdownVisible(!semDropdownVisible)}>
                <Text>{semesters.find(s => s.id === selectedSemId)?.name || 'Chọn Học Kỳ'}</Text>
              </TouchableOpacity>
              {semDropdownVisible && (
                <View style={styles.dropdownOverlay}>
                  <TextInput
                    style={styles.dropdownSearchInside}
                    placeholder="Tìm kiếm học kỳ..."
                    value={semFilter}
                    onChangeText={setSemFilter}
                  />
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                    {semesters.filter(s => s.name.toLowerCase().includes(semFilter.toLowerCase())).map(s => (
                      <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSelectedSemId(s.id); setSemDropdownVisible(false); setSemFilter(''); }}>
                        <Text>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>2. Chọn Môn Học:</Text>
              <TouchableOpacity style={styles.inputPicker} onPress={() => setSubjectDropdownVisible(!subjectDropdownVisible)}>
                <Text>{subjectsList.find(s => s.id === selectedSubId)?.name || 'Chọn Môn Học'}</Text>
              </TouchableOpacity>
              {subjectDropdownVisible && (
                <View style={styles.dropdownOverlay}>
                  <TextInput
                    style={styles.dropdownSearchInside}
                    placeholder="Tìm kiếm môn học..."
                    value={subFilter}
                    onChangeText={setSubFilter}
                  />
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                    {subjectsList.filter(s => s.name.toLowerCase().includes(subFilter.toLowerCase())).map(s => (
                      <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSelectedSubId(s.id); setSubjectDropdownVisible(false); setSubFilter(''); }}>
                        <Text>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                style={[styles.scanBtn, { margin: 0, marginTop: 10, backgroundColor: '#B71C1C' }]}
                onPress={fetchEnrollments}
                disabled={!selectedSubId || !selectedSemId}
              >
                <Text style={styles.scanBtnText}>LẤY DANH SÁCH SINH VIÊN</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={enrollments}
              keyExtractor={e => e.enrollment_id.toString()}
              style={styles.list}
              contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
              ListEmptyComponent={!loadingEnrollments ? <Text style={styles.emptyText}>Chưa có danh sách sinh viên.</Text> : <ActivityIndicator color="#B71C1C" />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gradeCard} onPress={() => openGradeModal(item)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>{item.full_name}</Text>
                      <Text style={{ fontSize: 10, color: '#1B5E20' }}>✓ Đã điểm danh: {item.present_count || 0} buổi</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#666' }}>{item.student_code}</Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}><Text style={styles.scoreLabel}>CC: {item.attendance_score ?? '-'}</Text></View>
                    <View style={styles.scoreItem}><Text style={styles.scoreLabel}>GK: {item.midterm_score ?? '-'}</Text></View>
                    <View style={styles.scoreItem}><Text style={styles.scoreLabel}>CK: {item.final_score ?? '-'}</Text></View>
                    <View style={styles.scoreItem}><Text style={[styles.scoreLabel, { fontWeight: 'bold' }]}>TK: {item.overall_score ?? '-'}</Text></View>
                    <View style={[styles.scoreItem, { backgroundColor: '#E8F5E9', borderRadius: 4 }]}><Text style={[styles.scoreLabel, { fontWeight: 'bold', color: '#2E7D32' }]}>GPA: {item.gpa_score ?? '-'}/4.0 ({item.letter_grade ?? '-'})</Text></View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <FlatList
            data={grades}
            keyExtractor={g => g.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            style={styles.list}
            ListHeaderComponent={() => {
              const gradedSubjects = grades.filter(g => g.gpa_score !== null && g.gpa_score !== undefined);
              const totalCredits = gradedSubjects.reduce((acc, curr) => acc + (curr.credit || 0), 0);
              const weightedGPA = gradedSubjects.reduce((acc, curr) => acc + ((curr.gpa_score || 0) * (curr.credit || 0)), 0);
              const avgGPA = totalCredits > 0 ? (weightedGPA / totalCredits).toFixed(2) : '0.00';

              // Tính xếp loại học lực dựa trên GPA hệ 4
              const gpaNum = parseFloat(avgGPA);
              let rank = 'Chưa xếp loại';
              let rankColor = '#666';
              if (gpaNum >= 3.6) { rank = 'XUẤT SẮC'; rankColor = '#D32F2F'; }
              else if (gpaNum >= 3.2) { rank = 'GIỎI'; rankColor = '#FF9800'; }
              else if (gpaNum >= 2.5) { rank = 'KHÁ'; rankColor = '#1976D2'; }
              else if (gpaNum >= 2.0) { rank = 'TRUNG BÌNH'; rankColor = '#4CAF50'; }
              else if (totalCredits > 0) { rank = 'YẾU'; rankColor = '#F44336'; }

              return (
                <View style={[styles.gradeCard, { backgroundColor: '#FFF', borderLeftWidth: 5, borderLeftColor: '#B71C1C', elevation: 3 }]}>
                  <Text style={{ fontWeight: 'bold', color: '#B71C1C', fontSize: 18, marginBottom: 8 }}>Hồ Sơ Học Tập Toàn Khóa</Text>
                  <View style={{ height: 1, backgroundColor: '#EEE', marginBottom: 10 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, color: '#555' }}>Tổng số tín chỉ đạt:</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{totalCredits}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, color: '#555' }}>Điểm GPA toàn khóa (hệ 4):</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#B71C1C' }}>{avgGPA} / 4.00</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#555' }}>Xếp loại học lực:</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: rankColor }}>{rank}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={!loadingGrades ? <Text style={styles.emptyText}>Chưa có điểm số.</Text> : <ActivityIndicator size="small" color="#B71C1C" style={{ marginTop: 20 }} />}
            renderItem={({ item }) => (
              <View style={styles.gradeCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={[styles.gradeSubject, { flex: 1 }]}>{item.subject_name}</Text>
                  <Text style={{ fontSize: 11, color: '#666' }}>{item.semester_name}</Text>
                </View>
                <View style={styles.gradeGrid}>
                  <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Điểm danh</Text><Text style={styles.gradeValue}>{item.attendance_score || '-'}</Text></View>
                  <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Giữa kỳ</Text><Text style={styles.gradeValue}>{item.midterm_score || '-'}</Text></View>
                  <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Cuối kỳ</Text><Text style={styles.gradeValue}>{item.final_score || '-'}</Text></View>
                  <View style={styles.gradeCol}><Text style={styles.gradeLabel}>Tổng kết</Text><Text style={[styles.gradeValue, { color: '#B71C1C' }]}>{item.overall_score || '-'}</Text></View>
                  <View style={[styles.gradeCol, { backgroundColor: '#F5F5F5', padding: 4, borderRadius: 4 }]}><Text style={styles.gradeLabel}>GPA/Hệ 4</Text><Text style={[styles.gradeValue, { color: '#2E7D32' }]}>{item.gpa_score || '-'}</Text></View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Modal visible={showScanner} animationType="slide">
          <View style={styles.cameraBackdrop}>
            <CameraView style={styles.cameraView} onBarcodeScanned={scanned ? undefined : handleBarcodeScanned} />
            <TouchableOpacity style={styles.closeCamBtn} onPress={() => setShowScanner(false)}><Text style={{ color: '#FFF' }}>Đóng</Text></TouchableOpacity>
          </View>
        </Modal>

        {/* Teacher History Modal */}
        <Modal visible={teacherHistoryModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalBackDrop}>
            <View style={[styles.modalContent, { width: '92%', height: '85%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#B71C1C' }}>
                    {teacherHistoryModalSchedule?.subject_name || 'Thống kê điểm danh'}
                  </Text>
                  {teacherHistoryModalSchedule && (
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {new Date(teacherHistoryModalSchedule.schedule_date).toLocaleDateString('vi-VN')} • {teacherHistoryModalSchedule.start_time}-{teacherHistoryModalSchedule.end_time} • {teacherHistoryModalSchedule.room_name}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => teacherHistoryModalSchedule && fetchAttendees(teacherHistoryModalSchedule.id)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                >
                  <View style={styles.metaRow}>
                    <IconSymbol name="arrow.clockwise" size={16} color="#1976D2" style={styles.metaIcon} />
                    <Text style={{ color: '#1976D2', fontWeight: 'bold' }}>Tải lại</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }}>
                {loadingAttendees ? (
                  <ActivityIndicator color="#B71C1C" style={{ marginTop: 20 }} />
                ) : (
                  <FlatList
                    data={attendees}
                    keyExtractor={(a: any) => a.id.toString()}
                    renderItem={({ item }) => (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{item.full_name}</Text>
                          <Text style={{ fontSize: 11, color: '#666' }}>{item.email}</Text>
                          <View style={[styles.metaRow, { marginTop: 2 }]}>
                            <IconSymbol name="mappin.and.ellipse" size={12} color="#666" style={styles.metaIcon} />
                            <Text style={{ fontSize: 10, color: '#666' }}>{item.network_ip || 'N/A'}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={styles.metaRow}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#1B5E20" style={styles.metaIcon} />
                            <Text style={{ fontSize: 11, color: '#1B5E20', fontWeight: 'bold' }}>ĐÃ VÀO</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: '#999' }}>
                            {item.scanned_at
                              ? new Date(item.scanned_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </Text>
                        </View>
                      </View>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Chưa có SV nào điểm danh</Text>}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: '#555', marginTop: 12, marginBottom: 0 }]}
                onPress={() => {
                  setTeacherHistoryModalVisible(false);
                  setTeacherHistoryModalSchedule(null);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ĐÓNG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* QR Code Modal for Teacher */}
        <Modal visible={!!selectedSchedule} animationType="fade" transparent={true}>
          <View style={styles.modalBackDrop}>
            <View style={[styles.modalContent, { alignItems: 'center', width: '92%', maxHeight: '85%' }]}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#B71C1C', marginBottom: 5 }}>{selectedSchedule?.subject_name}</Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 15 }}>Sinh viên quét mã bên dưới để điểm danh</Text>

              {selectedSchedule && (
                <View style={{ padding: 10, backgroundColor: '#F5F5F5', borderRadius: 10, marginBottom: 15 }}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedSchedule.id}` }}
                    style={{ width: 180, height: 180 }}
                  />
                </View>
              )}

              <View style={{ width: '100%', flex: 1, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>Thống kê điểm danh ({attendees.length})</Text>
                  <TouchableOpacity onPress={() => selectedSchedule && fetchAttendees(selectedSchedule.id)}>
                    <View style={styles.metaRow}>
                      <IconSymbol name="arrow.clockwise" size={14} color="#1976D2" style={styles.metaIcon} />
                      <Text style={{ color: '#1976D2', fontSize: 12, fontWeight: 'bold' }}>Tải lại</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {loadingAttendees ? (
                  <ActivityIndicator color="#B71C1C" style={{ marginTop: 20 }} />
                ) : (
                  <FlatList
                    data={attendees}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{item.full_name}</Text>
                          <Text style={{ fontSize: 11, color: '#666' }}>{item.email}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={styles.metaRow}>
                            <IconSymbol name="checkmark.circle.fill" size={14} color="#1B5E20" style={styles.metaIcon} />
                            <Text style={{ fontSize: 11, color: '#1B5E20', fontWeight: 'bold' }}>ĐÃ VÀO</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: '#999' }}>{new Date(item.scanned_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                      </View>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Chưa có SV nào quét mã</Text>}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.scanBtn, { backgroundColor: '#555', marginTop: 15, width: '100%', marginBottom: 0 }]}
                onPress={() => setSelectedSchedule(null)}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ĐÓNG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Schedule Modal for Teacher */}
        <Modal visible={addModalVisible} animationType="slide" transparent={true}>
          {Platform.OS === 'web' ? (
            <View style={styles.modalBackDrop}>
              <View style={styles.modalContent}>
                <Text style={styles.label}>Môn Học (*):</Text>
                <TouchableOpacity style={styles.inputPicker} onPress={() => setSubjectDropdownVisible(!subjectDropdownVisible)}>
                  <Text style={{ color: selectedSubId ? '#000' : '#888' }}>
                    {selectedSubId ? subjectsList.find(s => s.id === selectedSubId)?.name || 'Môn học' : 'Chọn Môn học'}
                  </Text>
                </TouchableOpacity>

                {subjectDropdownVisible && (
                  <View style={styles.dropdownOverlay}>
                    <TextInput
                      style={styles.dropdownSearchInside}
                      placeholder="Tìm môn học..."
                      value={subFilter}
                      onChangeText={setSubFilter}
                    />
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 120 }}>
                      {subjectsList
                        .filter((s: any) => s.name.toLowerCase().includes(subFilter.toLowerCase()))
                        .map((item: any) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedSubId(item.id);
                              setSubjectDropdownVisible(false);
                            }}
                          >
                            <Text style={{ fontSize: 14 }}>{item.name}</Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                )}

                <TextInput
                  style={styles.inputNarrow}
                  placeholder={viewMode === 'exam' ? 'Phòng thi (VD: A1.101)' : 'Phòng học (VD: A1.101)'}
                  value={roomName}
                  onChangeText={setRoomName}
                />

                <Text style={styles.label}>{viewMode === 'exam' ? 'Ngày thi (*):' : 'Ngày giảng dạy (*):'}</Text>
                <TextInput
                  style={styles.inputNarrow}
                  {...({ type: 'date' } as any)}
                  value={schDate.toISOString().split('T')[0]}
                  onChangeText={(v: any) => setSchDate(new Date(v))}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.label}>Bắt đầu:</Text>
                    <TextInput
                      style={styles.inputNarrow}
                      {...({ type: 'time' } as any)}
                      value={sTime.toTimeString().substring(0, 5)}
                      onChangeText={(v: any) => {
                        const nd = new Date();
                        const [h, m] = v.split(':');
                        nd.setHours(parseInt(h), parseInt(m));
                        setSTime(nd);
                      }}
                    />
                  </View>
                  <View style={{ flex: 0.48 }}>
                    <Text style={styles.label}>Kết thúc:</Text>
                    <TextInput
                      style={styles.inputNarrow}
                      {...({ type: 'time' } as any)}
                      value={eTime.toTimeString().substring(0, 5)}
                      onChangeText={(v: any) => {
                        const nd = new Date();
                        const [h, m] = v.split(':');
                        nd.setHours(parseInt(h), parseInt(m));
                        setETime(nd);
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <TouchableOpacity
                    style={[styles.miniBtn, (schType === 'theory' || (viewMode === 'exam' && examSubType === 'Lý Thuyết')) && styles.miniBtnActive]}
                    onPress={() => (viewMode === 'exam' ? setExamSubType('Lý Thuyết') : setSchType('theory'))}
                  >
                    <Text style={[styles.miniBtnText, (schType === 'theory' || (viewMode === 'exam' && examSubType === 'Lý Thuyết')) && { color: '#FFF' }]}>Lý Thuyết</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.miniBtn, (schType === 'practice' || (viewMode === 'exam' && examSubType === 'Tự Luận')) && styles.miniBtnActive]}
                    onPress={() => (viewMode === 'exam' ? setExamSubType('Tự Luận') : setSchType('practice'))}
                  >
                    <Text style={[styles.miniBtnText, (schType === 'practice' || (viewMode === 'exam' && examSubType === 'Tự Luận')) && { color: '#FFF' }]}>
                      {viewMode === 'exam' ? 'Tự Luận' : 'Thực Hành'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: '#CCC' }]}
                    onPress={() => {
                      setAddModalVisible(false);
                      resetAddModal();
                    }}
                  >
                    <Text style={{ color: '#333' }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1B5E20' }]} onPress={handleAddSchedule}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{isEditing ? 'Cập Nhật' : 'Lưu Lịch'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.modalBackDrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                  <Text style={styles.label}>Môn Học (*):</Text>
                  <TouchableOpacity style={styles.inputPicker} onPress={() => setSubjectDropdownVisible(!subjectDropdownVisible)}>
                    <Text style={{ color: selectedSubId ? '#000' : '#888' }}>
                      {selectedSubId ? subjectsList.find(s => s.id === selectedSubId)?.name || 'Môn học' : 'Chọn Môn học'}
                    </Text>
                  </TouchableOpacity>

                  {subjectDropdownVisible && (
                    <View style={styles.dropdownOverlay}>
                      <TextInput
                        style={styles.dropdownSearchInside}
                        placeholder="Tìm môn học..."
                        value={subFilter}
                        onChangeText={setSubFilter}
                      />
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 120 }}>
                        {subjectsList
                          .filter((s: any) => s.name.toLowerCase().includes(subFilter.toLowerCase()))
                          .map((item: any) => (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setSelectedSubId(item.id);
                                setSubjectDropdownVisible(false);
                              }}
                            >
                              <Text style={{ fontSize: 14 }}>{item.name}</Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  )}

                  <TextInput
                    style={styles.inputNarrow}
                    placeholder={viewMode === 'exam' ? 'Phòng thi (VD: A1.101)' : 'Phòng học (VD: A1.101)'}
                    value={roomName}
                    onChangeText={setRoomName}
                  />

                  <Text style={styles.label}>{viewMode === 'exam' ? 'Ngày thi (*):' : 'Ngày giảng dạy (*):'}</Text>
                  <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowDatePicker(true)}>
                    <View style={styles.metaRow}>
                      <IconSymbol name="calendar" size={14} color="#666" style={styles.metaIcon} />
                      <Text>{schDate.toLocaleDateString('vi-VN')}</Text>
                    </View>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={schDate}
                      mode="date"
                      display="default"
                      onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (d) setSchDate(d);
                      }}
                    />
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 0.48 }}>
                      <Text style={styles.label}>Bắt đầu:</Text>
                      <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowSTimePicker(true)}>
                        <View style={styles.metaRow}>
                          <IconSymbol name="clock.fill" size={14} color="#666" style={styles.metaIcon} />
                          <Text>{sTime.toTimeString().substring(0, 5)}</Text>
                        </View>
                      </TouchableOpacity>
                      {showSTimePicker && (
                        <DateTimePicker
                          value={sTime}
                          mode="time"
                          display="default"
                          onChange={(e, d) => {
                            setShowSTimePicker(false);
                            if (d) setSTime(d);
                          }}
                        />
                      )}
                    </View>
                    <View style={{ flex: 0.48 }}>
                      <Text style={styles.label}>Kết thúc:</Text>
                      <TouchableOpacity style={styles.inputNarrow} onPress={() => setShowETimePicker(true)}>
                        <View style={styles.metaRow}>
                          <IconSymbol name="clock.fill" size={14} color="#666" style={styles.metaIcon} />
                          <Text>{eTime.toTimeString().substring(0, 5)}</Text>
                        </View>
                      </TouchableOpacity>
                      {showETimePicker && (
                        <DateTimePicker
                          value={eTime}
                          mode="time"
                          display="default"
                          onChange={(e, d) => {
                            setShowETimePicker(false);
                            if (d) setETime(d);
                          }}
                        />
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    <TouchableOpacity
                      style={[styles.miniBtn, (schType === 'theory' || (viewMode === 'exam' && examSubType === 'Lý Thuyết')) && styles.miniBtnActive]}
                      onPress={() => (viewMode === 'exam' ? setExamSubType('Lý Thuyết') : setSchType('theory'))}
                    >
                      <Text style={[styles.miniBtnText, (schType === 'theory' || (viewMode === 'exam' && examSubType === 'Lý Thuyết')) && { color: '#FFF' }]}>Lý Thuyết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.miniBtn, (schType === 'practice' || (viewMode === 'exam' && examSubType === 'Tự Luận')) && styles.miniBtnActive]}
                      onPress={() => (viewMode === 'exam' ? setExamSubType('Tự Luận') : setSchType('practice'))}
                    >
                      <Text style={[styles.miniBtnText, (schType === 'practice' || (viewMode === 'exam' && examSubType === 'Tự Luận')) && { color: '#FFF' }]}>
                        {viewMode === 'exam' ? 'Tự Luận' : 'Thực Hành'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#CCC' }]}
                      onPress={() => {
                        setAddModalVisible(false);
                        resetAddModal();
                      }}
                    >
                      <Text style={{ color: '#333' }}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1B5E20' }]} onPress={handleAddSchedule}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{isEditing ? 'Cập Nhật' : 'Lưu Lịch'}</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            </View>
          )}
        </Modal>

        {/* Grade Edit Modal */}
        <Modal visible={gradeModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalBackDrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 15, textAlign: 'center' }}>NHẬP ĐIỂM SINH VIÊN</Text>
                <Text style={{ marginBottom: 2, color: '#666' }}>Sinh viên: <Text style={{ fontWeight: 'bold', color: '#000' }}>{selectedEnrollment?.full_name}</Text></Text>
                <Text style={{ marginBottom: 10, fontSize: 11, color: '#1B5E20' }}>Số buổi đi học thực tế: {selectedEnrollment?.present_count || 0} buổi</Text>

                <Text style={styles.label}>Điểm Chuyên cần (10%):</Text>
                <TextInput style={styles.inputNarrow} keyboardType="numeric" value={scoreInput.att} onChangeText={t => setScoreInput({ ...scoreInput, att: t })} placeholder="Nhập điểm CC..." />

                <Text style={styles.label}>Điểm Giữa kỳ (30%):</Text>
                <TextInput style={styles.inputNarrow} keyboardType="numeric" value={scoreInput.mid} onChangeText={t => setScoreInput({ ...scoreInput, mid: t })} placeholder="Nhập điểm GK..." />

                <Text style={styles.label}>Điểm Cuối kỳ (60%):</Text>
                <TextInput style={styles.inputNarrow} keyboardType="numeric" value={scoreInput.final} onChangeText={t => setScoreInput({ ...scoreInput, final: t })} placeholder="Nhập điểm CK..." />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CCC' }]} onPress={() => setGradeModalVisible(false)}><Text>Hủy</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#B71C1C' }]} onPress={handleUpdateGrade}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Lưu Điểm</Text></TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>

        {user.role === 'teacher' && (viewMode === 'study' || viewMode === 'exam') && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              resetAddModal();
              if (viewMode === 'exam') setSchType('exam' as any);
              setAddModalVisible(true);
            }}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 140 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#B71C1C', textAlign: 'center' },
  tabContainer: { marginBottom: 8 },
  tabBarScroll: { paddingLeft: 16, paddingRight: 30, flexDirection: 'row', height: 40, alignItems: 'center' },
  tabItem: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  tabItemActive: { backgroundColor: '#B71C1C', borderColor: '#B71C1C' },
  tabText: { fontWeight: '600', color: '#666', fontSize: 12 },
  tabTextActive: { color: '#FFF' },
  tabInner: { flexDirection: 'row', alignItems: 'center' },
  scanBtn: { backgroundColor: '#1B5E20', margin: 16, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  scanBtnContent: { flexDirection: 'row', alignItems: 'center' },
  scanBtnText: { color: '#FFF', fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, fontSize: 13 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 10, marginHorizontal: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  subjName: { fontWeight: 'bold', flex: 1 },
  roomBadge: { fontSize: 10, fontWeight: 'bold', padding: 4, borderRadius: 4 },
  cardText: { fontSize: 12, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaIcon: { marginRight: 6 },
  historyStatsBtn: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatsText: { fontSize: 13, fontWeight: 'bold', color: '#1976D2' },
  docCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1976D2' },
  docTitle: { fontWeight: 'bold', color: '#1B5E20' },
  docTypeBadge: { fontSize: 10, backgroundColor: '#E3F2FD', padding: 2 },
  docDesc: { fontSize: 11, color: '#888' },
  viewDocBtn: { backgroundColor: '#F0F7FF', padding: 8, borderRadius: 4, marginTop: 10, alignItems: 'center' },
  viewDocText: { color: '#1976D2', fontWeight: 'bold' },
  gradeCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  gradeSubject: { fontWeight: 'bold', marginBottom: 10 },
  gradeGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  gradeCol: { alignItems: 'center' },
  gradeLabel: { fontSize: 10, color: '#999' },
  gradeValue: { fontWeight: 'bold' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9F9F9', padding: 8, borderRadius: 4, marginTop: 8 },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreLabel: { fontSize: 10, color: '#444' },
  cameraBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraView: { width: '80%', aspectRatio: 1 },
  closeCamBtn: { backgroundColor: '#D32F2F', padding: 10, marginTop: 20 },
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 10 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  inputNarrow: { borderWidth: 1, borderColor: '#DDD', padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 13 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: '#F0F0F0', marginRight: 8, height: 32, justifyContent: 'center' },
  miniBtnActive: { backgroundColor: '#B71C1C' },
  miniBtnText: { fontSize: 11, color: '#666' },
  modalBtn: { padding: 12, borderRadius: 6, flex: 0.48, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 90, right: 20, backgroundColor: '#B71C1C', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  attendanceCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2E7D32', elevation: 1 },
  statusBadge: { fontSize: 11, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dropdownSearch: { backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, fontSize: 13 },
  inputPicker: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#F9F9F9', justifyContent: 'center' },
  dropdownOverlay: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, backgroundColor: '#FFF', marginBottom: 12, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownSearchInside: { backgroundColor: '#F9F9F9', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 13 }
});
