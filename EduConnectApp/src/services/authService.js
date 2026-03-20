import axios from 'axios';

// Thay bằng IP hoặc Domain Backend thực tế của bạn (IP của thiết bị chạy Máy chủ, Vd: 192.168.1.10)
export const API_URL = 'http://192.168.1.17:3000/api';
// export const API_URL = 'http://127.0.0.1:3000/api';

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    // Logic: Backend trả về { success: true, data: { token, user } }
    if (response.data && response.data.success) {
      return response.data.data; // Trả về cục data chứa token và user
    } else {
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  } catch (error) {
    // Xử lý báo lỗi từ Backend (Sai pass, tài khoản bị khoá...)
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Lỗi kết nối máy chủ!');
  }
};
