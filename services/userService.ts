import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../FirebaseConfig';

export interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: Date;
}

export class UserService {
  static async createUser(email: string, password: string, role: 'user' | 'admin' | 'super_admin' = 'user'): Promise<UserData> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        role,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  static async getAllUsers(): Promise<UserData[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as UserData[];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  static async updateUserRole(uid: string, role: 'user' | 'admin' | 'super_admin'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  static async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  static async deleteUser(uid: string): Promise<void> {
    try {
     
      try {
        const deleteUserFunction = httpsCallable(functions, 'deleteUser');
        const result = await deleteUserFunction({ uid });
        console.log('User deleted successfully via Cloud Function:', result.data);
        
       
        await this.clearUserAsyncStorage();
        return;
      } catch (functionError) {
        console.log('Cloud Function not available, falling back to client-side deletion:', functionError);
      }

     
      const batch = writeBatch(db);
      
  
      batch.delete(doc(db, 'users', uid));
      
     
      const favoritesRef = collection(db, 'users', uid, 'favorites');
      const favoritesSnapshot = await getDocs(favoritesRef);
      favoritesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
     
      const savedRef = collection(db, 'users', uid, 'saved');
      const savedSnapshot = await getDocs(savedRef);
      savedSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
     
      await batch.commit();
      
     
      await this.clearUserAsyncStorage();
      
     
      try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
          await deleteUser(currentUser);
          console.log('User deleted from Firebase Auth (self-deletion)');
        } else {
          console.log('Cannot delete other users from Firebase Auth via client-side');
          console.log('User deleted from Firestore only. Deploy Cloud Functions for complete deletion.');
        }
      } catch (authError) {
        console.log('Firebase Auth deletion failed:', authError);
        console.log('User deleted from Firestore only. Deploy Cloud Functions for complete deletion.');
      }
      
      console.log('User and all related data deleted from Firestore and AsyncStorage.');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  
  private static async clearUserAsyncStorage(): Promise<void> {
    try {
      const keysToRemove = [
        'userAvatar',
        'cooksmart_favorites',
        'cooksmart_saved_recipes',
        'rememberedEmail',
        'rememberedPassword',
        'rememberMe',
        'loginCooldownUntil'
      ];

      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      console.log('User AsyncStorage data cleared successfully');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      
    }
  }

  static async isAdmin(uid: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role === 'admin' || userData?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async isSuperAdmin(uid: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role === 'super_admin';
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }

  static async getUserStats(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    monthlyRegistrations: { month: string; count: number }[];
  }> {
    try {
      const users = await this.getAllUsers();
      const totalUsers = users.length;
      const totalAdmins = users.filter(user => user.role === 'admin' || user.role === 'super_admin').length;
      
      
      const monthlyData: { [key: string]: number } = {};
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = 0;
      }

      users.forEach(user => {
        const userDate = new Date(user.createdAt);
        const monthKey = userDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      });

      const monthlyRegistrations = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));

      return {
        totalUsers,
        totalAdmins,
        monthlyRegistrations
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

