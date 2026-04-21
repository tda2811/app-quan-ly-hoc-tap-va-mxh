import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface GroupItem {
  id: number;
  name: string;
  group_type: string;
  cover_url: string | null;
  member_count: number;
  joined_role: string | null;
}

export default function GroupsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/student/all-groups?user_id=${user.id}`);
      if (res.data.success) {
        setGroups(res.data.data);
      }
    } catch (e) {
      console.error('Lỗi lấy danh sách nhóm:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleJoin = async (group: GroupItem) => {
    if (group.joined_role) return;

    try {
      const res = await axios.post(`${API_URL}/student/groups/join`, {
        user_id: user.id,
        group_id: group.id
      });
      if (res.data.success) {
        Alert.alert('Thành công', `Bạn đã tham gia nhóm ${group.name}`);
        fetchGroups(); // Reload
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tham gia nhóm.');
    }
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case 'class_group': return 'Lớp học';
      case 'cohort_group': return 'Khóa học';
      case 'custom_group': return 'Cộng đồng';
      default: return 'Nhóm';
    }
  };

  const renderItem = ({ item }: { item: GroupItem }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => {
        if (item.joined_role) {
          router.push({
            pathname: '/group-detail',
            params: { id: item.id, name: item.name }
          });
        } else {
          Alert.alert('Tham gia nhóm', `Bạn cần tham gia nhóm "${item.name}" để xem nội dung bên trong.`);
        }
      }}
    >
      <Image 
        source={{ uri: item.cover_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.cover}
      />
      <View style={styles.cardInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={[styles.typeBadge, {backgroundColor: item.group_type === 'custom_group' ? '#F3E5F5' : '#E3F2FD'}]}>
            <Text style={[styles.typeText, {color: item.group_type === 'custom_group' ? '#7B1FA2' : '#1976D2'}]}>
              {getGroupTypeLabel(item.group_type)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.memberCount}>👥 {item.member_count} thành viên</Text>
        
        {item.joined_role ? (
          <TouchableOpacity 
            style={[styles.joinBtn, styles.joinedBtn]}
            onPress={() => {
               router.push({
                 pathname: '/group-detail',
                 params: { id: item.id, name: item.name }
               });
            }}
          >
            <Text style={styles.joinedText}>✓ Đã tham gia - Vào nhóm</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.infoBadge}>
            <Text style={styles.lockedText}>🔒 Nhóm kín (Liên hệ Admin/GV để tham gia)</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hội Nhóm & Cộng Đồng</Text>
        <Text style={styles.subtitle}>Kết nối và trao đổi cùng những người cùng đam mê.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.2.fill" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Chưa có nhóm nào khả dụng.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: '#EEE',
  },
  cardInfo: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  joinBtn: {
    backgroundColor: '#1B5E20',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinedBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  joinText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  joinedText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  infoBadge: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
  },
  lockedText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  }
});
