import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


interface CookingStep {
  step: number;
  instruction: string;
  timer?: number;
  tip?: string;
  expectation?: string;
}

export default function CookingInterfaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meal } = route.params;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showStepOverview, setShowStepOverview] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [readSteps, setReadSteps] = useState<Set<number>>(new Set());
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastCommandTime, setLastCommandTime] = useState(0);
  const [voiceActivated, setVoiceActivated] = useState(false); 
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;


  const generateCookingTip = (instruction: string): string => {
    const lowerInstruction = instruction.toLowerCase();
    
    if (lowerInstruction.includes('preheat') || lowerInstruction.includes('oven')) {
      return "Make sure your oven is fully preheated for even baking!";
    } else if (lowerInstruction.includes('boil') || lowerInstruction.includes('water')) {
      return "Wait for a rolling boil before adding ingredients!";
    } else if (lowerInstruction.includes('sauté') || lowerInstruction.includes('fry')) {
      return "Keep the heat medium-high and don't overcrowd the pan!";
    } else if (lowerInstruction.includes('season') || lowerInstruction.includes('salt')) {
      return "Taste as you go and adjust seasoning gradually!";
    } else if (lowerInstruction.includes('mix') || lowerInstruction.includes('stir')) {
      return "Mix gently to avoid overworking the ingredients!";
    } else {
      return "Take your time and follow the instructions carefully!";
    }
  };


  const generateExpectation = (instruction: string): string => {
    const lowerInstruction = instruction.toLowerCase();
    
    if (lowerInstruction.includes('preheat') || lowerInstruction.includes('180') || lowerInstruction.includes('350')) {
      return "You want to see the oven display reading 180 degrees before you start baking.";
    } else if (lowerInstruction.includes('golden') || lowerInstruction.includes('brown')) {
      return "Look for a golden brown color on the surface.";
    } else if (lowerInstruction.includes('tender') || lowerInstruction.includes('soft')) {
      return "The ingredients should be tender when pierced with a fork.";
    } else if (lowerInstruction.includes('bubbling') || lowerInstruction.includes('boil')) {
      return "You should see steady bubbling or boiling action.";
    } else if (lowerInstruction.includes('fragrant') || lowerInstruction.includes('aroma')) {
      return "You should smell a pleasant, aromatic fragrance.";
    } else {
      return "Follow the visual and textural cues in the instruction.";
    }
  };

  const cookingSteps: CookingStep[] = React.useMemo(() => {
    const rawInstructions = typeof meal?.strInstructions === 'string' ? meal.strInstructions : '';
    const instructions = rawInstructions
      .replace(/\r\n/g, '\n')
      .split(/\n+|(?<=\.)\s+(?=[A-Z])/)
      .map((instruction: string) => instruction.trim())
      .filter(Boolean);

    return instructions.map((instruction: string, index: number) => {
      const timerMatch = instruction.match(/(\d+)\s*(minute|min|hour|hr|second|sec)/i);
      let timer = 0;
      if (timerMatch) {
        const value = parseInt(timerMatch[1]);
        const unit = timerMatch[2].toLowerCase();
        if (unit.includes('minute') || unit.includes('min')) {
          timer = value * 60;
        } else if (unit.includes('hour') || unit.includes('hr')) {
          timer = value * 3600;
        } else if (unit.includes('second') || unit.includes('sec')) {
          timer = value;
        }
      }

      const tip = generateCookingTip(instruction);
      const expectation = generateExpectation(instruction);

      return {
        step: index + 1,
        instruction,
        timer: timer > 0 ? timer : undefined,
        tip,
        expectation
      };
    });
  }, [meal.idMeal]);

  const progress = cookingSteps.length > 0 ? ((currentStep + 1) / cookingSteps.length) * 100 : 0;

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'CookSmart needs access to your microphone for voice commands.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startListening = () => {
    if (!isVoiceEnabled || isRecognizing || speaking) return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported, using fallback');
      simulateVoiceRecognition();
      return;
    }
    
    try {
      setIsRecognizing(true);
      setIsListening(true);
      setRecognitionResult('');
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Speech recognition result:', command);
        setRecognitionResult(command);
        
        const now = Date.now();
        if (now - lastCommandTime > 3000) { 
          processVoiceCommand(command);
          setLastCommandTime(now);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        simulateVoiceRecognition();
      };
      
      recognition.onend = () => {
        setIsRecognizing(false);
        setIsListening(false);
        setTimeout(() => {
          setRecognitionResult('');
        }, 2000);
      };
      
      recognition.start();
    } catch (error) {
      console.error('Speech recognition setup error:', error);
      simulateVoiceRecognition();
    }
  };


  const simulateVoiceRecognition = () => {
    setIsRecognizing(true);
    setIsListening(true);
    setRecognitionResult('');
    
    setTimeout(() => {
      const commands = [
        'next step', 'previous step', 'go back', 'pause', 'resume', 
        'start timer', 'stop timer', 'repeat', 'mark complete'
      ];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      setRecognitionResult(randomCommand);
      
      const now = Date.now();
      if (now - lastCommandTime > 3000) {
        processVoiceCommand(randomCommand);
        setLastCommandTime(now);
      }
      
      setTimeout(() => {
        setIsRecognizing(false);
        setIsListening(false);
        setRecognitionResult('');
      }, 2000);
    }, 1500);
  };

  useEffect(() => {
    if (voiceActivated && isVoiceEnabled && hasPermission && !isRecognizing && !speaking) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (!isRecognizing && !speaking && isVoiceEnabled && (now - lastCommandTime > 5000)) {
          startListening();
        }
      }, 4000);
      
      voiceIntervalRef.current = interval;

      return () => {
        if (voiceIntervalRef.current) {
          clearInterval(voiceIntervalRef.current);
          voiceIntervalRef.current = null;
        }
      };
    }
  }, [voiceActivated, isVoiceEnabled, hasPermission, isRecognizing, speaking, lastCommandTime]);

  const speakConfirmation = async (message: string) => {
   
    stopAllSpeech();
    
   
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      await Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Confirmation speech error:', error);
    }
  };

  const stopAllSpeech = () => {
    try {
      Speech.stop();
      setSpeaking(false);
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  const transitionToStep = (newStep: number) => {
   
    stopAllSpeech();
    
  
    setCurrentStep(newStep);
    
 
    if (voiceActivated && cookingSteps[newStep]) {
      setTimeout(() => {
        speakInstruction(cookingSteps[newStep].instruction);
      }, 500);
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    console.log('Voice command received:', lowerCommand);
    
    const nextKeywords = ['next', 'next step', 'forward', 'continue', 'proceed', 'go next'];
    const prevKeywords = ['previous', 'previous step', 'back', 'go back', 'return', 'last step'];
    const pauseKeywords = ['pause', 'stop', 'halt', 'wait'];
    const resumeKeywords = ['resume', 'play', 'continue', 'start', 'go'];
    const timerStartKeywords = ['start timer', 'timer start', 'begin timer', 'start the timer'];
    const timerStopKeywords = ['stop timer', 'timer stop', 'end timer', 'stop the timer'];
    const repeatKeywords = ['repeat', 'say again', 'read again', 'replay'];
    const completeKeywords = ['mark complete', 'complete', 'done', 'finished', 'mark as done'];
    const voiceOffKeywords = ['voice off', 'stop listening', 'disable voice', 'turn off voice'];
    const voiceOnKeywords = ['voice on', 'start listening', 'enable voice', 'turn on voice'];
    
    if (nextKeywords.some(keyword => lowerCommand.includes(keyword))) {
      goToNextStep();
      speakConfirmation("Okay, going to next step");
    } else if (prevKeywords.some(keyword => lowerCommand.includes(keyword))) {
      goToPreviousStep();
      speakConfirmation("Okay, going to previous step");
    } else if (pauseKeywords.some(keyword => lowerCommand.includes(keyword))) {
      togglePause();
      speakConfirmation("Okay, pausing");
    } else if (resumeKeywords.some(keyword => lowerCommand.includes(keyword))) {
      togglePause();
      speakConfirmation("Okay, resuming");
    } else if (timerStartKeywords.some(keyword => lowerCommand.includes(keyword))) {
      startTimer();
      speakConfirmation("Okay, starting timer");
    } else if (timerStopKeywords.some(keyword => lowerCommand.includes(keyword))) {
      stopTimer();
      speakConfirmation("Okay, stopping timer");
    } else if (repeatKeywords.some(keyword => lowerCommand.includes(keyword))) {
      speakInstruction(currentStepData?.instruction || '');
      speakConfirmation("Okay, repeating instruction");
    } else if (completeKeywords.some(keyword => lowerCommand.includes(keyword))) {
      markStepComplete();
      speakConfirmation("Okay, marking step as complete");
    } else if (voiceOffKeywords.some(keyword => lowerCommand.includes(keyword))) {
      setIsVoiceEnabled(false);
      speakConfirmation("Okay, voice commands disabled");
    } else if (voiceOnKeywords.some(keyword => lowerCommand.includes(keyword))) {
      setIsVoiceEnabled(true);
      speakConfirmation("Okay, voice commands enabled");
    } else {
      console.log('No command recognized for:', lowerCommand);
      speakConfirmation("Sorry, I didn't understand that command");
    }
  };

  const goToNextStep = () => {
    if (currentStep < cookingSteps.length - 1) {
     
      stopAllSpeech();
      
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
       setCurrentStep(currentStep + 1);
       stopTimer();
      
      Animated.timing(progressAnim, {
        toValue: ((currentStep + 2) / cookingSteps.length) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
     
      if (voiceActivated && cookingSteps[currentStep + 1]) {
        setTimeout(() => {
          speakInstruction(cookingSteps[currentStep + 1].instruction);
        }, 500); 
      }
    } else {
      const newCompletedSteps = new Set([...completedSteps, currentStep]);
      if (newCompletedSteps.size === cookingSteps.length) {
        stopVoiceRecognition();
        stopAllSpeech();
        setTimeout(() => {
          navigation.navigate('RecipeCompletion', { meal });
        }, 4000); 
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      
      stopAllSpeech();
      
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep - 1);
        return newSet;
      });
      
       setCurrentStep(currentStep - 1);
       stopTimer();
      
      Animated.timing(progressAnim, {
        toValue: (currentStep / cookingSteps.length) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
    
      if (voiceActivated && cookingSteps[currentStep - 1]) {
        setTimeout(() => {
          speakInstruction(cookingSteps[currentStep - 1].instruction);
        }, 500); 
      }
    }
  };

  const stopVoiceRecognition = () => {
  
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      recognitionRef.current = null;
    }
    
   
    stopAllSpeech();
    
   
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }
    
    
    setIsVoiceEnabled(false);
    setVoiceActivated(false);
    setIsListening(false);
    setIsRecognizing(false);
    setSpeaking(false);
    setRecognitionResult('');
  };

  const markStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    speakConfirmation("Step marked as complete enjoy your meal");
    
    const newCompletedSteps = new Set([...completedSteps, currentStep]);
    if (newCompletedSteps.size === cookingSteps.length) {
      stopVoiceRecognition();
      stopAllSpeech();
      setTimeout(() => {
        navigation.navigate('RecipeCompletion', { meal });
      }, 4000); 
    } else if (currentStep < cookingSteps.length - 1) {
      goToNextStep();
    }
  };

  const togglePause = () => {
    setIsPlaying(!isPlaying);
    if (timerActive) {
      if (isPlaying) {
        stopTimer();
      } else {
        startTimer();
      }
    }
  };

  const startTimer = () => {
    const currentStepData = cookingSteps[currentStep];
    if (currentStepData.timer) {
      setTimeRemaining(currentStepData.timer);
      setTimerActive(true);
      setIsPlaying(true);
      
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            Vibration.vibrate([0, 500, 200, 500]);
            stopTimer();
            speakConfirmation("Timer complete! Moving to next step");
            goToNextStep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
    setIsPlaying(false);
    pulseAnim.setValue(1);
  };

  const resetTimer = () => {
    stopTimer();
    const currentStepData = cookingSteps[currentStep];
    if (currentStepData.timer) {
      setTimeRemaining(currentStepData.timer);
    }
  };

  const speakInstruction = async (instruction: string) => {
    
    stopAllSpeech();
    
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setSpeaking(true);
    setLastCommandTime(Date.now());
    try {
      await Speech.speak(instruction, {
        language: 'en',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setSpeaking(false);
    }
  };

  useEffect(() => {
    const initVoiceRecognition = async () => {
      const permission = await requestMicrophonePermission();
      setHasPermission(permission);
      if (permission) {
        Alert.alert(
          'Voice Commands Ready!', 
          'You can now use voice commands like "next step", "previous step", "pause", "start timer", "repeat", and "mark complete".',
          [
            {
              text: 'OK',
              onPress: () => setVoiceActivated(true),
            },
          ],
          { cancelable: false }
        );
      }
    };
    initVoiceRecognition();
  }, []);

  useEffect(() => {
    progressAnim.setValue(((currentStep + 1) / cookingSteps.length) * 100);
  }, [cookingSteps.length]);

  useEffect(() => {
    if (voiceActivated && cookingSteps[currentStep] && !readSteps.has(currentStep)) {
      speakInstruction(cookingSteps[currentStep].instruction);
      setReadSteps(prev => new Set([...prev, currentStep]));
    }
  }, [voiceActivated, currentStep, cookingSteps, readSteps]);

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopVoiceRecognition();
    };
  }, []);

 
  useEffect(() => {
    return () => {
     
      stopAllSpeech();
      
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on unmount:', error);
        }
      }
      
     
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
     
      return () => {
        stopVoiceRecognition();
      };
    }, [])
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStepData = cookingSteps[currentStep];

  if (cookingSteps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="restaurant" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>Cooking</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No cooking instructions available for this recipe.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            
            stopVoiceRecognition();
            stopAllSpeech();
            navigation.goBack();
          }} 
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="restaurant" size={24} color="#4CAF50" />
          <Text style={styles.headerTitle}>Cooking Mode</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {cookingSteps.length} • {Math.round(progress)}% Complete
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.stepCard,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepInfo}>
              <Text style={styles.stepCounter}>Step {currentStep + 1} of {cookingSteps.length}</Text>
              <View style={[
                styles.stepStatus,
                { backgroundColor: completedSteps.has(currentStep) ? '#4CAF50' : '#FF9800' }
              ]}>
                <Ionicons 
                  name={completedSteps.has(currentStep) ? "checkmark" : "time"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.stepStatusText}>
                  {completedSteps.has(currentStep) ? 'Completed' : 'In Progress'}
                </Text>
              </View>
            </View>
             <View style={styles.speakingIndicator}>
               <Ionicons name="volume-high" size={16} color="#4CAF50" />
               <Text style={styles.speakingText}>{speaking ? "Speaking" : "Tap to hear instruction"}</Text>
             </View>
          </View>
          
          <Text style={styles.stepTitle}>Step {currentStep + 1}</Text>
          <Text style={styles.stepInstruction}>{currentStepData?.instruction}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.speakButton} 
              onPress={() => speakInstruction(currentStepData?.instruction || '')}
            >
              <Ionicons name="volume-high" size={20} color="#4CAF50" />
              <Text style={styles.speakButtonText}>Speak Instruction</Text>
            </TouchableOpacity>

            {currentStep === cookingSteps.length - 1 && (
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={markStepComplete}
                disabled={completedSteps.has(currentStep)}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.completeButtonText}>
                  {completedSteps.has(currentStep) ? 'Completed' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tipsContainer}>
            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={16} color="#1976D2" />
                <Text style={styles.tipLabel}>Pro Tip</Text>
              </View>
              <Text style={styles.tipText}>{currentStepData?.tip}</Text>
            </View>
            
            <View style={styles.expectationBox}>
              <View style={styles.tipHeader}>
                <Ionicons name="eye" size={16} color="#F57C00" />
                <Text style={styles.expectationLabel}>What to Look For</Text>
              </View>
              <Text style={styles.expectationText}>{currentStepData?.expectation}</Text>
            </View>
          </View>
        </Animated.View>

        {currentStepData?.timer && (
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Ionicons name="timer" size={20} color="#4CAF50" />
              <Text style={styles.timerTitle}>Step Timer</Text>
            </View>
            <View style={styles.timerSection}>
              <Animated.View style={[styles.timerDisplay, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerSubtext}>remaining</Text>
              </Animated.View>
              <View style={styles.timerControls}>
                <TouchableOpacity 
                  style={[styles.timerButton, styles.pauseButton]} 
                  onPress={isPlaying ? stopTimer : startTimer}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="white" />
                  <Text style={styles.timerButtonText}>{isPlaying ? "Pause" : "Start"}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timerButton, styles.resetButton]} 
                  onPress={resetTimer}
                >
                  <Ionicons name="refresh" size={16} color="#333" />
                  <Text style={[styles.timerButtonText, { color: "#333" }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.navigationCard}>
          <Text style={styles.navigationTitle}>Step Navigation</Text>
          <View style={styles.navigationControls}>
            <TouchableOpacity 
              style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]} 
              onPress={goToPreviousStep}
              disabled={currentStep === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? "#ccc" : "#333"} />
              <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>Previous</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navButton, currentStep === cookingSteps.length - 1 && styles.navButtonDisabled]} 
              onPress={goToNextStep}
              disabled={currentStep === cookingSteps.length - 1}
            >
              <Text style={[styles.navButtonText, currentStep === cookingSteps.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={currentStep === cookingSteps.length - 1 ? "#ccc" : "#333"} />
            </TouchableOpacity>
          </View>
        </View>

         <View style={styles.voiceSection}>
           <View style={styles.voiceHeader}>
             <Ionicons name="mic" size={20} color="white" />
             <Text style={styles.voiceTitle}>Voice Commands</Text>
             <TouchableOpacity 
               onPress={() => setIsVoiceEnabled(!isVoiceEnabled)}
               style={styles.voiceToggle}
             >
               <Ionicons 
                 name={isVoiceEnabled ? "volume-high" : "volume-mute"} 
                 size={20} 
                 color="white" 
               />
             </TouchableOpacity>
           </View>
           
           <View style={styles.voiceStatus}>
             <Animated.View style={[styles.voiceIcon, { transform: [{ scale: pulseAnim }] }]}>
               <Ionicons 
                 name={isRecognizing ? "mic" : isListening ? "mic" : isVoiceEnabled ? "mic-outline" : "mic-off"} 
                 size={40} 
                 color="white" 
               />
             </Animated.View>
             <Text style={styles.voiceStatusText}>
               {isRecognizing ? 'Recognizing...' : isListening ? 'Listening...' : isVoiceEnabled ? 'Ready to listen' : 'Voice disabled'}
             </Text>
             {recognitionResult && (
               <Text style={styles.recognitionResult}>
                 Heard: "{recognitionResult}"
               </Text>
             )}
           </View>
           
           <Text style={styles.voiceHint}>
             Voice Commands: "next step", "previous step", "pause", "start timer", "repeat", "mark complete"
           </Text>
         </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepCounter: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: 8,
  },
  stepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  stepStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speakingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  stepInstruction: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 26,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  speakButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  speakButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tipsContainer: {
    gap: 16,
  },
  tipBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
  },
  tipText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  expectationBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  expectationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
  },
  expectationText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  timerSection: {
    alignItems: 'center',
  },
  timerDisplay: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  timerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  timerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  navigationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  navigationControls: {
    flexDirection: 'row',
    gap: 16,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  navButtonDisabled: {
    backgroundColor: '#F8F9FA',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  navButtonTextDisabled: {
    color: '#ADB5BD',
  },
  voiceSection: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
   voiceHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 20,
   },
   voiceTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: 'white',
     flex: 1,
   },
   voiceToggle: {
     padding: 8,
     borderRadius: 20,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
   },
   voiceStatus: {
     alignItems: 'center',
     marginBottom: 16,
   },
   voiceIcon: {
     width: 90,
     height: 90,
     borderRadius: 45,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
     borderWidth: 3,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   voiceStatusText: {
     fontSize: 16,
     color: 'white',
     fontWeight: '600',
     marginBottom: 8,
   },
   recognitionResult: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.8)',
     fontStyle: 'italic',
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 16,
   },
   voiceHint: {
     fontSize: 14,
     color: 'rgba(255, 255, 255, 0.9)',
     textAlign: 'center',
     lineHeight: 20,
     fontWeight: '500',
   },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});
