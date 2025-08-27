import avatars from '@/constants/avatars';
import React from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: any) => void;
}

export default function AvatarPickerModal({ visible, onClose, onSelectAvatar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-5 rounded-xl w-[85%]">
          <Text className="text-lg font-semibold text-center mb-4 text-green-800">Choose Your Avatar</Text>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {avatars.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                className="m-2"
                onPress={() => {
                  onSelectAvatar(avatar);
                  onClose();
                }}
              >
                <Image source={avatar} className="w-16 h-16 rounded-full" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
