import avatars from '@/constants/avatars';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: any) => void;
}

const { width } = Dimensions.get('window');

export default function AvatarPickerModal({ visible, onClose, onSelectAvatar }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAvatarSelect = (avatar: any, index: number) => {
    setSelectedIndex(index);
    
    setTimeout(() => {
      onSelectAvatar(avatar);
      onClose();
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            width: width * 0.9,
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
          }}
        >
          {/* Header Section */}
          <View style={{ padding: 24, paddingBottom: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  backgroundColor: '#8B5CF6',
                  borderRadius: 50,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="person-circle" size={40} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#1F2937',
                  marginBottom: 8,
                }}
              >
                Choose Your Avatar
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                Select a avatar picture that represents your personality
              </Text>
            </View>
          </View>

         
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              paddingHorizontal: 20,
              paddingBottom: 20,
              paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ maxHeight: 300 }}
          >
            {avatars.map((avatar, index) => {
              const scaleAnim = useRef(new Animated.Value(1)).current;
              
              const handlePressIn = () => {
                Animated.spring(scaleAnim, {
                  toValue: 0.95,
                  useNativeDriver: true,
                }).start();
              };
              
              const handlePressOut = () => {
                Animated.spring(scaleAnim, {
                  toValue: 1,
                  useNativeDriver: true,
                }).start();
              };

              return (
                <Animated.View
                  key={index}
                  style={{
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <TouchableOpacity
                    style={{
                      margin: 8,
                      borderRadius: 20,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => handleAvatarSelect(avatar, index)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        backgroundColor: '#F3F4F6',
                        borderWidth: selectedIndex === index ? 4 : 3,
                        borderColor: selectedIndex === index ? '#8B5CF6' : '#E5E7EB',
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                      }}
                    >
                      <Image
                        source={avatar}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        resizeMode="cover"
                      />
                      {selectedIndex === index && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: '#8B5CF6',
                            borderRadius: 12,
                            width: 24,
                            height: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#8B5CF6',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }}
                        >
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
