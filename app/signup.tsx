import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../FirebaseConfig';
import { UserService } from '../services/userService';
import './global.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailInputError, setEmailInputError] = useState(false);
  const [passwordInputError, setPasswordInputError] = useState(false);
  const [confirmPasswordInputError, setConfirmPasswordInputError] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        router.replace('/(tabs)/home');
      }
    });

    return unsubscribe;
  }, []);

  const showError = (type: 'email' | 'password' | 'confirmPassword', message: string) => {
    if (type === 'email') {
      setEmailError(message);
      setEmailInputError(true);
      setTimeout(() => {
        setEmailError('');
        setEmailInputError(false);
      }, 3000);
    } else if (type === 'password') {
      setPasswordError(message);
      setPasswordInputError(true);
      setTimeout(() => {
        setPasswordError('');
        setPasswordInputError(false);
      }, 3000);
    } else {
      setConfirmPasswordError(message);
      setConfirmPasswordInputError(true);
      setTimeout(() => {
        setConfirmPasswordError('');
        setConfirmPasswordInputError(false);
      }, 3000);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setEmailInputError(false);
    setPasswordInputError(false);
    setConfirmPasswordInputError(false);


    if (!email) {
      showError('email', 'Must input email');
      return;
    }
    if (!validateEmail(email)) {
      showError('email', 'Please enter a valid email');
      return;
    }
    if (!password) {
      showError('password', 'Must input password');
      return;
    }
    if (password.length < 6) {
      showError('password', 'Password must be at least 6 characters');
      return;
    }
    if (!confirmPassword) {
      showError('confirmPassword', 'Must confirm password');
      return;
    }
    if (password !== confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms and Conditions to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await UserService.createUser(email, password, 'user');
      
      router.replace('/EmailVerification');
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/email-already-in-use') {
        showError('email', 'Email is already registered');
      } else if (error.code === 'auth/weak-password') {
        showError('password', 'Password is too weak');
      } else {
        Alert.alert('Signup Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
        </View>

        <Text style={styles.heading}>Create Account!</Text>
        <Text style={styles.subheading}>Join us and start cooking amazing meals</Text>

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

        <View style={styles.inputContainer}>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <View style={[
            styles.passwordInputWrapper,
            passwordInputError && styles.passwordInputWrapperError
          ]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={isPasswordHidden}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setIsPasswordHidden(!isPasswordHidden)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={isPasswordHidden ? 'eye-off' : 'eye'}
                size={22}
                color="#6c757d"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          <View style={[
            styles.passwordInputWrapper,
            confirmPasswordInputError && styles.passwordInputWrapperError
          ]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={isConfirmPasswordHidden}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={isConfirmPasswordHidden ? 'eye-off' : 'eye'}
                size={22}
                color="#6c757d"
              />
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => router.push('/TermsAndConditions')}
                >
                  Terms and Conditions
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            isLoading && { opacity: 0.6 },
            !acceptTerms && styles.registerButtonDisabled,
          ]}
          onPress={handleSignup}
          disabled={isLoading || !acceptTerms}
        >
          <Text style={styles.registerButtonText}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomTextWrapper}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginNowText}>Login Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Signup;

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
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingRight: 12,
  },
  passwordInputWrapperError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 8,
    borderRadius: 6,
  },
  registerButton: {
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
  registerButtonText: {
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
  loginNowText: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 4,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#F9761A',
    borderColor: '#F9761A',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007bff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});
