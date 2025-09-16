import { router } from 'expo-router';

import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../FirebaseConfig';

const Index = () => {

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/home');
      }
    });

    return unsubscribe; 
  }, []);

  return (
    <SafeAreaView style={styles.container}>
     
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/images/imgg.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.heroTextWrapper}>
          <Text style={styles.title}>CookSmart</Text>
          <Text style={styles.subtitle}>Discover, cook, and enjoy delicious meals effortlessly.</Text>
        </View>

        <View style={styles.buttonsWrapper}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/signup')}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bgBlobTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FEE0C8',
    opacity: 0.8,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFF4EB',
    opacity: 0.9,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F9761A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F9761A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
 logoImage: {
  width: 110,
  height: 110,
  borderRadius: 55,
  resizeMode: 'contain', 
},

  heroTextWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    color: '#1a1a1a',
    fontFamily: 'Sansita',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  buttonsWrapper: {
    width: '100%',
    gap: 14,
  },
  primaryButton: {
    backgroundColor: '#F9761A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F9761A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F9761A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F9761A',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Index;
