import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { io } from 'socket.io-client';

export default function ChatScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Chat Views
  const [selectedChat, setSelectedChat] = useState<any>(null); // Current chat thread
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState<any>(null);

  // New Chat Modal
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initialise Socket
    const host = API_URL.replace('/api', '');
    const socketInstance = io(host);
    setSocket(socketInstance);

    fetchConversations();

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !selectedChat) return;

    socket.emit('join_chat', selectedChat.id);

    socket.on('receive_message', (newMessage: any) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, selectedChat]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/conversations/${user.id}`);
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Fetch conversation crash:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await axios.get(`${API_URL}/chat/messages/${convId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Fetch input log crash:', err);
    }
  };

  const handleOpenChat = (chat: any) => {
    setSelectedChat(chat);
    setMessages([]);
    fetchMessages(chat.id);
  };

  const sendMessage = () => {
    if (!inputMsg.trim() || !socket || !selectedChat) return;

    const payload = {
      conversation_id: selectedChat.id,
      sender_id: user.id,
      content: inputMsg.trim(),
    };

    socket.emit('send_message', payload);
    setInputMsg('');
  };

  const openNewChat = async () => {
    setNewChatModalVisible(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      if (res.data.success) {
        setUserList(res.data.data.filter((u: any) => u.id !== user.id));
      }
    } catch (err) {
      console.error('Error fetching search views:', err);
    }
  };

  const startPrivateChat = async (receiverId: string) => {
    try {
      const res = await axios.post(`${API_URL}/chat/conversations`, {
        senderId: user.id,
        receiverId: receiverId,
      });
      if (res.data.success) {
        setNewChatModalVisible(false);
        fetchConversations(); // Reload
        handleOpenChat(res.data.data); // Open that chat
      }
    } catch (err) {
      console.error('Create Chat Crash:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tin Nhắn</Text>
        <TouchableOpacity onPress={openNewChat}>
          <IconSymbol name={"plus" as any} size={28} color="#B71C1C" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B71C1C" style={{ marginTop: 20 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Chưa có cuộc trò chuyện nào.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={openNewChat}>
            <Text style={styles.startBtnText}>Trò Chuyện Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatHeader} onPress={() => handleOpenChat(item)}>
              <View style={styles.avatarPlaceholder}><Text style={{ color: '#FFF' }}>👤</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatName}>{item.display_name || 'Hội thoại'}</Text>
                <Text style={styles.chatType}>{item.type === 'private' ? 'Cá nhân' : 'Nhóm'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Chat Conversation Modal Layout */}
      <Modal visible={!!selectedChat} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.convHeader}>
            <TouchableOpacity onPress={() => setSelectedChat(null)}>
              <IconSymbol name={"chevron.left" as any} size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.convTitle}>{selectedChat?.display_name || 'Hội thoại'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user.id;
              return (
                <View style={[styles.msgContainer, isMine ? styles.msgMine : styles.msgTheirs]}>
                  <Text style={[styles.msgText, isMine && { color: '#FFF' }]}>{item.content}</Text>
                </View>
              );
            }}
            contentContainerStyle={{ padding: 15 }}
          />

          <View style={styles.inputBar}>
            <TextInput style={styles.inputField} placeholder="Nhập tin nhắn..." value={inputMsg} onChangeText={setInputMsg} />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <IconSymbol name={"paperplane.fill" as any} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Chat Contacts Modal */}
      <Modal visible={newChatModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackDrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn người muốn nhắn</Text>
            <FlatList
              data={userList}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.contactItem} onPress={() => startPrivateChat(item.id)}>
                  <Text style={{ fontWeight: '600' }}>{item.full_name || item.email}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{item.role === 'teacher' ? 'Giảng Viên' : 'Sinh Viên'}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setNewChatModalVisible(false)}>
              <Text style={{ color: '#D32F2F' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B71C1C' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999', marginBottom: 12 },
  startBtn: { backgroundColor: '#B71C1C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  startBtnText: { color: '#FFF', fontWeight: 'bold' },
  chatHeader: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 1 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  chatName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  chatType: { fontSize: 12, color: '#666', marginTop: 2 },
  
  // Conversation View Styles
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'ios' ? 45 : 20, borderBottomWidth: 1, borderColor: '#EEE', alignItems: 'center', backgroundColor: '#FFF' },
  convTitle: { fontSize: 18, fontWeight: 'bold' },
  msgContainer: { maxWidth: '75%', padding: 10, borderRadius: 12, marginBottom: 10 },
  msgTheirs: { alignSelf: 'flex-start', backgroundColor: '#E0E0E0' },
  msgMine: { alignSelf: 'flex-end', backgroundColor: '#B71C1C' },
  msgText: { fontSize: 15, color: '#333' },
  inputBar: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
  inputField: { flex: 1, backgroundColor: '#F0F2F5', height: 44, borderRadius: 20, paddingHorizontal: 15, fontSize: 15 },
  sendBtn: { width: 44, height: 44, backgroundColor: '#B71C1C', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  
  // Modal Settings
  modalBackDrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 20, borderRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  contactItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEE' },
  closeBtn: { marginTop: 15, alignSelf: 'center' }
});
