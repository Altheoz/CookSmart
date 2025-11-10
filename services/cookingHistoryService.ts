import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { Meal } from './mealApi';

export interface CookingSession {
  id: string;
  meal: Meal;
  completedAt: Date;
  cookingTime: number; 
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating?: number; 
  notes?: string;
  stepsCompleted: number;
  totalSteps: number;
  ingredientsUsed: string[];
  category: string;
  cuisine: string;
}

export interface CookingStats {
  totalMealsCooked: number;
  totalCookingTime: number; 
  averageRating: number;
  favoriteCategory: string;
  favoriteCuisine: string;
  streak: number; 
  lastCookingDate?: Date;
  achievements: string[];
}

export class CookingHistoryService {
  private static readonly HISTORY_KEY = 'cooksmart_cooking_history';
  private static readonly STATS_KEY = 'cooksmart_cooking_stats';

 
  private static storageKey(baseKey: string): string {
    const uid = this.getCurrentUid();
    return `${baseKey}:${uid ?? 'guest'}`;
  }

  private static removeUndefinedDeep<T>(value: T): T {
    if (value === null) return value;
   
    if (value instanceof Date) return value;
  
    if (Array.isArray(value)) {
      const cleanedArray = (value as unknown as any[])
        .map((item) => this.removeUndefinedDeep(item))
        .filter((item) => item !== undefined);
      return cleanedArray as unknown as T;
    }
   
    if (typeof value === 'object') {
      const result: Record<string, any> = {};
      Object.entries(value as Record<string, any>).forEach(([key, val]) => {
        if (val === undefined) return;
        const cleaned = this.removeUndefinedDeep(val);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      });
      return result as unknown as T;
    }
   
    return value;
  }

 
  private static getCurrentUid(): string | null {
    return auth.currentUser?.uid || null;
  }

  
  private static historyCollectionRef(uid: string) {
    return collection(db, 'users', uid, 'cookingHistory');
  }

  private static statsDocRef(uid: string) {
    return doc(db, 'users', uid, 'stats', 'cooking');
  }

  
  static async saveCookingSession(session: CookingSession): Promise<void> {
    try {
      const uid = this.getCurrentUid();
      const sanitizedSession = this.removeUndefinedDeep<CookingSession>(session);
      
      
      if (uid) {
        try {
          
          const firestoreHistory = await this.getCookingHistoryFromFirestore();
          const existsInFirestore = firestoreHistory.some(s => s.id === sanitizedSession.id);
          
          if (existsInFirestore) {
            console.log('Session already exists in Firestore, skipping save');
            
            await AsyncStorage.setItem(this.storageKey(this.HISTORY_KEY), JSON.stringify(firestoreHistory));
            return;
          }
          
          
          await setDoc(doc(this.historyCollectionRef(uid), sanitizedSession.id), {
            ...sanitizedSession,
            completedAt: sanitizedSession.completedAt,
          });
          
        
          await this.updateCookingStats(sanitizedSession);
          
          
          const updatedHistory = await this.getCookingHistoryFromFirestore();
          await AsyncStorage.setItem(this.storageKey(this.HISTORY_KEY), JSON.stringify(updatedHistory));
          
          return;
        } catch (firestoreError) {
          console.error('Error saving to Firestore, falling back to AsyncStorage:', firestoreError);
         
        }
      }
      
      
      const stored = await AsyncStorage.getItem(this.storageKey(this.HISTORY_KEY));
      let existingHistory: CookingSession[] = [];
      
      if (stored) {
        const history = JSON.parse(stored);
        existingHistory = history.map((s: any) => ({
          ...s,
          completedAt: new Date(s.completedAt),
        }));
      }
      
     
      const existingSession = existingHistory.find(s => s.id === sanitizedSession.id);
      if (existingSession) {
        console.log('Session already exists in AsyncStorage, skipping save');
        return;
      }
      
      
      const updatedHistory = [sanitizedSession, ...existingHistory.filter(s => s.id !== sanitizedSession.id)];
      await AsyncStorage.setItem(this.storageKey(this.HISTORY_KEY), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving cooking session:', error);
      throw error;
    }
  }

  
  static async getCookingHistory(): Promise<CookingSession[]> {
    try {
      const uid = this.getCurrentUid();
      
      
      if (uid) {
        try {
          const firestoreHistory = await this.getCookingHistoryFromFirestore();
          
          
          const seenIds = new Set<string>();
          const uniqueHistory = firestoreHistory.filter((session) => {
            if (seenIds.has(session.id)) {
              return false;
            }
            seenIds.add(session.id);
            return true;
          });
          
          
          await AsyncStorage.setItem(this.storageKey(this.HISTORY_KEY), JSON.stringify(uniqueHistory));
          
          return uniqueHistory;
        } catch (firestoreError) {
          console.log('Firestore not available, falling back to AsyncStorage:', firestoreError);
          
        }
      }
      
     
      const stored = await AsyncStorage.getItem(this.storageKey(this.HISTORY_KEY));
      if (stored) {
        const history = JSON.parse(stored);
        const sessions = history.map((session: any) => ({
          ...session,
          completedAt: new Date(session.completedAt),
        }));
        
     
        const seenIds = new Set<string>();
        const uniqueSessions = sessions.filter((session: CookingSession) => {
          if (seenIds.has(session.id)) {
            return false;
          }
          seenIds.add(session.id);
          return true;
        });
        
        return uniqueSessions;
      }
      return [];
    } catch (error) {
      console.error('Error loading cooking history:', error);
      return [];
    }
  }

  
  static async getCookingHistoryFromFirestore(): Promise<CookingSession[]> {
    try {
      const uid = this.getCurrentUid();
      if (!uid) return [];

      const q = query(
        this.historyCollectionRef(uid),
        orderBy('completedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          completedAt: data.completedAt.toDate(),
        } as CookingSession;
      });
    } catch (error) {
      console.error('Error loading cooking history from Firestore:', error);
      return [];
    }
  }

 
  static async getCookingStats(): Promise<CookingStats> {
    try {
      const uid = this.getCurrentUid();
      
      
      if (uid) {
        try {
          const statsDoc = await getDocs(collection(db, 'users', uid, 'stats'));
          if (!statsDoc.empty) {
            const data = statsDoc.docs[0].data();
            return {
              ...data,
              lastCookingDate: data.lastCookingDate?.toDate(),
            } as CookingStats;
          }
        } catch (firestoreError) {
          console.log('Firestore stats not available, falling back to local');
        }
      }

      const stored = await AsyncStorage.getItem(this.storageKey(this.STATS_KEY));
      if (stored) {
        const stats = JSON.parse(stored);
        return {
          ...stats,
          lastCookingDate: stats.lastCookingDate ? new Date(stats.lastCookingDate) : undefined,
        };
      }

    
      return {
        totalMealsCooked: 0,
        totalCookingTime: 0,
        averageRating: 0,
        favoriteCategory: '',
        favoriteCuisine: '',
        streak: 0,
        achievements: [],
      };
    } catch (error) {
      console.error('Error loading cooking stats:', error);
      return {
        totalMealsCooked: 0,
        totalCookingTime: 0,
        averageRating: 0,
        favoriteCategory: '',
        favoriteCuisine: '',
        streak: 0,
        achievements: [],
      };
    }
  }


  private static async updateCookingStats(session: CookingSession): Promise<void> {
    try {
      const currentStats = await this.getCookingStats();
      const uid = this.getCurrentUid();

     
      const newStats: CookingStats = {
        totalMealsCooked: currentStats.totalMealsCooked + 1,
        totalCookingTime: currentStats.totalCookingTime + session.cookingTime,
        averageRating: 0, 
        favoriteCategory: this.calculateFavoriteCategory([...await this.getCookingHistory(), session]),
        favoriteCuisine: this.calculateFavoriteCuisine([...await this.getCookingHistory(), session]),
        streak: this.calculateStreak([...await this.getCookingHistory(), session]),
        lastCookingDate: session.completedAt,
        achievements: [], 
      };

      
      await AsyncStorage.setItem(this.storageKey(this.STATS_KEY), JSON.stringify(newStats));

      if (uid) {
        await setDoc(this.statsDocRef(uid), {
          ...newStats,
          lastCookingDate: newStats.lastCookingDate,
        });
      }
    } catch (error) {
      console.error('Error updating cooking stats:', error);
    }
  }

 
  private static calculateFavoriteCategory(history: CookingSession[]): string {
    const categoryCount: { [key: string]: number } = {};
    history.forEach(session => {
      categoryCount[session.category] = (categoryCount[session.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount).reduce((a, b) => 
      categoryCount[a[0]] > categoryCount[b[0]] ? a : b
    )[0] || '';
  }


  private static calculateFavoriteCuisine(history: CookingSession[]): string {
    const cuisineCount: { [key: string]: number } = {};
    history.forEach(session => {
      cuisineCount[session.cuisine] = (cuisineCount[session.cuisine] || 0) + 1;
    });
    
    return Object.entries(cuisineCount).reduce((a, b) => 
      cuisineCount[a[0]] > cuisineCount[b[0]] ? a : b
    )[0] || '';
  }

  
  private static calculateStreak(history: CookingSession[]): number {
    if (history.length === 0) return 0;

    const sortedHistory = history.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const sessionDate = new Date(sortedHistory[i].completedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  
  private static calculateAchievements(history: CookingSession[]): string[] {
    const achievements: string[] = [];
    
    if (history.length >= 1) achievements.push('First Recipe');
    if (history.length >= 5) achievements.push('Getting Started');
    if (history.length >= 10) achievements.push('Cooking Enthusiast');
    if (history.length >= 25) achievements.push('Master Chef');
    if (history.length >= 50) achievements.push('Cooking Legend');
    
    const totalTime = history.reduce((sum, session) => sum + session.cookingTime, 0);
    if (totalTime >= 60) achievements.push('Hour Cooker');
    if (totalTime >= 300) achievements.push('Marathon Chef');
    if (totalTime >= 600) achievements.push('Time Master');
    
    const avgRating = history.reduce((sum, session) => sum + (session.rating || 0), 0) / history.length;
    if (avgRating >= 4.5) achievements.push('Perfectionist');
    
    const categories = new Set(history.map(session => session.category));
    if (categories.size >= 5) achievements.push('Variety Seeker');
    
    return achievements;
  }

 
  static async getHistoryByDateRange(startDate: Date, endDate: Date): Promise<CookingSession[]> {
    const history = await this.getCookingHistory();
    return history.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  
  static async getHistoryByCategory(category: string): Promise<CookingSession[]> {
    const history = await this.getCookingHistory();
    return history.filter(session => session.category === category);
  }

 
  static async getHistoryByRating(minRating: number): Promise<CookingSession[]> {
    const history = await this.getCookingHistory();
    return history.filter(session => (session.rating || 0) >= minRating);
  }

 
  static async deleteCookingSession(sessionId: string): Promise<void> {
    try {
      const uid = this.getCurrentUid();
      
      const history = await this.getCookingHistory();
      const updatedHistory = history.filter(session => session.id !== sessionId);
      await AsyncStorage.setItem(this.storageKey(this.HISTORY_KEY), JSON.stringify(updatedHistory));
      
      
      if (uid) {
        try {
          await deleteDoc(doc(this.historyCollectionRef(uid), sessionId));
          console.log('Session deleted from Firestore successfully');
        } catch (firestoreError) {
          console.error('Error deleting session from Firestore:', firestoreError);
          
        }
      }
    } catch (error) {
      console.error('Error deleting cooking session:', error);
      throw error;
    }
  }

  
  static async clearAllHistory(): Promise<void> {
    try {
      const uid = this.getCurrentUid();
      
    
      
      const currentStats = await this.getCookingStats();
      
      
      await AsyncStorage.removeItem(this.storageKey(this.HISTORY_KEY));
      
    
      if (uid) {
        try {
    
          const historySnapshot = await getDocs(this.historyCollectionRef(uid));
     
          const batch = writeBatch(db);
          historySnapshot.docs.forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref);
          });
          
        
        
          const statsDocRef = this.statsDocRef(uid);
          batch.set(statsDocRef, {
            ...currentStats,
          
            lastCookingDate: null,
            achievements: [],
          });
          
         
          await batch.commit();
          console.log('Cooking history cleared but statistics preserved in Firestore');
        } catch (firestoreError) {
          console.error('Error clearing history from Firestore:', firestoreError);
          
        }
      }
      
     
      const updatedStats: CookingStats = {
        ...currentStats,
        lastCookingDate: undefined,
        achievements: [],
      };
      await AsyncStorage.setItem(this.storageKey(this.STATS_KEY), JSON.stringify(updatedStats));
      
    } catch (error) {
      console.error('Error clearing cooking history:', error);
      throw error;
    }
  }
}
