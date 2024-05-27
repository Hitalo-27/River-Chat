import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from '../context/authContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChatItem({ item, router, noBorder, isConversation, isGroup, isSelected, onSelect}) {
  const { user } = useAuth();

  const [imageUri, setImageUri] = useState(`https://drive.google.com/uc?id=${item ? item.recipientImageName ? JSON.parse(item.recipientImageName).id : item.imageName ? JSON.parse(item.imageName).id : '' : ''}`);
  const fallbackImageUri = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  
  const handleImageError = () => {
    setImageUri(fallbackImageUri);
  };

  var id = item.id;
  var name = item.name ? item.name : item.groupName;
  var imageName = item.recipientImageName;
  var groupConversation = item.groupName ? true : false;

  if (!id && !name) {
    if (!user) return;
    if (user.id === item.senderId) {
      id = item.userIdByRecipientId;
      name = item.recipientName;
    } else {
      id = item.senderId;
      name = item.senderName;
    }
  }

  const openChatRoom = () => {
    router.push({
      pathname: 'chatRoom',
      params: {
        id: id,
        name: name,
        email: item.email,
        imageName: imageName,
        idConversation: item.conversationId ? item.conversationId : null,
        idLastMessage: item.chatId,
        visualizeLastMessage: item.visualize,
        senderIdLastMessage: item.senderId,
        groupConversation: groupConversation,
        groupDescription: item.groupDescription,
      }
    });
  }

  const handleSelect = () => {
    onSelect(item);
  }

  return (
    <TouchableOpacity onPress={isGroup ? handleSelect : openChatRoom} className={`flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 ${noBorder ? '' : 'border-b border-neutral-600'} ${isSelected ? 'bg-purple-900 px-2 py-2 rounded-lg' : ''}`}>
      <Image
        source={{ uri: imageUri }}
        style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
        onError={handleImageError}
      />

      <View className="flex-1 gap-1">
        <View className="flex-row justify-between">
          <Text style={{ fontSize: hp(1.8) }} className="font-semibold text-neutral-50">{name ? name : "Usuário"}</Text>
          {isConversation && !item.visualize && item.senderId !== user?.id && item.chatId != 0 ? (
            <View className="flex-row items-center">
              <MaterialIcons name="notifications-on" size={24} color="#e3e3e3" />
            </View>
          ) : null}
        </View>
        <Text style={{ fontSize: hp(1.6) }} className="font-medium text-neutral-300">{item.lastMessage ? item.lastMessage : item.email ? item.email : item.chatId!=0 ? (<MaterialIcons name="perm-media" size={20} color="#d4d4d4" /> ) : "Sem Conversa"}</Text>
      </View>

    </TouchableOpacity>
  );
}