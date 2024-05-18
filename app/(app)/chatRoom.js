import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ChatRoomHeader from '../../components/ChatRoomHeader';
import { useRouter, useLocalSearchParams } from "expo-router";
import MessageList from '../../components/MessageList';
import { AntDesign, Feather } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import CustomKeyboardView from '../../components/CustomKeyboardView';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Audio } from 'expo-av';

export default function ChatRoom() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [imageCompleted, setImageCompleted] = useState(null);
  const [messageAtual, setMessageAtual] = useState('');
  const { user, getMessages, messages, setMessages } = useAuth();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const socket = io('http://192.168.15.8:3000');
  const [recording, setRecording] = useState();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [audioUri, setAudioUri] = useState(null);

  useEffect(() => {
    // Desconecte o socket quando o componente for desmontado
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMessages = async () => {
    await getMessages(user, params);
  }

  useEffect(() => {
    fetchMessages();

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow', updateScrollView
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    updateScrollView();
  }, [messages]);

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 10);
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageCompleted(result.assets[0]);
    }
  };

  async function sendMessage() {
    if (messageAtual) {
      try {
        let uri = null;
        if (imageCompleted) {
          uri = imageCompleted.uri;

          // Comprimir a imagem antes de enviá-la
          const compressedImage = await ImageManipulator.manipulateAsync(
            uri,
            [],
            { compress: 0.7, format: 'jpeg' } // Comprimir a imagem com qualidade de 70%
          );
          uri = compressedImage.uri;
        }

        const formData = new FormData();
        formData.append('message', messageAtual);
        if (uri) {
          formData.append('image', {
            uri: uri,
            name: 'image.jpg',
            type: 'image/jpeg',
          });
        }

        const response = await axios.post(
          `http://192.168.15.8:8080/chat/create/${params.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer Authorization ${user.token}`
            }
          }
        );

        // Notifique o servidor sobre a nova mensagem enviada
        socket.emit('message', { message: messageAtual });

        setMessageAtual('');
        setImage(null);
        setImageCompleted(null);

        let novaMessage = {
          message: response.data.message.message,
          id: response.data.message.id,
          conversationId: response.data.message.conversationId.id,
          conversationCreatedAt: response.data.message.conversationId.createdAt,
          recipientId: response.data.message.recipientId.id,
          imageName: response.data.message.imageName,
          createdAt: response.data.message.createdAt,
          senderId: response.data.message.senderId.id,
        }

        // Atualize a lista de mensagens
        setMessages([...messages, novaMessage]);
      } catch (error) {
        console.log(error.response);
        // Trate os erros de forma apropriada, se necessário
      }
    }
  }

  // Quando uma nova mensagem é recebida do servidor, atualize a interface do usuário
  socket.on('message', (data) => {
    fetchMessages();
  });

  async function startRecording() {
    try {
      if (permissionResponse.status !== 'granted') {
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = recording.getURI();
    setAudioUri(uri);
  }

  async function excluseRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );

    setAudioUri(null);
  }

  async function playSound() {
    if (audioUri) {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      await sound.playAsync();
    } else {
      console.log('Nenhum áudio gravado para reproduzir.');
    }
  }

  return (
    <CustomKeyboardView inChat={true}>
      <View className="flex-1">
        <StatusBar style="dark" />
        <ChatRoomHeader router={router} user={{ user: params }} />
        <View className="h-3 border-b border-neutral-800" />
        <View className="flex-1 justify-between bg-neutral-100 overflow-visible" style={{ backgroundColor: "#121212" }}>
          <View className="flex-1">
            <MessageList scrollViewRef={scrollViewRef} messages={messages} currentUser={{ userId: user.id }} />
          </View>
          {image && (
            <View className="flex-row items-center justify-cente p-2 mx-3" style={{ width: wp(30), height: hp(10) }}>
              <Image
                source={{ uri: image }}
                style={{ width: '100%', height: '100%' }}
                className="rounded-lg"
              />
              <TouchableOpacity onPress={() => setImage(null)} className="absolute top-0 right-0 rounded-full">
                <AntDesign name="closecircle" size={24} color="#581c87" />
              </TouchableOpacity>
            </View>
          )}

          {
            audioUri && (
              <View className="flex-row items-center justify-cente p-2 mx-3" style={{ width: wp(30), height: hp(10) }}>
                <TouchableOpacity onPress={playSound} className="bg-neutral-100 p-2 mr-[1px] rounded-full">
                  <Feather name="play" size={hp(2.7)} color="black" />
                </TouchableOpacity>
              </View>
            )
          }
          <View style={{ marginBottom: hp(2.7) }} className="pt-2">
            <View style={{ backgroundColor: "#1e1e1e" }} className="flex-row mx-3 justify-between bg-white border p-2 border-neutral-600 rounded-full pl-5">
              <TextInput
                value={messageAtual}
                onChangeText={setMessageAtual}
                placeholder="Digite uma mensagem..."
                placeholderTextColor="#e3e3e3"
                style={{ fontSize: hp(2), backgroundColor: "tranparent", color: "#e3e3e3" }}
                className="flex-1 mr-2"
              />
              {recording ? (
                <TouchableOpacity onPress={excluseRecording} className="bg-neutral-100 p-2 mr-[4px] rounded-full">
                  <AntDesign name="delete" size={hp(2.7)} color="red" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={pickImage} className="p-2 mr-[4px] rounded-full">
                  <Feather name="camera" size={hp(2.7)} color="white" />
                </TouchableOpacity>
              )}
              {messageAtual ? (
                <TouchableOpacity onPress={sendMessage} className="bg-neutral-100 p-2 mr-[1px] rounded-full">
                  <Feather name="send" size={hp(2.7)} color="black" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={recording ? stopRecording : startRecording} className="bg-neutral-100 p-2 mr-[1px] rounded-full">
                  {recording ? (
                    <Feather name="stop-circle" size={hp(2.7)} color="red" />
                  ) : (
                    <Feather name="mic" size={hp(2.7)} color="black" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}