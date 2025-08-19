import { router } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';

export default function Example() {

    const [recipe, setRecipe] = useState('');
  const [todos, setTodos] = useState<any>([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const todosCollection = collection(db, 'todos');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, []);

    useEffect(() => {
    fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    if (user) {
      const q = query(todosCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      setTodos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } else {
      console.log("No user logged in");
    }
  };

  const addTodo = async () => {
    if (user) {
      await addDoc(todosCollection, { recipe, completed: false, userId: user.uid });
      setRecipe('');
      fetchTodos();
    } else {
      console.log("No user logged in");
    }
  };

  const updateTodo = async (id: string, completed: any) => {
    const todoDoc = doc(db, 'todos', id);
    await updateDoc(todoDoc, { completed: !completed });
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    const todoDoc = doc(db, 'todos', id);
    await deleteDoc(todoDoc);
    fetchTodos();
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      
       
    <View className="flex-1 bg-white p-6">
      <Text className="text-3xl font-bold text-center mb-6">Favorate List</Text>

      <View className="flex-row mb-4">
        <TextInput
          className="flex-1 border border-gray-300 rounded-md p-3 mr-2"
          placeholder="Add Recipe"
          value={recipe}
          onChangeText={(text) => setRecipe(text)}
        />
        <TouchableOpacity
          className="bg-blue-500 rounded-md px-4 justify-center items-center"
          onPress={addTodo}
        >
          <Text className="text-white font-semibold">Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center mb-3 bg-gray-100 rounded-md p-3">
            <Text
              className={`flex-1 text-base ${
                item.completed ? 'line-through text-gray-500' : 'text-black'
              }`}
            >
              {item.recipe}
            </Text>

            <TouchableOpacity
              className="bg-yellow-500 px-3 py-1 rounded-md mr-2"
              onPress={() => updateTodo(item.id, item.completed)}
            >
              <Text className="text-white text-sm">
                {item.completed ? 'Undo' : 'Complete'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 px-3 py-1 rounded-md"
              onPress={() => deleteTodo(item.id)}
            >
              <Text className="text-white text-sm">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
      
      
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Welcome!
        </Text>

        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-full shadow-md active:opacity-80"
          onPress={() => router.push('../(tabs)/home')}
        >
          <Text className="text-white text-lg font-semibold">Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
