import AvatarPickerModal from '@/components/AvatarPickerModal';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  deleteUser,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileContent() {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [avatar, setAvatar] = useState(require('@/assets/images/avatars/avatar1.png'));
  const [showPicker, setShowPicker] = useState(false);

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

    try {
      const credential = EmailAuthProvider.credential(user?.email || '', currentPassword);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, newPassword);
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
  if (!currentPassword) {
    Alert.alert('Re-authentication Required', 'Please enter your current password first.');
    return;
  }

  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to permanently delete your account?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Re-authenticate
            const credential = EmailAuthProvider.credential(user?.email || '', currentPassword);
            await reauthenticateWithCredential(user!, credential);

            // Now delete the user
            await deleteUser(user!);
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            router.replace('/');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]
  );
};


  return (
    <SafeAreaView className="flex-1 bg-[#FFE5D4]">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex flex-row justify-between items-center px-4 pt-4">
          <TouchableOpacity onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image source={require('@/assets/images/imgg.png')} className="w-10 h-10 rounded-full" />
          <View className="w-6" />
        </View>

        <View className="flex items-center mt-6">
          <View className="relative">
            <Image source={avatar} className="w-24 h-24 rounded-full bg-white border-2 border-gray-300" />
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1"
            >
              <Ionicons name="create" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-lg font-semibold mt-4">Welcome, User!</Text>
          <Text className="text-sm text-gray-600 mt-1 text-center px-6">
            Manage your profile picture, password or sign out below.
          </Text>
          <Text className="text-md font-medium mt-4 text-center px-6 text-green-700">
            Email: {user?.email}
          </Text>
        </View>

        <View className="mt-6 px-6">
          <Text className="text-base font-medium mb-2">Change Password:</Text>

          {[
            {
              placeholder: 'Current Password',
              value: currentPassword,
              setter: setCurrentPassword,
              show: showCurrent,
              toggle: () => setShowCurrent(!showCurrent),
            },
            {
              placeholder: 'New Password',
              value: newPassword,
              setter: setNewPassword,
              show: showNew,
              toggle: () => setShowNew(!showNew),
            },
            {
              placeholder: 'Confirm New Password',
              value: confirmPassword,
              setter: setConfirmPassword,
              show: showConfirm,
              toggle: () => setShowConfirm(!showConfirm),
            },
          ].map((field, index) => (
            <View key={index} className="relative mb-3">
              <TextInput
                placeholder={field.placeholder}
                secureTextEntry={!field.show}
                value={field.value}
                onChangeText={field.setter}
                className="border border-gray-300 rounded-md p-3 pr-10 bg-white"
              />
              <TouchableOpacity className="absolute right-3 top-3" onPress={field.toggle}>
                <Ionicons name={field.show ? 'eye' : 'eye-off'} size={22} color="#888" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={handleUpdatePassword} className="bg-blue-600 rounded-md py-3 mb-4">
            <Text className="text-white text-center font-semibold">Update Password</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignOut} className="bg-red-500 rounded-md py-3 mb-6">
            <Text className="text-white text-center font-semibold">Sign Out</Text>
          </TouchableOpacity>

          <View className="bg-red-100 p-4 rounded-lg border border-red-400">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={24} color="red" />
              <View className="ml-3 flex-1">
                <Text className="text-red-700 font-bold mb-1">Delete your account</Text>
                <Text className="text-sm text-red-700 mb-3">
                  This action is irreversible. It will delete your personal account, projects, and activity.
                </Text>
                <TouchableOpacity onPress={handleDeleteAccount} className="bg-red-600 rounded-md py-2">
                  <Text className="text-white text-center font-semibold">Delete Account</Text>
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
    </SafeAreaView>
  );
}
