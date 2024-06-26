import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ChatList from '../../components/ChatList';
import axios from 'axios';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/authContext';
import { Entypo } from '@expo/vector-icons';

export default function AddUsersGroup() {
   const [users, setUsers] = useState([]);
   const { user, selectedUsers, setSelectedUsers } = useAuth();
   const router = useRouter();
   const params = useLocalSearchParams();

   useEffect(() => {
      let user = [];
      const fetchUsers = async () => {
         if(params.idConversationAdd){
            user = JSON.parse(params.usersNotGroup);
         }else{
            user = await getUsers();
         }
         setUsers(user);
      }

      fetchUsers();

      setSelectedUsers([]);

   }, [])

   const getUsers = async () => {
      try {
         const response = await axios.get(
            'https://aps-redes-service.onrender.com/user/all',
            {
               headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer Authorization ${user.token}`
               },
            }
         );

         return response.data.message;
      } catch (error) {
         console.log(error);
      }
   }

   return (
      <View className="flex-1" style={{ backgroundColor: '#121212' }}>
         <StatusBar style="dark" />
         <Stack.Screen
            options={{
               title: '',
               headerShadowVisible: false,
               headerStyle: {
                  backgroundColor: '#581c87',
               },
               headerLeft: () => (
                  <View className="flex-row justify-between items-center w-full">
                     <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => router.back()}>
                           <Entypo name="chevron-left" size={hp(4)} color="#e3e3e3" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-3">
                           <Text style={{ fontSize: hp(2.5) }} className="font-medium text-neutral-100">
                              Criar grupo
                           </Text>
                        </View>
                     </View>
                     <View className="flex-row items-center" style={{ marginRight: wp(10) }}>
                        <Text style={{ fontSize: hp(1.5) }} className="font-medium text-neutral-100">Selecionados: {selectedUsers.length}</Text>
                     </View>
                  </View>
               ),
            }}
         />
         { users.length === 0 && (
            <View className="flex-1 items-center justify-center">
               <Text style={{ fontSize: hp(2.5) }} className="font-medium text-neutral-100">Nenhum usuário encontrado. </Text>
            </View>
         )}
         <ChatList users={users} isConversation={false} isGroup={true} idConversationAdd={params.idConversationAdd ? params.idConversationAdd : null} />
      </View>
   );
}