import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
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

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailInputError, setEmailInputError] = useState(false);

  const showError = (message: string) => {
    setEmailError(message);
    setEmailInputError(true);
    setTimeout(() => {
      setEmailError('');
      setEmailInputError(false);
    }, 3000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetLink = async () => {
    setEmailError('');
    setEmailInputError(false);

    if (!email) {
      showError('Must input email');
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset Link Sent',
        'Password reset link has been sent to your email. Please check your inbox and spam folder.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.log(error);
      let errorMessage = 'Failed to send reset link. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      showError(errorMessage);
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
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="key" size={40} color="#fff" />
          </View>
        </View>

        <Text style={styles.heading}>Forgot Password?</Text>
        <Text style={styles.subheading}>No worries, we'll send you reset instructions.</Text>

        <View style={styles.inputContainer}>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TextInput
            style={[
              styles.emailInput,
              styles.input,
              emailInputError && styles.inputError
            ]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.resetButton,
            isLoading && { opacity: 0.6 }
          ]}
          onPress={handleSendResetLink}
          disabled={isLoading}
        >
          <Text style={styles.resetButtonText}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: '-30%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9761A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 32,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Sansita',
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  emailInput: {
    paddingLeft: 16,
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  resetButton: {
    backgroundColor: '#F9761A',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  bottomText: {
    fontSize: 15,
    color: '#6c757d',
  },
  loginText: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 4,
  },
});
