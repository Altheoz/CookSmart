import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../FirebaseConfig';
import { UserService } from '../services/userService';
import './global.css';

const EmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || '');
      
        if (user.emailVerified) {
          router.replace('/(tabs)/home');
        }
      } else {
     
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await UserService.resendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your email address. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error resending verification:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to resend verification email. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      await UserService.refreshUserData();
      const user = auth.currentUser;
      if (user && user.emailVerified) {
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified. You can now access all features.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)/home')
            }
          ]
        );
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email is not verified yet. Please check your email and click the verification link.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      Alert.alert(
        'Error',
        'Failed to check verification status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSignOut} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={60} color="#fff" />
          </View>
        </View>

        <Text style={styles.heading}>Verify Your Email</Text>
        <Text style={styles.subheading}>
          We've sent a verification email to:
        </Text>
        <Text style={styles.emailText}>{userEmail}</Text>
        
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <Text style={styles.instructionsText}>
            Don't forget to check your spam folder if you don't see the email.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isLoading && { opacity: 0.6 }
            ]}
            onPress={handleCheckVerification}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>I've Verified My Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              isResending && { opacity: 0.6 }
            ]}
            onPress={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator color="#F9761A" size="small" />
            ) : (
              <Text style={styles.resendButtonText}>Resend Verification Link</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Having trouble? The verification email might take a few minutes to arrive.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmailVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: '-20%',
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    marginBottom: 16,
    fontFamily: 'Sansita',
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 18,
    color: '#F9761A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 30,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#F9761A',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resendButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F9761A',
  },
  resendButtonText: {
    color: '#F9761A',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
