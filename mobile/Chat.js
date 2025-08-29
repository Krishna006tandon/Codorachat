import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
} from 'react-native';
import io from 'socket.io-client';

// Connect to the server. Ensure your emulator/device can access this address.
// For Android Emulator, 'localhost' is mapped to '10.0.2.2'.
const socket = io('http://10.0.2.2:3000');

const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('typing', (typerUsername) => {
      if (typerUsername !== username) {
        setTypingUsers((prevTypingUsers) => {
          if (!prevTypingUsers.includes(typerUsername)) {
            return [...prevTypingUsers, typerUsername];
          }
          return prevTypingUsers;
        });
      }
    });

    socket.on('stop typing', (typerUsername) => {
      setTypingUsers((prevTypingUsers) =>
        prevTypingUsers.filter((user) => user !== typerUsername)
      );
    });

    return () => {
      socket.off('chat message');
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [username]);

  const sendMessage = () => {
    if (input) {
      socket.emit('chat message', { username: username, text: input });
      setInput('');
      // Immediately stop typing after sending a message
      if (isTyping) {
        socket.emit('stop typing', username);
        setIsTyping(false);
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
      }
    }
  };

  const handleTyping = (text) => {
    setInput(text);
    if (!isTyping) {
      socket.emit('typing', username);
      setIsTyping(true);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop typing', username);
      setIsTyping(false);
    }, 1000); // 1 second debounce
  };

  const renderItem = ({ item }) => {
    const isMyMessage = item.username === username;
    return (
      <View
        style={[
          styles.message,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMyMessage && <Text style={styles.username}>{item.username}</Text>}
        <Text>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Codorachat Mobile</Text>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.messageList}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
      {typingUsers.length > 0 && (
        <View style={styles.typingIndicatorContainer}>
          <Text style={styles.typingIndicatorText}>
            {typingUsers.join(', ')} is typing...
          </Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleTyping}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'white',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  username: {
    fontWeight: 'bold',
    paddingBottom: 4,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  typingIndicatorContainer: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  typingIndicatorText: {
    fontStyle: 'italic',
    color: '#888',
  },
});

export default Chat;
