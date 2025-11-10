import { auth, db } from '@/FirebaseConfig';
import { CookingHistoryService, CookingSession, CookingStats } from '@/services/cookingHistoryService';
import { Meal } from '@/services/mealApi';
import { OfflineRecipeService } from '@/services/offlineRecipeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface RecipeContextType {
  favorites: Meal[];
  savedRecipes: Meal[];
  editedRecipes: Meal[];
  cookingHistory: CookingSession[];
  cookingStats: CookingStats;
  addToFavorites: (meal: Meal) => Promise<void>;
  removeFromFavorites: (mealId: string) => Promise<void>;
  addToSaved: (meal: Meal) => Promise<void>;
  removeFromSaved: (mealId: string) => Promise<void>;
  addEditedRecipe: (meal: Meal) => Promise<void>;
  removeEditedRecipe: (mealId: string) => Promise<void>;
  addCookingSession: (session: CookingSession) => Promise<void>;
  deleteCookingSession: (sessionId: string) => Promise<void>;
  clearAllCookingHistory: () => Promise<void>;
  isFavorite: (mealId: string) => boolean;
  isSaved: (mealId: string) => boolean;
  isEdited: (mealId: string) => boolean;
  getFavoritesCount: () => number;
  getSavedCount: () => number;
  getEditedCount: () => number;
  getCookingHistoryCount: () => number;
  refreshCookingHistory: () => Promise<void>;
  refreshCookingStats: () => Promise<void>;
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
  const [editedRecipes, setEditedRecipes] = useState<Meal[]>([]);
  const [cookingHistory, setCookingHistory] = useState<CookingSession[]>([]);
  const [cookingStats, setCookingStats] = useState<CookingStats>({
    totalMealsCooked: 0,
    totalCookingTime: 0,
    averageRating: 0,
    favoriteCategory: '',
    favoriteCuisine: '',
    streak: 0,
    achievements: [],
  });
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  const FAVORITES_KEY = 'cooksmart_favorites';
  const SAVED_RECIPES_KEY = 'cooksmart_saved_recipes';
  const EDITED_RECIPES_KEY = 'cooksmart_edited_recipes';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      const newUid = user?.uid ?? null;
      setUid(newUid);
      if (newUid) {
        loadFavoritesFromFirestore(newUid);
        loadSavedFromFirestore(newUid);
        loadEditedFromFirestore(newUid);
        loadCookingHistory();
        loadCookingStats();
      } else {
        loadFavorites();
        loadSavedRecipes();
        loadEditedRecipes();
        loadCookingHistory();
        loadCookingStats();
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

  const loadEditedRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(EDITED_RECIPES_KEY);
      if (stored) {
        setEditedRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading edited recipes:', error);
    }
  };

  const loadCookingHistory = async () => {
    try {
      const history = await CookingHistoryService.getCookingHistory();
      
      const seenIds = new Set<string>();
      const uniqueHistory = history.filter((session) => {
        if (seenIds.has(session.id)) {
          return false;
        }
        seenIds.add(session.id);
        return true;
      });
      setCookingHistory(uniqueHistory);
    } catch (error) {
      console.error('Error loading cooking history:', error);
    }
  };

  const loadCookingStats = async () => {
    try {
      const stats = await CookingHistoryService.getCookingStats();
      setCookingStats(stats);
    } catch (error) {
      console.error('Error loading cooking stats:', error);
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

  const saveEditedRecipes = async (newEditedRecipes: Meal[]) => {
    try {
      await AsyncStorage.setItem(EDITED_RECIPES_KEY, JSON.stringify(newEditedRecipes));
      setEditedRecipes(newEditedRecipes);
    } catch (error) {
      console.error('Error saving edited recipes:', error);
    }
  };

 
  const favoritesCollectionRef = (userId: string) => collection(db, 'users', userId, 'favorites');
  const savedCollectionRef = (userId: string) => collection(db, 'users', userId, 'saved');
  const editedCollectionRef = (userId: string) => collection(db, 'users', userId, 'edited');

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

  const loadEditedFromFirestore = async (userId: string) => {
    try {
      const snapshot = await getDocs(editedCollectionRef(userId));
      const docs: Meal[] = snapshot.docs.map(d => d.data() as Meal);
      setEditedRecipes(docs);
      await AsyncStorage.setItem(EDITED_RECIPES_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Error loading edited recipes from Firestore:', error);
      await loadEditedRecipes();
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
    
    try {
    
      const enhancedMeal = await OfflineRecipeService.enhanceMealForOffline(meal);
      
      const newSavedRecipes = [...savedRecipes, enhancedMeal];
      await saveSavedRecipes(newSavedRecipes);
      
      if (uid) {
        try {
          await setDoc(doc(savedCollectionRef(uid), enhancedMeal.idMeal), enhancedMeal);
        } catch (error) {
          console.error('Error saving recipe to Firestore:', error);
        }
      }
    } catch (error) {
      console.error('Error enhancing meal for offline:', error);
   
      const newSavedRecipes = [...savedRecipes, meal];
      await saveSavedRecipes(newSavedRecipes);
      if (uid) {
        try {
          await setDoc(doc(savedCollectionRef(uid), meal.idMeal), meal);
        } catch (error) {
          console.error('Error saving recipe to Firestore:', error);
        }
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

  const addEditedRecipe = async (meal: Meal) => {
    if (editedRecipes.some(m => m.idMeal === meal.idMeal)) return;
    const newEditedRecipes = [...editedRecipes, meal];
    await saveEditedRecipes(newEditedRecipes);
    if (uid) {
      try {
        await setDoc(doc(editedCollectionRef(uid), meal.idMeal), meal);
      } catch (error) {
        console.error('Error saving edited recipe to Firestore:', error);
      }
    }
  };

  const removeEditedRecipe = async (mealId: string) => {
    const newEditedRecipes = editedRecipes.filter(meal => meal.idMeal !== mealId);
    await saveEditedRecipes(newEditedRecipes);
    if (uid) {
      try {
        await deleteDoc(doc(editedCollectionRef(uid), mealId));
      } catch (error) {
        console.error('Error removing edited recipe from Firestore:', error);
      }
    }
  };

  const isFavorite = (mealId: string) => {
    return favorites.some(meal => meal.idMeal === mealId);
  };

  const isSaved = (mealId: string) => {
    return savedRecipes.some(meal => meal.idMeal === mealId);
  };

  const isEdited = (mealId: string) => {
    return editedRecipes.some(meal => meal.idMeal === mealId);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  const getSavedCount = () => {
    return savedRecipes.length;
  };

  const getEditedCount = () => {
    return editedRecipes.length;
  };

  const addCookingSession = async (session: CookingSession) => {
    try {
      await CookingHistoryService.saveCookingSession(session);
      await loadCookingHistory();
      await loadCookingStats();
    } catch (error) {
      console.error('Error adding cooking session:', error);
      throw error;
    }
  };

  const deleteCookingSession = async (sessionId: string) => {
    try {
      await CookingHistoryService.deleteCookingSession(sessionId);
      await loadCookingHistory();
      await loadCookingStats();
    } catch (error) {
      console.error('Error deleting cooking session:', error);
      throw error;
    }
  };

  const getCookingHistoryCount = () => {
    return cookingHistory.length;
  };

  const refreshCookingHistory = async () => {
    await loadCookingHistory();
  };

  const refreshCookingStats = async () => {
    await loadCookingStats();
  };

  const clearAllCookingHistory = async () => {
    try {
      await CookingHistoryService.clearAllHistory();
      
     
      setCookingHistory([]);
      
      await loadCookingStats();
    } catch (error) {
      console.error('Error clearing cooking history:', error);
      throw error;
    }
  };

  const value: RecipeContextType = {
    favorites,
    savedRecipes,
    editedRecipes,
    cookingHistory,
    cookingStats,
    addToFavorites,
    removeFromFavorites,
    addToSaved,
    removeFromSaved,
    addEditedRecipe,
    removeEditedRecipe,
    addCookingSession,
    deleteCookingSession,
    clearAllCookingHistory,
    isFavorite,
    isSaved,
    isEdited,
    getFavoritesCount,
    getSavedCount,
    getEditedCount,
    getCookingHistoryCount,
    refreshCookingHistory,
    refreshCookingStats,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};
