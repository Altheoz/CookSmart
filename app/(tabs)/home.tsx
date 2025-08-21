import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Ionicons name="menu" size={28} color="black" />
        <Image
          source={require('@/assets/images/imgg.png')}
          className="w-12 h-12 rounded-full"
        />      
          <View style={{ width: 28 }} />
      </View>

      <View style={styles.greetingContainer}>
        <Text style={styles.greetingTitle}>Good Day!</Text>
        <Text style={styles.greetingSubtitle}>Ready to Start Cooking?</Text>
        <Text style={styles.greetingDescription}>
          Discover amazing recipes, get cooking guidance, and master new culinary
          skills with your personal AI assistance.
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/')}
        >
          <View>
            <Text style={styles.cardTitle}>Discover Recipes</Text>
            <Text style={styles.cardSubtitle}>Discover New Recipes With AI</Text>
          </View>
          <MaterialIcons name="search" size={24} color="orange" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/example')}
        >
          <View>
            <Text style={styles.cardTitle}>Recipes Saved</Text>
            <Text style={styles.cardNumber}>3</Text>
          </View>
          <Ionicons name="bookmark" size={24} color="dodgerblue" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/')}
        >
          <View>
            <Text style={styles.cardTitle}>Favorites</Text>
            <Text style={styles.cardNumber}>4</Text>
          </View>
          <FontAwesome name="heart" size={24} color="crimson" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFFFE0', 
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  greetingContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    color: '#000',
  },
  greetingDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    color: '#555',
  },
  cardContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
});
