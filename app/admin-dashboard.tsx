import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../FirebaseConfig';
import { UserData, UserService } from '../services/userService';


const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'super_admin' | null>(null);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    monthlyRegistrations: [] as { month: string; count: number }[]
  });

  useEffect(() => {
    loadCurrentUserRole();
    loadUsers();
    loadUserStats();
  }, []);

  const loadCurrentUserRole = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userData = await UserService.getUserData(currentUser.uid);
        setCurrentUserRole(userData?.role as 'admin' | 'super_admin' || null);
      }
    } catch (error) {
      console.error('Error loading current user role:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      const usersData = await UserService.getAllUsers();
      console.log('Users loaded:', usersData);
      console.log('Number of users:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await UserService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
   
    if (currentUserRole === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) {
      Alert.alert('Permission Denied', 'You cannot delete other administrators.');
      return;
    }

   
    if (currentUserRole === 'super_admin' && user.role === 'super_admin' && user.uid !== auth.currentUser?.uid) {
      Alert.alert('Permission Denied', 'You cannot delete other super administrators.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserService.deleteUser(user.uid);
              setUsers(users.filter(u => u.uid !== user.uid));
              Alert.alert('Success', 'User deleted successfully');
              loadUserStats();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleToggleAdmin = async (user: UserData) => {
  
    if (currentUserRole !== 'super_admin') {
      Alert.alert('Permission Denied', 'Only super administrators can manage admin roles.');
      return;
    }

   
    if (user.role === 'super_admin') {
      Alert.alert('Permission Denied', 'Super administrator roles cannot be modified.');
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'make admin' : 'remove admin privileges';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${action} for ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await UserService.updateUserRole(user.uid, newRole);
              setUsers(users.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
              Alert.alert('Success', `User role updated successfully`);
              loadUserStats(); 
            } catch (error) {
              console.error('Error updating user role:', error);
              Alert.alert('Error', 'Failed to update user role');
            }
          }
        }
      ]
    );
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9761A" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                {currentUserRole === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentUserRole === 'super_admin' ? 'Manage users and administrators' : 'Manage users'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
       
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#F9761A" />
            <Text style={styles.statNumber}>{userStats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={32} color="#28a745" />
            <Text style={styles.statNumber}>{userStats.totalAdmins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        
        <View style={styles.usersContainer}>
          <Text style={styles.usersTitle}>Users ({filteredUsers.length})</Text>
          {filteredUsers.length === 0 ? (
            <View style={styles.noUsersContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.noUsersText}>No users found</Text>
              <Text style={styles.noUsersSubtext}>
                {users.length === 0 
                  ? "No users have been created yet. Create some users through the signup process."
                  : "No users match your search criteria."
                }
              </Text>
              {users.length === 0 && (
                  <TouchableOpacity
                    style={styles.createTestUserButton}
                    onPress={async () => {
                      try {
                        await UserService.createUser('test@example.com', 'password123', 'user');
                        Alert.alert('Success', 'Test user created! Refresh to see the user.');
                        loadUsers();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to create test user');
                      }
                    }}
                  >
                  <Text style={styles.createTestUserButtonText}>Create Test User</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredUsers.map((item) => (
            <View key={item.uid} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Ionicons 
                    name={
                      item.role === 'super_admin' ? 'shield' : 
                      item.role === 'admin' ? 'shield-checkmark' : 'person'
                    } 
                    size={24} 
                    color={
                      item.role === 'super_admin' ? '#dc3545' : 
                      item.role === 'admin' ? '#28a745' : '#F9761A'
                    } 
                  />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
                  <Text style={styles.userRole}>
                    {item.role === 'super_admin' ? 'Super Admin' : 
                     item.role === 'admin' ? 'Admin' : 'User'}
                  </Text>
                  <Text style={styles.userDate}>
                    Joined: {item.createdAt ? item.createdAt.toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.userActions}>
                
                {currentUserRole === 'super_admin' && item.role !== 'super_admin' && (
                  <TouchableOpacity
                    onPress={() => handleToggleAdmin(item)}
                    style={[
                      styles.actionButton,
                      item.role === 'admin' ? styles.removeAdminButton : styles.makeAdminButton
                    ]}
                  >
                    <Ionicons 
                      name={item.role === 'admin' ? 'shield-checkmark' : 'shield-outline'} 
                      size={20} 
                      color={item.role === 'admin' ? '#28a745' : '#dc3545'} 
                    />
                  </TouchableOpacity>
                )}
                
             
                {((currentUserRole === 'admin' && item.role === 'user') || 
                  (currentUserRole === 'super_admin' && item.role !== 'super_admin') ||
                  (currentUserRole === 'super_admin' && item.role === 'super_admin' && item.uid === auth.currentUser?.uid)) && (
                  <TouchableOpacity
                    onPress={() => handleDeleteUser(item)}
                    style={[styles.actionButton, styles.deleteButton]}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            ))
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  header: {
    backgroundColor: '#F9761A',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    paddingTop: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  usersContainer: {
    marginBottom: 30,
  },
  usersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 14,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  makeAdminButton: {
    backgroundColor: '#ffeaea',
  },
  removeAdminButton: {
    backgroundColor: '#eafaea',
  },
  deleteButton: {
    backgroundColor: '#ffeaea',
  },
  noUsersContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 16,
  },
  noUsersText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 6,
  },
  noUsersSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  createTestUserButton: {
    backgroundColor: '#F9761A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  createTestUserButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
