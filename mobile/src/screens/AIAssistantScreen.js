import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../utils/api';

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const flatListRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        content: userMsg.content,
        sessionId,
        context: 'general'
      });

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.assistantMessage?.content || 'Sorry, please try again.',
        disclaimer: data.assistantMessage?.disclaimer
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I could not process that. Please try again.'
      }]);
    }
    setLoading(false);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.msgRow, item.role === 'user' ? styles.msgUser : styles.msgAi]}>
      <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={[styles.msgText, item.role === 'user' && { color: '#fff' }]}>{item.content}</Text>
        {item.disclaimer && <Text style={styles.disclaimer}>{item.disclaimer}</Text>}
      </View>
    </View>
  );

  const SUGGESTIONS = ['What causes headaches?', 'Side effects of paracetamol', 'Diet for diabetes', 'When to see a doctor for cough'];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Text style={styles.title}>AI Health Assistant</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatArea}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={styles.emptyTitle}>How can I help?</Text>
            <Text style={styles.emptyDesc}>Ask health questions, medication info, or symptom guidance</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} onPress={() => setInput(s)} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {loading && (
        <View style={styles.typing}>
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your question..."
          editable={!loading}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={loading || !input.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', padding: 16, paddingBottom: 8 },
  chatArea: { padding: 16, flexGrow: 1 },
  msgRow: { marginBottom: 12 },
  msgUser: { alignItems: 'flex-end' },
  msgAi: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  msgText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  disclaimer: { fontSize: 10, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' },
  typing: { paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: '#6366f1', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  emptyDesc: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  suggestions: { marginTop: 24, gap: 8, width: '100%', paddingHorizontal: 20 },
  suggestion: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  suggestionText: { fontSize: 13, color: '#475569' },
});
