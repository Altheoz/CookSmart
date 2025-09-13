import { auth, db } from '@/FirebaseConfig';
import { Meal } from '@/services/mealApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface RecipeContextType {
  favorites: Meal[];
  savedRecipes: Meal[];
  addToFavorites: (meal: Meal) => Promise<void>;
  removeFromFavorites: (mealId: string) => Promise<void>;
  addToSaved: (meal: Meal) => Promise<void>;
  removeFromSaved: (mealId: string) => Promise<void>;
  isFavorite: (mealId: string) => boolean;
  isSaved: (mealId: string) => boolean;
  getFavoritesCount: () => number;
  getSavedCount: () => number;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const useRecipeContext = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipeContext must be used within a RecipeProvider');
  }
  return context;
};

interface RecipeProviderProps {
  children: React.ReactNode;
}

export const RecipeProvider: React.FC<RecipeProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Meal[]>([]);
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  const FAVORITES_KEY = 'cooksmart_favorites';
  const SAVED_RECIPES_KEY = 'cooksmart_saved_recipes';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      const newUid = user?.uid ?? null;
      setUid(newUid);
      if (newUid) {
     
        loadFavoritesFromFirestore(newUid);
        loadSavedFromFirestore(newUid);
      } else {
 
        loadFavorites();
        loadSavedRecipes();
      }
    });
    return unsubscribe;
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
      if (stored) {
        setSavedRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  const saveFavorites = async (newFavorites: Meal[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const saveSavedRecipes = async (newSavedRecipes: Meal[]) => {
    try {
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSavedRecipes));
      setSavedRecipes(newSavedRecipes);
    } catch (error) {
      console.error('Error saving saved recipes:', error);
    }
  };

 
  const favoritesCollectionRef = (userId: string) => collection(db, 'users', userId, 'favorites');
  const savedCollectionRef = (userId: string) => collection(db, 'users', userId, 'saved');

  const loadFavoritesFromFirestore = async (userId: string) => {
    try {
      const snapshot = await getDocs(favoritesCollectionRef(userId));
      const docs: Meal[] = snapshot.docs.map(d => d.data() as Meal);
      setFavorites(docs);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Error loading favorites from Firestore:', error);
      await loadFavorites();
    }
  };

  const loadSavedFromFirestore = async (userId: string) => {
    try {
      const snapshot = await getDocs(savedCollectionRef(userId));
      const docs: Meal[] = snapshot.docs.map(d => d.data() as Meal);
      setSavedRecipes(docs);
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Error loading saved recipes from Firestore:', error);
      await loadSavedRecipes();
    }
  };

  const addToFavorites = async (meal: Meal) => {
    if (favorites.some(m => m.idMeal === meal.idMeal)) return;
    const newFavorites = [...favorites, meal];
    await saveFavorites(newFavorites);
    if (uid) {
      try {
        await setDoc(doc(favoritesCollectionRef(uid), meal.idMeal), meal);
      } catch (error) {
        console.error('Error saving favorite to Firestore:', error);
      }
    }
  };

  const removeFromFavorites = async (mealId: string) => {
    const newFavorites = favorites.filter(meal => meal.idMeal !== mealId);
    await saveFavorites(newFavorites);
    if (uid) {
      try {
        await deleteDoc(doc(favoritesCollectionRef(uid), mealId));
      } catch (error) {
        console.error('Error removing favorite from Firestore:', error);
      }
    }
  };

  const addToSaved = async (meal: Meal) => {
    if (savedRecipes.some(m => m.idMeal === meal.idMeal)) return;
    const newSavedRecipes = [...savedRecipes, meal];
    await saveSavedRecipes(newSavedRecipes);
    if (uid) {
      try {
        await setDoc(doc(savedCollectionRef(uid), meal.idMeal), meal);
      } catch (error) {
        console.error('Error saving recipe to Firestore:', error);
      }
    }
  };

  const removeFromSaved = async (mealId: string) => {
    const newSavedRecipes = savedRecipes.filter(meal => meal.idMeal !== mealId);
    await saveSavedRecipes(newSavedRecipes);
    if (uid) {
      try {
        await deleteDoc(doc(savedCollectionRef(uid), mealId));
      } catch (error) {
        console.error('Error removing saved recipe from Firestore:', error);
      }
    }
  };

  const isFavorite = (mealId: string) => {
    return favorites.some(meal => meal.idMeal === mealId);
  };

  const isSaved = (mealId: string) => {
    return savedRecipes.some(meal => meal.idMeal === mealId);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  const getSavedCount = () => {
    return savedRecipes.length;
  };

  const value: RecipeContextType = {
    favorites,
    savedRecipes,
    addToFavorites,
    removeFromFavorites,
    addToSaved,
    removeFromSaved,
    isFavorite,
    isSaved,
    getFavoritesCount,
    getSavedCount,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};
