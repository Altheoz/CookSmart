import { auth } from '@/FirebaseConfig';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        {currentUser ? (
          <>
            <Text className="text-lg text-black mb-4">
              Signed in as: {currentUser.email}
            </Text>
            <TouchableOpacity onPress={() => auth.signOut()}>
              <Text className="text-lg text-red-500">Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="text-lg text-gray-500">Loading...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
