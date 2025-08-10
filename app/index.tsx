import { router } from 'expo-router'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import React, { useState } from 'react'
import { 
    SafeAreaView, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    StyleSheet, 
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native'
import { auth } from '../FirebaseConfig'

const Index = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const signIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.log(error);
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const signUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }
        
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                Alert.alert('Success', 'Account created successfully!');
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            console.log(error);
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>CookSmart</Text>
                        <Text style={styles.subtitle}>Your Personal Cooking Assistant</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Welcome Back</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <TouchableOpacity 
                            style={[styles.button, styles.signInButton]} 
                            onPress={signIn}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.button, styles.signUpButton]} 
                            onPress={signUp}
                            disabled={isLoading}
                        >
                            <Text style={[styles.buttonText, styles.signUpButtonText]}>
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 15,
    },
    signInButton: {
        backgroundColor: '#3498db',
    },
    signUpButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3498db',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpButtonText: {
        color: '#3498db',
    },
});

export default Index 