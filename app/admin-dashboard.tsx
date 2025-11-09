import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const [activeView, setActiveView] = useState<'users' | 'admins'>('users');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserData | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

    if (user.role === 'super_admin') {
      Alert.alert('Permission Denied', 'Super administrators cannot be deleted.');
      return;
    }

    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await UserService.deleteUser(userToDelete.uid);
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUserStats();
      
      setSuccessMessage('User deleted successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
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

    
    setUserToToggle(user);
    setShowToggleModal(true);
  };

  const confirmToggleAdmin = async () => {
    if (!userToToggle) return;

    setIsToggling(true);
    try {
      const newRole = userToToggle.role === 'admin' ? 'user' : 'admin';
      await UserService.updateUserRole(userToToggle.uid, newRole);
      setUsers(users.map(u => u.uid === userToToggle.uid ? { ...u, role: newRole } : u));
      setShowToggleModal(false);
      setUserToToggle(null);
      loadUserStats();
     
      setSuccessMessage(`User role updated successfully`);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    } finally {
      setIsToggling(false);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  
  const visibleUsers = users.filter(user => {
   
    if (currentUserRole === 'admin' && user.role === 'super_admin') {
      return false;
    }
    return true;
  });

  
  const regularUsers = visibleUsers.filter(user => user.role === 'user');
  
  
  const adminUsers = currentUserRole === 'super_admin' 
    ? visibleUsers.filter(user => user.role === 'admin' || user.role === 'super_admin')
    : visibleUsers.filter(user => user.role === 'admin');


  const filteredRegularUsers = regularUsers.filter(user =>
    user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAdminUsers = adminUsers.filter(user =>
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
            <Text style={styles.statNumber}>{regularUsers.length}</Text>
            <Text style={styles.statLabel}>Regular Users</Text>
          </View>
          {(currentUserRole === 'super_admin' || adminUsers.length > 0) && (
            <View style={styles.statCard}>
              <Ionicons name="shield-checkmark" size={32} color="#28a745" />
              <Text style={styles.statNumber}>{adminUsers.length}</Text>
              <Text style={styles.statLabel}>Administrators</Text>
            </View>
          )}
        </View>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeView === 'users' && styles.toggleButtonActive]}
            onPress={() => setActiveView('users')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeView === 'users' ? '#fff' : '#F9761A'} 
            />
            <Text style={[styles.toggleButtonText, activeView === 'users' && styles.toggleButtonTextActive]}>
              Users 
            </Text>
          </TouchableOpacity>
          {(currentUserRole === 'super_admin' || (currentUserRole === 'admin' && adminUsers.length > 0)) && (
            <TouchableOpacity
              style={[
                styles.toggleButton, 
                activeView === 'admins' && styles.toggleButtonActiveAdmin
              ]}
              onPress={() => setActiveView('admins')}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={20} 
                color={activeView === 'admins' ? '#fff' : '#28a745'} 
              />
              <Text style={[
                activeView === 'admins' ? styles.toggleButtonTextActive : styles.toggleButtonTextAdmin
              ]}>
                Admins 
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeView === 'users' ? "Search users..." : "Search administrators..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        
        
        {activeView === 'users' && (
          <View style={styles.usersContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#F9761A" />
              <Text style={styles.sectionTitle}>Regular Users ({filteredRegularUsers.length})</Text>
            </View>
            {filteredRegularUsers.length === 0 ? (
              <View style={styles.noUsersContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.noUsersText}>No users found</Text>
                <Text style={styles.noUsersSubtext}>
                  {regularUsers.length === 0 
                    ? "No regular users have been created yet."
                    : "No users match your search criteria."
                  }
                </Text>
              </View>
            ) : (
              filteredRegularUsers.map((item) => (
              <View key={item.uid} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color="#F9761A"
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
                    <Text style={styles.userRole}>User</Text>
                    <Text style={styles.userDate}>
                      Joined: {item.createdAt ? item.createdAt.toLocaleDateString() : 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  {((currentUserRole === 'admin' && item.role === 'user') || 
                    (currentUserRole === 'super_admin' && item.role === 'user')) && (
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
        )}

        
        {activeView === 'admins' && (currentUserRole === 'super_admin' || (currentUserRole === 'admin' && adminUsers.length > 0)) && (
          <View style={styles.usersContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#28a745" />
              <Text style={styles.sectionTitle}>Administrators ({filteredAdminUsers.length})</Text>
            </View>
            {filteredAdminUsers.length === 0 ? (
              <View style={styles.noUsersContainer}>
                <Ionicons name="shield-outline" size={48} color="#ccc" />
                <Text style={styles.noUsersText}>No administrators found</Text>
                <Text style={styles.noUsersSubtext}>
                  {adminUsers.length === 0 
                    ? "No administrators have been created yet."
                    : "No administrators match your search criteria."
                  }
                </Text>
              </View>
            ) : (
              filteredAdminUsers.map((item) => (
              <View key={item.uid} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons 
                      name={
                        item.role === 'super_admin' ? 'shield' : 'shield-checkmark'
                      } 
                      size={24} 
                      color={
                        item.role === 'super_admin' ? '#dc3545' : '#28a745'
                      } 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
                    <Text style={styles.userRole}>
                      {item.role === 'super_admin' ? 'Super Admin' : 'Admin'}
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
                 
                  {currentUserRole === 'super_admin' && item.role !== 'super_admin' && (
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
        )}
        </ScrollView>
      </SafeAreaView>

      
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Delete User?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete <Text style={styles.modalEmail}>{userToDelete?.email}</Text>? This action cannot be undone.
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryButton, isDeleting && styles.modalButtonDisabled]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDestructiveButton, isDeleting && styles.modalButtonDisabled]}
                onPress={confirmDeleteUser}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDestructiveButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

     
      <Modal
        visible={showToggleModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isToggling && setShowToggleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, styles.modalIconCircleWarning]}>
              <Ionicons 
                name={userToToggle?.role === 'admin' ? 'shield-outline' : 'shield-checkmark'} 
                size={40} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.modalTitle}>
              {userToToggle?.role === 'admin' ? 'Remove Admin?' : 'Make Admin?'}
            </Text>
            <Text style={styles.modalMessage}>
              {userToToggle?.role === 'admin' 
                ? `Are you sure you want to remove admin privileges from ${userToToggle?.email}? They will become a regular user.`
                : `Are you sure you want to make ${userToToggle?.email} an administrator? They will have admin privileges.`
              }
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryButton, isToggling && styles.modalButtonDisabled]}
                onPress={() => setShowToggleModal(false)}
                disabled={isToggling}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, isToggling && styles.modalButtonDisabled]}
                onPress={confirmToggleAdmin}
                disabled={isToggling}
                activeOpacity={0.8}
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

     
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircleSuccess}>
              <Ionicons name="checkmark" size={50} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.modalSuccessButton}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSuccessButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#F9761A',
  },
  toggleButtonActiveAdmin: {
    backgroundColor: '#28a745',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9761A',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  toggleButtonTextAdmin: {
    color: '#28a745',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconCircleWarning: {
    backgroundColor: '#F9761A',
  },
  modalIconCircleSuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalEmail: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalSecondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDestructiveButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDestructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#F9761A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalSuccessButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSuccessButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
