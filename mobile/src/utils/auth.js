import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setSession(token, user) {
  await AsyncStorage.multiSet([
    ['token', token],
    ['user', JSON.stringify(user || {})]
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['token', 'user']);
}

export async function getUser() {
  const raw = await AsyncStorage.getItem('user');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}
