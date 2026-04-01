import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, ScrollView, Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Schedule {
  id: number;
  subject_id: number;
  subject_name: string;
  room_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  teacher_email?: string; // added support
}

interface GradeItem {
  id: number;
  subject_name: string;
  attendance_score: number | null;
  midterm_score: number | null;
  final_score: number | null;
  overall_score: number | null;
}

export default function LMSScreen() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode for Student 
  const [viewMode, setViewMode] = useState<'schedule' | 'grades'>('schedule');
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Camera Permission - Student 
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Teacher View States
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      if (user.role === 'teacher') {
        const res = await axios.get(`${API_URL}/attendance/schedules?teacher_id=${user.id}`);
        if (res.data.success) setSchedules(res.data.data);
      } else {
        const res = await axios.get(`${API_URL}/student/schedules?student_id=${user.id}`);
        if (res.data.success) setSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);
      const res = await axios.get(`${API_URL}/student/grades?student_id=${user.id}`);
      if (res.data.success) setGrades(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchAttendees = async (scheduleId: number) => {
    try {
      setLoadingAttendees(true);
      const res = await axios.get(`${API_URL}/attendance/list/${scheduleId}`);
      if (res.data.success) setAttendees(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const openTeacherModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setAttendees([]);
    fetchAttendees(schedule.id);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setShowScanner(false);

    try {
      const scheduleId = parseInt(data);
      if (isNaN(scheduleId)) {
         Alert.alert('Lỗi', 'Dữ liệu QR Code không hợp lệ.');
         setScanned(false);
         return;
      }

      const res = await axios.post(`${API_URL}/attendance/check-in`, {
        schedule_id: scheduleId,
        student_id: user.id
      });

      if (res.data.success) {
        Alert.alert('Thành công', 'Điểm danh thành công!');
      }
    } catch (error: any) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra khi điểm danh.');
    } finally {
        setScanned(false);
    }
  };

  const openScanner = async () => {
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Quyền Truy Cập', 'Bạn cần cho phép truy cập Camera để quét điểm danh.');
        return;
      }
    }
    setShowScanner(true);
  };

  const renderItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity 
       style={styles.card} 
       onPress={() => user.role === 'teacher' && openTeacherModal(item)}
    >
      <View style={styles.cardHeader}>
         <Text style={styles.subjName}>{item.subject_name}</Text>
         <Text style={styles.roomBadge}>P. {item.room_name}</Text>
      </View>
      <Text style={styles.cardText}>📅 Ngày: {new Date(item.schedule_date).toLocaleDateString('vi-VN')}</Text>
      <Text style={styles.cardText}>⏰ Giờ: {item.start_time} - {item.end_time}</Text>
      {item.teacher_email && <Text style={styles.cardText}>👨‍🏫 Giám thị: {item.teacher_email}</Text>}
      {user.role === 'teacher' && (
         <Text style={{color: '#D32F2F', fontSize: 13, fontWeight: 'bold', marginTop: 10, alignSelf: 'flex-end'}}>
            👉 Bấm để Tạo QR Điểm Danh
         </Text>
      )}
    </TouchableOpacity>
  );

  const renderGradeItem = ({ item }: { item: GradeItem }) => (
    <View style={styles.gradeCard}>
      <Text style={styles.gradeSubject}>{item.subject_name}</Text>
      <View style={styles.gradeGrid}>
         <View style={styles.gradeCol}>
            <Text style={styles.gradeLabel}>Điểm danh</Text>
            <Text style={styles.gradeValue}>{item.attendance_score !== null ? item.attendance_score : '-'}</Text>
         </View>
         <View style={styles.gradeCol}>
            <Text style={styles.gradeLabel}>Giữa kỳ</Text>
            <Text style={styles.gradeValue}>{item.midterm_score !== null ? item.midterm_score : '-'}</Text>
         </View>
         <View style={styles.gradeCol}>
            <Text style={styles.gradeLabel}>Cuối kỳ</Text>
            <Text style={styles.gradeValue}>{item.final_score !== null ? item.final_score : '-'}</Text>
         </View>
         <View style={styles.gradeCol}>
            <Text style={styles.gradeLabel}>Tổng kết</Text>
            <Text style={[styles.gradeValue, {fontWeight: 'bold', color: '#B71C1C'}]}>{item.overall_score !== null ? item.overall_score : '-'}</Text>
         </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.role === 'teacher' ? '📜 Lịch Giảng Dạy' : '📅 Quản Lý Học Tập'}</Text>
      
      {user.role === 'student' && (
         <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabItem, viewMode === 'schedule' && styles.tabItemActive]} onPress={() => setViewMode('schedule')}>
               <Text style={[styles.tabText, viewMode === 'schedule' && styles.tabTextActive]}>Lịch Học / Thi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, viewMode === 'grades' && styles.tabItemActive]} onPress={() => { setViewMode('grades'); fetchGrades(); }}>
               <Text style={[styles.tabText, viewMode === 'grades' && styles.tabTextActive]}>Bảng Điểm</Text>
            </TouchableOpacity>
         </View>
      )}

      {user.role === 'student' && viewMode === 'schedule' && (
         <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
            <Text style={styles.scanBtnText}>📷 QUÉT QR ĐIỂM DANH</Text>
         </TouchableOpacity>
      )}

      {viewMode === 'schedule' ? (
        loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
        ) : schedules.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có lịch phát sinh.</Text>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
          />
        )
      ) : (
         loadingGrades ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 20 }} />
        ) : grades.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có điểm số.</Text>
        ) : (
          <FlatList 
             data={grades}
             keyExtractor={(item) => item.id.toString()}
             renderItem={renderGradeItem}
             contentContainerStyle={{ padding: 16 }}
          />
        )
      )}

      {/* 🔴 Student Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
         <View style={styles.cameraBackdrop}>
            <Text style={{color: '#FFF', fontSize: 16, marginBottom: 20, fontWeight: 'bold'}}>Hướng Camera vào Mã QR trên máy Giáo viên</Text>
            <CameraView 
               style={styles.cameraView} 
               barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
               onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <TouchableOpacity style={styles.closeCamBtn} onPress={() => setShowScanner(false)}>
               <Text style={{color: '#FFF', fontWeight: 'bold'}}>HỦY</Text>
            </TouchableOpacity>
         </View>
      </Modal>

      {/* 🔵 Teacher Modal (Attendee & QR generator) */}
      <Modal visible={!!selectedSchedule} animationType="fade" transparent={true}>
         <View style={styles.modalBackDrop}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Điểm Danh Lớp Học</Text>
               <Text style={{fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center'}}>{selectedSchedule?.subject_name}</Text>
               
               <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedSchedule?.id}` }}
                  style={styles.qrImage}
               />
               <Text style={{fontSize: 12, color: '#D32F2F', marginBottom: 15, fontStyle: 'italic'}}>Quét mã trên (Mạng lan Wi-Fi) để xác thực</Text>

               <Text style={{alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: 6, color: '#333'}}>Danh sách Sinh Viên đã đến ({attendees.length}):</Text>
               
               {loadingAttendees ? <ActivityIndicator size="small" color="#D32F2F" /> : (
                  <FlatList 
                     data={attendees}
                     keyExtractor={(a) => a.id.toString()}
                     style={{width: '100%', maxHeight: 160, marginBottom: 15}}
                     renderItem={({item}) => (
                        <View style={styles.attendeeItem}>
                            <Text style={{fontWeight: '500', fontSize: 13}}>{item.full_name || 'Học viên'}</Text>
                            <Text style={{color: '#666', fontSize: 11}}>{item.email}</Text>
                        </View>
                     )}
                     ListEmptyComponent={<Text style={{textAlign: 'center', color: '#999', fontSize: 13, marginTop: 10}}>Chưa có sinh viên nào điểm danh.</Text>}
                  />
               )}

               <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedSchedule(null)}>
                  <Text style={{color: '#FFF', fontWeight: 'bold'}}>Đóng</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#B71C1C', textAlign: 'center', marginBottom: 10 },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#DDD', marginBottom: 10 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#B71C1C' },
  tabText: { fontWeight: 'bold', color: '#666' },
  tabTextActive: { color: '#FFF' },

  scanBtn: { backgroundColor: '#1B5E20', marginHorizontal: 16, padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8, elevation: 3 },
  scanBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 30 },

  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, marginHorizontal: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjName: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  roomBadge: { backgroundColor: '#E0F2F1', color: '#00695C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  cardText: { fontSize: 13, color: '#666', marginTop: 4 },

  gradeCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, marginHorizontal: 16, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  gradeSubject: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  gradeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  gradeCol: { alignItems: 'center', flex: 1 },
  gradeLabel: { fontSize: 11, color: '#777', marginBottom: 4 },
  gradeValue: { fontSize: 15, color: '#333', fontWeight: '500' },

  cameraBackdrop: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraView: { width: '80%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 30 },
  closeCamBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },

  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F', marginBottom: 4 },
  qrImage: { width: 180, height: 180, marginBottom: 10 },
  attendeeItem: { width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  closeBtn: { backgroundColor: '#D32F2F', width: '100%', padding: 12, borderRadius: 8, alignItems: 'center' }
});
