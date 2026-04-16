import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập Email và Mật khẩu.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      setIsLoading(false);

      login(data.user, data.token);

      Alert.alert("Thành công", `Chào mừng trở lại, ${data.user?.full_name || email}`);
    } catch (error) {
      setIsLoading(false);
      setErrorMsg(error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        {/* LOGO TRƯỜNG HOẶC APP */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>EduConnect</Text>
        <Text style={styles.subtitle}>Mạng Xã Hội & Quản Lý Học Tập</Text>

        {/* HIỂN THỊ LỖI */}
        {errorMsg !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* INPUT EMAIL */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email Trường (Mã SV)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: sv123@student.edu.vn"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMsg('');
            }}
          />
        </View>

        {/* INPUT PASSWORD */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu..."
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMsg('');
            }}
          />
        </View>

        {/* NÚT QUÊN MẬT KHẨU */}
        {/* <TouchableOpacity style={styles.forgotPassBtn}>
          <Text style={styles.forgotPassText}>Quên Mật Khẩu?</Text>
        </TouchableOpacity> */}

        {/* NÚT ĐĂNG NHẬP */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng Nhập</Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFD',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B71C1C', // Màu Đỏ
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  forgotPassBtn: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassText: {
    color: '#B71C1C', // Màu Đỏ
    fontWeight: '600',
    fontSize: 13,
  },
  loginButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#B71C1C', // Màu Đỏ
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#EF9A9A', // Đỏ Nhạt 
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
