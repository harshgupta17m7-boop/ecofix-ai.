import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Leaf, Send } from 'lucide-react-native';

const API_URL = 'http://192.168.1.9:8000/api';

const TIPS = [
  "Did you know? Recycling one aluminum can saves enough energy to listen to a full album on your iPod. Or, you know, watch a few TikToks.",
  "Health Tip: Always wear thick, puncture-resistant gloves when participating in a civic cleanup to avoid cuts from rusted metal or glass.",
  "Environmental Protection: Keep batteries out of the trash! They leak toxic chemicals into groundwater. Drop them at local hazardous waste centers.",
  "Community: You don't have to clean alone! Pledging to be a 'Supply Coordinator' on a project is just as important as heavy lifting."
];

export default function TipsScreen() {
  const [messages, setMessages] = useState<{id: string, role: 'user' | 'assistant', text: string}[]>([
    { id: 'msg-0', role: 'assistant', text: "Hello! I am the EcoFix AI Assistant. Ask me anything about environmental protection, recycling rules, or how to handle hazardous materials safely." }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Pick a random tip for today
  const [dailyTip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userText = inputText.trim();
    const newMsgId = `msg-${Date.now()}`;
    const userMsg = { id: newMsgId, role: 'user' as const, text: userText };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { id: `msg-${Date.now()}-err`, role: 'assistant', text: "I'm sorry, I couldn't connect to the EcoFix intelligence network right now. Please try again later." }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-err`, role: 'assistant', text: "Network error. Please check your connection." }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Leaf color="#10b981" size={20} />
          <Text style={styles.tipTitle}>Daily Eco Tip</Text>
        </View>
        <Text style={styles.tipText}>{dailyTip}</Text>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#10b981" />
          </View>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about recycling, hazards, etc..."
          placeholderTextColor="#9ca3af"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Send color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  tipCard: {
    margin: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10b98150',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#00000020',
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginLeft: 16,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#10b981',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
