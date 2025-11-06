import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../FirebaseConfig';
import { UserService } from '../services/userService';
import './global.css';

const COOLDOWN_DURATION = 300; 

const EmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNotVerifiedModal, setShowNotVerifiedModal] = useState(false);
  
 
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || '');
      
        if (user.emailVerified) {
          router.replace('/(tabs)/home');
        } else {
          
          setCooldownSeconds(COOLDOWN_DURATION);
        }
      } else {
     
        router.replace('/login');
      }
    });

    return unsubscribe;
  }, []);

  
  useEffect(() => {
    if (cooldownSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldownSeconds]);

  
  useEffect(() => {
    const isVisible = showSuccessModal || showResendModal || showErrorModal || showNotVerifiedModal;
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuccessModal, showResendModal, showErrorModal, showNotVerifiedModal]);

  const handleResendVerification = async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    setIsResending(true);
    try {
      await UserService.resendEmailVerification();
      setCooldownSeconds(COOLDOWN_DURATION); // Reset to 5-minute cooldown
      setShowResendModal(true);
    } catch (error: any) {
      console.error('Error resending verification:', error);
      setErrorMessage(error.message || 'Failed to resend verification email. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      await UserService.refreshUserData();
      const user = auth.currentUser;
      if (user && user.emailVerified) {
        setShowSuccessModal(true);
      } else {
        setShowNotVerifiedModal(true);
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      setErrorMessage('Failed to check verification status. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToHome = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/home');
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
              (isResending || cooldownSeconds > 0) && { opacity: 0.6 },
              cooldownSeconds > 0 && styles.resendButtonDisabled
            ]}
            onPress={handleResendVerification}
            disabled={isResending || cooldownSeconds > 0}
          >
            {isResending ? (
              <ActivityIndicator color="#F9761A" size="small" />
            ) : cooldownSeconds > 0 ? (
              <Text style={styles.resendButtonText}>
                Resend in {formatTime(cooldownSeconds)}
              </Text>
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

     
      <Modal visible={showSuccessModal} transparent animationType="none">
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              },
            ]}
          >
            <View style={styles.modalIconContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Email Verified!</Text>
            <Text style={styles.modalMessage}>
              Your email has been successfully verified. You can now access all features of CookSmart.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleContinueToHome}
            >
              <Text style={styles.modalButtonText}>Continue to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

 
      <Modal visible={showResendModal} transparent animationType="none">
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              },
            ]}
          >
            <View style={styles.modalIconContainer}>
              <View style={styles.resendIconCircle}>
                <Ionicons name="mail" size={64} color="#F9761A" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Verification Email Sent!</Text>
            <Text style={styles.modalMessage}>
              A new verification email has been sent to your email address. Please check your inbox and spam folder.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowResendModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

    
      <Modal visible={showErrorModal} transparent animationType="none">
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              },
            ]}
          >
            <View style={styles.modalIconContainer}>
              <View style={styles.errorIconCircle}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonError]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      
      <Modal visible={showNotVerifiedModal} transparent animationType="none">
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              },
            ]}
          >
            <View style={styles.modalIconContainer}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="warning" size={64} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Not Verified Yet</Text>
            <Text style={styles.modalMessage}>
              Your email is not verified yet. Please check your email and click the verification link to continue.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonWarning]}
              onPress={() => setShowNotVerifiedModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
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
  resendButtonDisabled: {
    borderColor: '#ccc',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Sansita',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: '#F9761A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#F9761A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonError: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  modalButtonWarning: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
