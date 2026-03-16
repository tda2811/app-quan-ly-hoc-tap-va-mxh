import { Redirect } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';

export default function EntryScreen() {
  // Màn hình khởi điểm của App sẽ là Màn hình Đăng Nhập
  // Giao diện này không có TabMenu ở dưới vì nó nằm ngoài folder (tabs)
  return <LoginScreen />;
}
