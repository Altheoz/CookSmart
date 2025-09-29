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
    Animated,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
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


  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
  
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        console.error('Account deletion error:', error);
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
        console.error('Re-authentication error:', error);
        Alert.alert('Error', error.message || 'Re-authentication failed.');
      }
    } finally {
      setIsReauthing(false);
      setIsUpdatingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      
      <View className="bg-orange-500"  style={{
            borderBottomEndRadius: 60,
            borderBottomStartRadius: 60,
          }}>
        <View
          style={{
            backgroundColor: '#FF8A65',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
            borderBottomEndRadius: 30,
            borderBottomStartRadius: 30,
          }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity 
              onPress={() => router.push('/')}
              className="bg-white/20 rounded-full p-2 backdrop-blur-sm"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Profile</Text>
            <View className="w-10" />
          </View>

       
          <View className="items-center">
            <View className="relative mb-4">
              <TouchableOpacity 
                onPress={() => setShowPicker(true)} 
                activeOpacity={0.8}
                style={{
                  transform: [{ scale: 1 }],
                }}
              >
                <View className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 shadow-2xl">
                  <Image 
                    source={avatar} 
                    className="w-full h-full rounded-full" 
                    resizeMode="cover"
                  />
                </View>
                <View className="absolute bottom-1 right-2 bg-white rounded-full p-2 shadow-lg">
                  <Ionicons name="pencil" size={20} color="#FF6B9D" />
                </View>
              </TouchableOpacity>
            </View>

            <Text className="text-white text-2xl font-bold mb-2">Welcome Back!</Text>
            <Text className="text-white/90 text-base text-center mb-3">
              Manage your account settings and preferences
            </Text>
            <View className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Text className="text-white font-medium text-sm">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
      
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mx-6 mt-6 bg-white rounded-2xl shadow-lg p-6"
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 rounded-full p-3 mr-3">
              <Ionicons name="lock-closed" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">Security Settings</Text>
              <Text className="text-sm text-gray-500">Manage your password and security</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mb-4">Use at least 8 characters. Avoid using your old password.</Text>

          {[
            {
              placeholder: 'New Password',
              value: newPassword,
              setter: setNewPassword,
              show: showNew,
              toggle: () => setShowNew(!showNew),
              key: 'new',
              icon: 'key',
            },
            {
              placeholder: 'Confirm New Password',
              value: confirmPassword,
              setter: setConfirmPassword,
              show: showConfirm,
              toggle: () => setShowConfirm(!showConfirm),
              key: 'confirm',
              icon: 'checkmark-circle',
            },
          ].map((field) => (
            <View key={field.key} className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name={field.icon as any} size={16} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-2 font-medium">{field.placeholder}</Text>
              </View>
              <View className="relative">
                <TextInput
                  placeholder={field.placeholder}
                  secureTextEntry={!field.show}
                  value={field.value}
                  onChangeText={field.setter}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 pr-12 text-gray-800"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity 
                  className="absolute right-4 top-4" 
                  onPress={field.toggle}
                >
                  <Ionicons 
                    name={field.show ? 'eye' : 'eye-off'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {passwordMismatch && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-sm text-red-600 ml-2">New passwords do not match.</Text>
            </View>
          )}
          {isWeakPassword && !passwordMismatch && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text className="text-sm text-amber-600 ml-2">Password seems weak. Try 8+ characters.</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={isUpdatingPassword || !newPassword || !confirmPassword || passwordMismatch || isWeakPassword}
            style={{
              backgroundColor: isUpdatingPassword || !newPassword || !confirmPassword || passwordMismatch || isWeakPassword 
                ? '#9CA3AF' 
                : '#3B82F6',
              borderRadius: 12,
              paddingVertical: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {isUpdatingPassword ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-center font-semibold ml-2">Updating...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Update Password</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

     
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mx-6 mt-4 bg-white rounded-2xl shadow-lg p-6"
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-orange-100 rounded-full p-3 mr-3">
              <Ionicons name="log-out" size={24} color="#F97316" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">Account Actions</Text>
              <Text className="text-sm text-gray-500">Sign out or manage your account</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleSignOut} 
            disabled={isSigningOut} 
            style={{
              backgroundColor: isSigningOut ? '#9CA3AF' : '#F97316',
              borderRadius: 12,
              paddingVertical: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {isSigningOut ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="#fff" />
                <Text className="text-white text-center font-semibold ml-2">Signing Out...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-lg">Sign Out</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

       
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mx-6 mt-4 bg-white rounded-2xl shadow-lg p-6 border border-red-100"
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-red-100 rounded-full p-3 mr-3">
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <View>
              <Text className="text-lg font-bold text-red-700">Danger Zone</Text>
              <Text className="text-sm text-red-500">Permanent actions that cannot be undone</Text>
            </View>
          </View>

          <View className="bg-red-50 rounded-xl p-4 border border-red-200">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-red-700 mb-3 font-medium">
                  Deleting your account is permanent and cannot be undone. All your data will be lost.
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowDeleteModal(true)} 
                  disabled={isDeleting} 
                  style={{
                    backgroundColor: isDeleting ? '#9CA3AF' : '#DC2626',
                    borderRadius: 12,
                    paddingVertical: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
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
        </Animated.View>
      </ScrollView>

      <AvatarPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectAvatar={handleSelectAvatar}
      />

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <View className="p-6">
              <View className="items-center mb-4">
                <View className="bg-red-100 rounded-full p-4 mb-3">
                  <Ionicons name="warning" size={32} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-800 mb-2">Confirm Account Deletion</Text>
                <Text className="text-sm text-gray-600 text-center">
                  Enter your current password to permanently delete your account. This action cannot be undone.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm text-gray-700 mb-2 font-medium">Current Password</Text>
                {deletePasswordError && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text className="text-sm text-red-600 ml-2">Incorrect password</Text>
                  </View>
                )}
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    secureTextEntry={!showDeletePassword}
                    value={deletePassword}
                    onChangeText={(t) => { setDeletePassword(t); if (deletePasswordError) setDeletePasswordError(false); }}
                    className={`bg-gray-50 border ${
                      deletePasswordError ? 'border-red-500' : 'border-gray-200'
                    } rounded-xl p-4 pr-12 text-gray-800`}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    className="absolute right-4 top-4" 
                    onPress={() => setShowDeletePassword((v) => !v)}
                  >
                    <Ionicons 
                      name={showDeletePassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => { 
                    setShowDeleteModal(false); 
                    setDeletePassword(''); 
                    setShowDeletePassword(false); 
                  }} 
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    paddingVertical: 16,
                  }}
                >
                  <Text className="text-center font-semibold text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDeleteAccount} 
                  disabled={isDeleting || !deletePassword} 
                  style={{
                    flex: 1,
                    backgroundColor: isDeleting || !deletePassword ? '#9CA3AF' : '#DC2626',
                    borderRadius: 12,
                    paddingVertical: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
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
        </View>
      </Modal>

      <Modal visible={showReauthModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <View className="p-6">
              <View className="items-center mb-4">
                <View className="bg-blue-100 rounded-full p-4 mb-3">
                  <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
                </View>
                <Text className="text-xl font-bold text-gray-800 mb-2">Security Verification</Text>
                <Text className="text-sm text-gray-600 text-center">
                  Enter your current password to proceed with the password update.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm text-gray-700 mb-2 font-medium">Current Password</Text>
                {reauthPasswordError && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text className="text-sm text-red-600 ml-2">Incorrect password</Text>
                  </View>
                )}
                <View className="relative">
                  <TextInput
                    placeholder="Enter your password"
                    secureTextEntry={!showReauthPassword}
                    value={reauthPassword}
                    onChangeText={(t) => { setReauthPassword(t); if (reauthPasswordError) setReauthPasswordError(false); }}
                    className={`bg-gray-50 border ${
                      reauthPasswordError ? 'border-red-500' : 'border-gray-200'
                    } rounded-xl p-4 pr-12 text-gray-800`}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    className="absolute right-4 top-4" 
                    onPress={() => setShowReauthPassword((v) => !v)}
                  >
                    <Ionicons 
                      name={showReauthPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity 
                  onPress={() => { 
                    setShowReauthModal(false); 
                    setReauthPassword(''); 
                    setShowReauthPassword(false); 
                  }} 
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    paddingVertical: 16,
                  }}
                >
                  <Text className="text-center font-semibold text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleReauthAndUpdate} 
                  disabled={isReauthing || !reauthPassword} 
                  style={{
                    flex: 1,
                    backgroundColor: isReauthing || !reauthPassword ? '#9CA3AF' : '#3B82F6',
                    borderRadius: 12,
                    paddingVertical: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
