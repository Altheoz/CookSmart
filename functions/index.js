const functions = require('firebase-functions');
const admin = require('firebase-admin');


admin.initializeApp();


exports.deleteUser = functions.https.onCall(async (data, context) => {
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  
  const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  const isSelfDeletion = context.auth.uid === uid;

  if (!isAdmin && !isSelfDeletion) {
    throw new functions.https.HttpsError('permission-denied', 'You can only delete your own account or be an admin to delete other users');
  }

  try {
    
    await admin.auth().deleteUser(uid);
    
    
    const batch = admin.firestore().batch();
    
  
    batch.delete(admin.firestore().collection('users').doc(uid));
    
    
    const favoritesSnapshot = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('favorites')
      .get();
    
    favoritesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    
    const savedSnapshot = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('saved')
      .get();
    
    savedSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
   
    await batch.commit();
    
    return { success: true, message: 'User deleted successfully from both Auth and Firestore' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});
