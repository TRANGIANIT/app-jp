import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export const saveImageToGallery = async (localUri) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Quyền truy cập",
        "Chúng tôi cần quyền truy cập ảnh của bạn để tiến hành lưu Flashcard!"
      );
      return false;
    }

    const asset = await MediaLibrary.createAssetAsync(localUri);
    const album = await MediaLibrary.getAlbumAsync('Antigravity');
    
    if (album == null) {
      await MediaLibrary.createAlbumAsync('Antigravity', asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    Alert.alert('Thành công', 'Đã lưu ảnh Flashcard về Gallery của điện thoại.');
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu ảnh:", error);
    Alert.alert('Lỗi', 'Không thể lưu ảnh lúc này.');
    return false;
  }
};
