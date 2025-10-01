import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const TermsAndConditions = () => {
  return (
    <SafeAreaView style={styles.container}>
    <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={32} color="#fff" />
            </View>
            <Text style={styles.appName}>CookSmart</Text>
          </View>

          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Welcome to CookSmart</Text>
            <Text style={styles.sectionText}>
              Welcome to CookSmart, your intelligent cooking companion! These Terms and Conditions 
              ("Terms") govern your use of our mobile application and services. By using CookSmart, 
              you agree to be bound by these Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. What is CookSmart?</Text>
            <Text style={styles.sectionText}>
              CookSmart is an AI-powered cooking application that helps you discover recipes, 
              plan meals, and enhance your culinary experience. Our app provides personalized 
              recipe recommendations, cooking guidance, and meal planning tools.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              • You must provide accurate and complete information when creating your account{'\n'}
              • You are responsible for maintaining the security of your account{'\n'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Privacy & Data Protection</Text>
            <Text style={styles.sectionText}>
              We take your privacy seriously. Your personal information, cooking preferences, 
              and usage data are protected according to our Privacy Policy. We only collect 
              data necessary to provide you with the best cooking experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. App Features & Content</Text>
            <Text style={styles.sectionText}>
              • Recipe recommendations are AI-generated and should be used as guidance{'\n'}
              • Always follow proper food safety practices when cooking{'\n'}
              • Content may be updated regularly to enhance your experience
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. User Responsibilities</Text>
            <Text style={styles.sectionText}>
              • Use the app responsibly and in accordance with these Terms{'\n'}
              • Report any bugs or issues you encounter
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Prohibited Activities</Text>
            <Text style={styles.sectionText}>
              You may not:{'\n'}
              • Use the app for any illegal purposes{'\n'}
              • Attempt to hack or compromise our systems{'\n'}
              • Share false or misleading information{'\n'}
              • Violate any applicable laws or regulations
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
            <Text style={styles.sectionText}>
              CookSmart and its content are protected by intellectual property laws. 
              You may not copy, modify, or distribute our content without permission. 
              Recipe content may be sourced from various providers and is used under license.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Disclaimers</Text>
            <Text style={styles.sectionText}>
              • Recipe recommendations are for informational purposes only{'\n'}
              • We are not responsible for cooking outcomes or food safety{'\n'}
              • Always consult healthcare professionals for dietary restrictions{'\n'}
              • App availability may vary and is not guaranteed
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may update these Terms from time to time. We will notify you of significant 
              changes through the app or via email. Continued use of the app after changes 
              constitutes acceptance of the new Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have questions about these Terms, please contact us:{'\n'}
              • Email: altheozcarl@gmail.com{'\n'}
              • We aim to respond within 24-48 hours
            </Text>
          </View>

          <View style={styles.agreementSection}>
            <View style={styles.agreementBox}>
              <Ionicons name="checkmark-circle" size={24} color="#F9761A" />
              <Text style={styles.agreementText}>
                By using CookSmart, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and Conditions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => router.back()}
        >
          <Text style={styles.acceptButtonText}>I Understand</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: {

    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F9761A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F9761A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Sansita',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  agreementSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  agreementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F9761A',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    paddingTop: 20,
    paddingEnd: 20,
    paddingStart: 20,
    paddingBottom: 45,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  acceptButton: {
    backgroundColor: '#F9761A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F9761A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
