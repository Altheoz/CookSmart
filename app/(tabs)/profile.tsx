import AvatarPickerModal from '@/components/AvatarPickerModal';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserService } from '../../services/userService';

export default function ProfileContent() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [avatar, setAvatar] = useState(require('@/assets/images/avatars/avatar_1.jpg'));
  const [showPicker, setShowPicker] = useState(false);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const passwordMismatch = useMemo(() => {
    return newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  const isWeakPassword = useMemo(() => {
    return newPassword.length > 0 && newPassword.length < 8;
  }, [newPassword]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [showReauthPassword, setShowReauthPassword] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [reauthPasswordError, setReauthPasswordError] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      const uri = await AsyncStorage.getItem('userAvatar');
      if (uri) setAvatar({ uri });
    };
    loadAvatar();
  }, []);

  const handleSelectAvatar = async (imgPath: any) => {
    const resolved = Image.resolveAssetSource(imgPath);
    setAvatar({ uri: resolved.uri });
    await AsyncStorage.setItem('userAvatar', resolved.uri);
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Please use at least 8 characters.');
      return;
    }

   
    setShowReauthModal(true);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Password Required', 'Please enter your current password.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    try {
      setIsDeleting(true);
      
     
      const credential = EmailAuthProvider.credential(user.email || '', deletePassword);
      await reauthenticateWithCredential(user, credential);
      
    
      await UserService.deleteUser(user.uid);
      
      
      await AsyncStorage.removeItem('userAvatar');
      
      setShowDeleteModal(false);
      Alert.alert(
        'Account Deleted', 
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/')
          }
        ]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      const code: string = error?.code || '';
      
      if (
        code.includes('wrong-password') ||
        code.includes('invalid-credential') ||
        code.includes('invalid-login-credentials')
      ) {
        setDeletePasswordError(true);
        setTimeout(() => setDeletePasswordError(false), 2000);
      } else if (code.includes('requires-recent-login')) {
        Alert.alert(
          'Re-authentication Required',
          'For security reasons, please sign out and sign back in before deleting your account.'
        );
      } else {
        Alert.alert(
          'Deletion Failed', 
          error.message || 'Failed to delete account. Please try again or contact support.'
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReauthAndUpdate = async () => {
    if (!reauthPassword) {
      Alert.alert('Password Required', 'Please enter your current password.');
      return;
    }
    try {
      setIsReauthing(true);
      const credential = EmailAuthProvider.credential(user?.email || '', reauthPassword);
      await reauthenticateWithCredential(user!, credential);
      setIsUpdatingPassword(true);
      await updatePassword(user!, newPassword);
      setShowReauthModal(false);
      setReauthPassword('');
      setShowReauthPassword(false);
      Alert.alert('Success', 'Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const code: string = error?.code || '';
      if (
        code.includes('wrong-password') ||
        code.includes('invalid-credential') ||
        code.includes('invalid-login-credentials')
      ) {
        setReauthPasswordError(true);
        setTimeout(() => setReauthPasswordError(false), 2000);
      } else {
        Alert.alert('Error', error.message || 'Re-authentication failed.');
      }
    } finally {
      setIsReauthing(false);
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFE5D4]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex flex-row items-center px-4 pt-4">
          <TouchableOpacity onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-xl font-semibold">Profile</Text>
          </View>
          <View className="w-6" />
        </View>

        <View className="flex items-center mt-6 px-6">
          <View className="relative">
            <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.8}>
              <Image source={avatar} className="w-28 h-28 rounded-full bg-white border-2 border-gray-300" />
              <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 shadow">
                <Ionicons name="create" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <Text className="text-lg font-semibold mt-4">Welcome, User!</Text>
          <Text className="text-sm text-gray-600 mt-1 text-center">
            Manage your profile picture, password or sign out below.
          </Text>
          <Text className="text-md font-medium mt-3 text-center text-green-700">
            {user?.email}
          </Text>
          <Text className="text-xs text-gray-500 mt-2">Tap your avatar to change it</Text>
        </View>

        <View className="mt-6 px-6">
          <Text className="text-base font-semibold mb-2">Change Password</Text>
          <Text className="text-xs text-gray-600 mb-4">Use at least 8 characters. Avoid using your old password.</Text>

          {[
            {
              placeholder: 'New Password',
              value: newPassword,
              setter: setNewPassword,
              show: showNew,
              toggle: () => setShowNew(!showNew),
              key: 'new',
            },
            {
              placeholder: 'Confirm New Password',
              value: confirmPassword,
              setter: setConfirmPassword,
              show: showConfirm,
              toggle: () => setShowConfirm(!showConfirm),
              key: 'confirm',
            },
          ].map((field) => (
            <View key={field.key} className="relative mb-4">
              <Text className="text-xs text-gray-700 mb-1">{field.placeholder}</Text>
              <TextInput
                placeholder={field.placeholder}
                secureTextEntry={!field.show}
                value={field.value}
                onChangeText={field.setter}
                className="border border-gray-300 rounded-md p-3 pr-10 bg-white"
              />
              <TouchableOpacity className="absolute right-3 top-8" onPress={field.toggle}>
                <Ionicons name={field.show ? 'eye' : 'eye-off'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
          ))}

          {passwordMismatch && (
            <Text className="text-xs text-red-600 mb-2">New passwords do not match.</Text>
          )}
          {isWeakPassword && !passwordMismatch && (
            <Text className="text-xs text-amber-700 mb-2">Password seems weak. Try 8+ characters.</Text>
          )}

          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={isUpdatingPassword || !newPassword || !confirmPassword || passwordMismatch || isWeakPassword}
            className={`bg-blue-600 rounded-md py-3 mb-4 ${isUpdatingPassword || !newPassword || !confirmPassword || passwordMismatch || isWeakPassword ? 'opacity-60' : ''}`}
          >
            {isUpdatingPassword ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-center font-semibold ml-2">Updating...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold">Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignOut} disabled={isSigningOut} className={`bg-red-500 rounded-md py-3 mb-6 ${isSigningOut ? 'opacity-60' : ''}`}>
            {isSigningOut ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-center font-semibold ml-2">Signing Out...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold">Sign Out</Text>
            )}
          </TouchableOpacity>

          <View className="bg-red-50 p-4 rounded-lg border border-red-200">
            <Text className="text-red-700 font-bold mb-2">Danger Zone</Text>
            <View className="flex-row items-start">
              <Ionicons name="warning" size={22} color="#b91c1c" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-red-700 mb-2">Deleting your account is permanent and cannot be undone.</Text>
                <TouchableOpacity onPress={() => setShowDeleteModal(true)} disabled={isDeleting} className={`bg-red-600 rounded-md py-2 ${isDeleting ? 'opacity-60' : ''}`}>
                  {isDeleting ? (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator color="#fff" />
                      <Text className="text-white text-center font-semibold ml-2">Deleting...</Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-semibold">Delete Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <AvatarPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectAvatar={handleSelectAvatar}
      />

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-xl w-full">
            <Text className="text-lg font-semibold text-center mb-1 text-red-700">Confirm Delete</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">Enter your current password to continue.</Text>
            <Text className="text-xs text-gray-700 mb-1">Current Password</Text>
            {deletePasswordError && (
              <Text className="text-xs text-red-600 mb-1">Wrong password</Text>
            )}
            <View className="relative mb-4">
              <TextInput
                placeholder="Current Password"
                secureTextEntry={!showDeletePassword}
                value={deletePassword}
                onChangeText={(t) => { setDeletePassword(t); if (deletePasswordError) setDeletePasswordError(false); }}
                className={`border ${deletePasswordError ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 pr-10 bg-white`}
              />
              <TouchableOpacity className="absolute right-3 top-3" onPress={() => setShowDeletePassword((v) => !v)}>
                <Ionicons name={showDeletePassword ? 'eye' : 'eye-off'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => { setShowDeleteModal(false); setDeletePassword(''); setShowDeletePassword(false); }} className="flex-1 bg-gray-200 rounded-md py-3">
                <Text className="text-center font-semibold text-gray-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccount} disabled={isDeleting || !deletePassword} className={`flex-1 bg-red-600 rounded-md py-3 ${isDeleting || !deletePassword ? 'opacity-60' : ''}`}>
                {isDeleting ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white text-center font-semibold ml-2">Deleting...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-semibold">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReauthModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white p-5 rounded-xl w-full">
            <Text className="text-lg font-semibold text-center mb-1">Re-authenticate</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">Enter your current password to proceed.</Text>
            <Text className="text-xs text-gray-700 mb-1">Current Password</Text>
            {reauthPasswordError && (
              <Text className="text-xs text-red-600 mb-1">Wrong password</Text>
            )}
            <View className="relative mb-4">
              <TextInput
                placeholder="Current Password"
                secureTextEntry={!showReauthPassword}
                value={reauthPassword}
                onChangeText={(t) => { setReauthPassword(t); if (reauthPasswordError) setReauthPasswordError(false); }}
                className={`border ${reauthPasswordError ? 'border-red-500' : 'border-gray-300'} rounded-md p-3 pr-10 bg-white`}
              />
              <TouchableOpacity className="absolute right-3 top-3" onPress={() => setShowReauthPassword((v) => !v)}>
                <Ionicons name={showReauthPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => { setShowReauthModal(false); setReauthPassword(''); setShowReauthPassword(false); }} className="flex-1 bg-gray-200 rounded-md py-3">
                <Text className="text-center font-semibold text-gray-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReauthAndUpdate} disabled={isReauthing || !reauthPassword} className={`flex-1 bg-blue-600 rounded-md py-3 ${isReauthing || !reauthPassword ? 'opacity-60' : ''}`}>
                {isReauthing ? (
                  <View className="flex-row justify-center items-center">
                    <ActivityIndicator color="#fff" />
                    <Text className="text-white text-center font-semibold ml-2">Updating...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-semibold">Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
