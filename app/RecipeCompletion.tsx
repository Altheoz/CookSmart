import { useRecipeContext } from '@/contexts/RecipeContext';
import { CookingSession } from '@/services/cookingHistoryService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


export default function RecipeCompletionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meal } = route.params;
  const { addCookingSession } = useRecipeContext();
  const [sessionSaved, setSessionSaved] = useState(false);

  const handleBackToHome = () => {
    navigation.navigate('(tabs)', { screen: 'home' });
  };

  const handleStartNewRecipe = () => {
    navigation.navigate('(tabs)', { screen: 'discover' });
  };

 
  useEffect(() => {
    let isMounted = true;
    const saveCookingSession = async () => {
      if (meal && !sessionSaved && isMounted) {
        try {
          const cookingSession: CookingSession = {
            id: `${meal.idMeal}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            meal: meal,
            completedAt: new Date(),
            cookingTime: 30,
            difficulty: 'Medium',
            stepsCompleted: 1,
            totalSteps: 1,
            ingredientsUsed: [
              meal.strIngredient1,
              meal.strIngredient2,
              meal.strIngredient3,
              meal.strIngredient4,
              meal.strIngredient5,
            ].filter(Boolean),
            category: meal.strCategory,
            cuisine: meal.strArea,
          };

          await addCookingSession(cookingSession);
          if (isMounted) {
            setSessionSaved(true);
          }
        } catch (error) {
          console.error('Error saving cooking session:', error);
        }
      }
    };

    saveCookingSession();
    
    return () => {
      isMounted = false;
    };
  }, [meal?.idMeal, sessionSaved]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="restaurant" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Completed</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.completionCard}>
          <View style={styles.completionIcon}>
            <Ionicons name="checkmark" size={40} color="white" />
          </View>
          
          <Text style={styles.completionTitle}>Recipe Completed</Text>
          
          <Text style={styles.congratulationsText}>
            Congratulations! Your {meal?.strMeal || 'delicious dish'} is ready to enjoy.
          </Text>
          
          <View style={styles.mealInfo}>
            {meal?.strMealThumb && (
              <View style={styles.mealImageContainer}>
                <Text style={styles.mealImageText}>🍽️</Text>
              </View>
            )}
            <Text style={styles.mealName}>{meal?.strMeal}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleBackToHome}
            >
              <Ionicons name="home" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleStartNewRecipe}
            >
              <Ionicons name="add-circle" size={20} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Start New Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Cooking Session Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#4CAF50" />
              <Text style={styles.statLabel}>Total Time</Text>
              <Text style={styles.statValue}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statLabel}>Steps</Text>
              <Text style={styles.statValue}>All Done</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
    alignItems: 'center',
  },
  completionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  completionIcon: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  congratulationsText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  mealInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  mealImageText: {
    fontSize: 32,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
});
