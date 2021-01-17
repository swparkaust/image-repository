import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import React from 'react';
import { Image, TextInput, View } from 'react-native';
import HeaderButtons from 'react-navigation-header-buttons';

import Fire from '../Fire';
import getFileExtension from '../utils/getFileExtension';

export default class NewPostScreen extends React.Component<Props> {
  static navigationOptions = ({ navigation }) => ({
    title: 'New Post',
    headerBackTitleVisible: false,
    headerRight: () => (
      <HeaderButtons IconComponent={Ionicons} iconSize={23} color="#007AFF">
        <HeaderButtons.Item
          title="Share"
          onPress={() => {
            const text = navigation.getParam('text');
            const media = navigation.getParam('media');
            const type = navigation.getParam('type');
            const duration = navigation.getParam('duration');
            if (media && type) {
              navigation.goBack();
              Fire.shared.post({ text: text && text.trim(), media, type, duration });
            }
          }}
        />
      </HeaderButtons>
    ),
  });

  state = { text: '' };

  render() {
    const { media } = this.props.navigation.state.params;
    return (
      <View style={{ padding: 10, flexDirection: 'row' }}>
        <Media
          source={{ uri: media }}
          style={{ resizeMode: 'contain', aspectRatio: 1, width: 72 }}
        />
        <TextInput
          multiline
          style={{ flex: 1, paddingHorizontal: 16 }}
          placeholder="Add message..."
          onChangeText={text => {
            this.setState({ text });
            this.props.navigation.setParams({ text });
          }}
        />
      </View>
    );
  }
}

const Media = props =>
  ['m4v', 'mp4', 'mov'].indexOf(getFileExtension(props.source.uri)) > -1 ? (
    <Video {...props} rate={1.0} volume={1.0} isMuted resizeMode="cover" shouldPlay isLooping />
  ) : (
    <Image {...props} />
  );
