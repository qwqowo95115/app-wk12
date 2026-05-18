import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';

const API_KEY = "YOUR_API_KEY"; 

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODEL_NAME = "llama-3.1-8b-instant"; 

export default function App() {
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessageText = inputText.trim();
    setInputText(''); 

    const newUserMessage = {
      id: Date.now().toString() + '-user',
      role: 'user', 
      text: userMessageText,
    };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const historyPayload = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.text 
    }));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}` 
        },
        body: JSON.stringify({
          model: MODEL_NAME,  
          messages: historyPayload,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      const aiResponseText = data.choices[0].message.content;

      const newAiMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant', 
        text: aiResponseText,
      };

      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error("GROQ API 請求失敗:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        text: '❌ 發生錯誤，請檢查 API Key 或網路連線。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>聊天室</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6200EE" />
            <Text style={styles.loadingText}>GROQ 運算中...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="輸入訊息..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
            <Text style={styles.sendButtonText}>發送</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  messageList: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginVertical: 6 },
  userBubble: { backgroundColor: '#34C759', alignSelf: 'flex-end', borderBottomRightRadius: 2 }, // 換個綠色區分
  aiBubble: { backgroundColor: '#E5E5EA', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  aiText: { color: '#000000' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 },
  loadingText: { marginLeft: 8, color: '#8E8E93', fontSize: 14 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 16, maxHeight: 100, color: '#000000' },
  sendButton: { marginLeft: 12, backgroundColor: '#34C759', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});