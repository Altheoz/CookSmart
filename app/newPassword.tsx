import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth } from '../FirebaseConfig';
import './global.css';

const NewPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    // Get the oobCode from the URL parameters
    // In a real app, you'd extract this from the deep link
    // For now, we'll simulate it with a placeholder
    const urlParams = new URLSearchParams(window.location?.search || '');
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
    }
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!oobCode) {
      Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    try {
      // Verify the reset code first
      await verifyPasswordResetCode(auth, oobCode);
      
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.log(error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid or expired reset link. Please request a new password reset.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Reset link has expired. Please request a new password reset.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        <Text style={styles.heading}>Create New Password</Text>
        <Text style={styles.subheading}>
          Enter your new password below
        </Text>

        <View style={styles.passwordInputWrapper}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={isPasswordHidden}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setIsPasswordHidden(!isPasswordHidden)}>
            <Ionicons
              name={isPasswordHidden ? 'eye-off' : 'eye'}
              size={22}
              color="#555"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordInputWrapper}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={isConfirmPasswordHidden}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}>
            <Ionicons
              name={isConfirmPasswordHidden ? 'eye-off' : 'eye'}
              size={22}
              color="#555"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={styles.resetButtonText}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomTextWrapper}>
          <Text style={styles.bottomText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NewPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: '-40%',
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: '15%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
  },
  bottomText: {
    fontSize: 14,
    color: '#333',
  },
  loginText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
});
