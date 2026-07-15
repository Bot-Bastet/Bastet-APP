import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Send, Bot, User, Radio, WifiOff } from 'lucide-react-native';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { messages, sendMessage, connected } = useWebSocket();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = (text: string = inputText) => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setInputText('');
    Keyboard.dismiss();
  };

  const handleVoiceMock = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSend("Mettre tous les robots en patrouille");
    }, 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.isAi ? styles.messageAi : styles.messageUser]}>
      <View style={styles.messageHeader}>
        {item.isAi ? <Bot color={theme.colors.primary} size={16} /> : <User color={theme.colors.secondary} size={16} />}
        <Text style={[styles.messageSender, { color: item.isAi ? theme.colors.primary : theme.colors.secondary }]}>
          {item.isAi ? 'IA TACTIQUE' : 'CONDUCTEUR'}
        </Text>
      </View>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>C O M M L I N K</Text>
          {!connected && <WifiOff color={theme.colors.danger} size={20} style={{ marginLeft: 8 }} />}
        </View>
        {isListening && <Radio color={theme.colors.danger} size={24} />}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        <View style={styles.inputArea}>
          <TouchableOpacity 
            style={[styles.micButton, isListening && styles.micButtonActive]} 
            onPress={handleVoiceMock}
          >
            <Mic color={isListening ? theme.colors.background : theme.colors.text} size={24} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Entrez une commande tactique..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <Send color={inputText.trim() ? theme.colors.primary : theme.colors.textMuted} size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
    padding: theme.spacing.l,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
  },
  messageAi: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(213, 0, 28, 0.05)',
    borderColor: 'rgba(213, 0, 28, 0.2)',
    borderBottomLeftRadius: 0,
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderBottomRightRadius: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  messageSender: {
    ...theme.typography.small,
    marginLeft: 8,
    fontWeight: '700',
  },
  messageText: {
    ...theme.typography.body,
    lineHeight: 22,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: 90, // Avoid bottom tab bar
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.s,
    paddingHorizontal: theme.spacing.m,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.s,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  micButtonActive: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  sendButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
