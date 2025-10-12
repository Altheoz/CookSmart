import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
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
import { UserService } from '../services/userService';
import './global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailInputError, setEmailInputError] = useState(false);
  const [passwordInputError, setPasswordInputError] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await UserService.getUserData(user.uid);
          
          if (!user.emailVerified) {
            router.replace('/EmailVerification');
            return;
          }
          
          if (userData?.role === 'admin' || userData?.role === 'super_admin') {
            router.replace('/admin-dashboard');
          } else {
            router.replace('/(tabs)/home');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.replace('/(tabs)/home');
        }
      }
    });

    loadSavedCredentials();
    restoreCooldown();

    const intervalId = setInterval(() => {
      if (cooldownUntil) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
        setRemainingSeconds(remaining);
        if (remaining === 0) {
          clearCooldown();
        }
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      const rememberMeStatus = await AsyncStorage.getItem('rememberMe');

      if (savedEmail && savedPassword && rememberMeStatus === 'true') {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading saved credentials:', error);
    }
  };

  const showError = (type: 'email' | 'password', message: string) => {
    if (type === 'email') {
      setEmailError(message);
      setEmailInputError(true);
      setTimeout(() => {
        setEmailError('');
        setEmailInputError(false);
      }, 2000);
    } else {
      setPasswordError(message);
      setPasswordInputError(true);
      setTimeout(() => {
        setPasswordError('');
        setPasswordInputError(false);
      }, 2000);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const startCooldown = async (seconds: number) => {
    const until = Date.now() + seconds * 1000;
    setCooldownUntil(until);
    setRemainingSeconds(seconds);
    try {
      await AsyncStorage.setItem('loginCooldownUntil', String(until));
    } catch { }
  };

  const restoreCooldown = async () => {
    try {
      const value = await AsyncStorage.getItem('loginCooldownUntil');
      if (value) {
        const until = Number(value);
        if (!Number.isNaN(until) && until > Date.now()) {
          setCooldownUntil(until);
          setRemainingSeconds(Math.ceil((until - Date.now()) / 1000));
        } else {
          clearCooldown();
        }
      }
    } catch { }
  };

  const clearCooldown = async () => {
    setCooldownUntil(null);
    setRemainingSeconds(0);
    try {
      await AsyncStorage.removeItem('loginCooldownUntil');
    } catch { }
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setEmailInputError(false);
    setPasswordInputError(false);

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

    if (cooldownUntil && cooldownUntil > Date.now()) {
      Alert.alert('Please wait', `Too many attempts. Try again in ${remainingSeconds}s.`);
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', email);
          await AsyncStorage.setItem('rememberedPassword', password);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
          await AsyncStorage.removeItem('rememberedPassword');
          await AsyncStorage.removeItem('rememberMe');
        }
        
        
        
        if (!userCredential.user.emailVerified) {
          router.replace('/EmailVerification');
          return;
        }
        
        try {
          const userData = await UserService.getUserData(userCredential.user.uid);
          if (userData?.role === 'admin' || userData?.role === 'super_admin') {
            router.replace('/admin-dashboard');
          } else {
            router.replace('/(tabs)/home');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.replace('/(tabs)/home');
        }
      }
    } catch (error: any) {
      console.log(error);

      if (error.code === 'auth/invalid-credential') {
        showError('password', '');
        showError('email', 'invalid credential');
      } else if (error.code === 'auth/too-many-requests') {
        const cooldownSeconds = 60;
        await startCooldown(cooldownSeconds);
        Alert.alert('Too many attempts', `Please wait ${cooldownSeconds} seconds before trying again.`);
      } else {
        Alert.alert('Login Failed', error.message);
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
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

        <Text style={styles.heading}>Welcome back!</Text>
        <Text style={styles.subheading}>Glad to see you, Again!</Text>

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

        <View style={styles.rememberMeWrapper}>
          <TouchableOpacity
            style={styles.checkboxWrapper}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/resetPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {(() => {
          const isCoolingDown = cooldownUntil !== null && cooldownUntil > Date.now();
          return (
            <TouchableOpacity
              style={[
                styles.loginButton,
                (isLoading || isCoolingDown) && { opacity: 0.6 },
              ]}
              onPress={handleLogin}
              disabled={isLoading || isCoolingDown}
            >
              <Text style={styles.loginButtonText}>
                {isCoolingDown
                  ? `Retry in ${remainingSeconds}s`
                  : isLoading
                    ? 'Signing In...'
                    : 'Login'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        <View style={styles.bottomTextWrapper}>
          <Text style={styles.bottomText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.registerNowText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

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
  rememberMeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  rememberMeText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#007bff',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonText: {
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
  registerNowText: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 4,
  },
});
