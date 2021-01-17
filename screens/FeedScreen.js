import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase';
import React, { Component } from 'react';
import { LayoutAnimation, StatusBar, StyleSheet, View } from 'react-native';
import { FloatingAction } from 'react-native-floating-action';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { NavigationEvents } from 'react-navigation';

import PostList from '../components/PostList';
import getPermission from '../utils/getPermission';

console.disableYellowBox = true;
export default class FeedScreen extends Component {
  state = {
    loggedin: false,
  };

  componentDidMount = () => {
    var that = this;
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Logged in
        that.setState({
          loggedin: true,
        });
      } else {
        // Not logged in
        that.setState({
          loggedin: false,
        });
      }
    });

    StatusBar.setHidden(false);
  };

  _selectPhoto = async () => {
    const status = await getPermission(Permissions.CAMERA_ROLL);
    if (status) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        this.props.navigation.navigate('NewPost', {
          media: result.uri,
          type: result.type,
          duration: result.duration,
        });
      }
    }
  };

  _takePhoto = async () => {
    const status = await getPermission(Permissions.CAMERA);
    if (status) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        this.props.navigation.navigate('NewPost', {
          media: result.uri,
          type: result.type,
          duration: result.duration,
        });
      }
    }
  };

  _selectVideo = async () => {
    const status = await getPermission(Permissions.CAMERA_ROLL);
    if (status) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        this.props.navigation.navigate('NewPost', {
          media: result.uri,
          type: result.type,
          duration: result.duration,
        });
      }
    }
  };

  _takeVideo = async () => {
    const status = await getPermission(Permissions.CAMERA);
    if (status) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        this.props.navigation.navigate('NewPost', {
          media: result.uri,
          type: result.type,
          duration: result.duration,
        });
      }
    }
  };

  handleFloatingBtnAction = btnName => {
    if (this.state.loggedin === true) {
      switch (btnName) {
        case 'bt_photo_library':
          this._selectPhoto();
          break;
        case 'bt_camera':
          this._takePhoto();
          break;
        case 'bt_video_library':
          this._selectVideo();
          break;
        case 'bt_videocam':
          this._takeVideo();
          break;
      }
    } else {
      this.props.navigation.navigate('Profile');
    }
  };

  didFocusAction = payload => {
    let params = payload.state.params || {};
    let openFloatingBtn = params.openFloatingBtn;
    if (openFloatingBtn) {
      this.floatingAction.animateButton();
      this.props.navigation.setParams({ openFloatingBtn: null });
    }
  };

  willBlurAction = payload => {
    this.floatingAction.reset();
  };

  render() {
    const actions = [
      {
        color: '#007AFF',
        icon: <MaterialIcons name="photo-library" size={24} color="white" />,
        name: 'bt_photo_library',
        position: 1,
      },
      {
        color: '#007AFF',
        icon: <MaterialIcons name="camera-alt" size={24} color="white" />,
        name: 'bt_camera',
        position: 2,
      },
      {
        color: 'red',
        icon: <MaterialIcons name="video-library" size={24} color="white" />,
        name: 'bt_video_library',
        position: 3,
      },
      {
        color: 'red',
        icon: <MaterialIcons name="videocam" size={24} color="white" />,
        name: 'bt_videocam',
        position: 4,
      },
    ];

    // Let's make everything purrty by calling this method which animates layout changes.
    LayoutAnimation.easeInEaseOut();
    return (
      <View style={styles.container}>
        <NavigationEvents onDidFocus={this.didFocusAction} onWillBlur={this.willBlurAction} />
        <PostList isUser={false} navigation={this.props.navigation} />
        <FloatingAction
          ref={ref => {
            this.floatingAction = ref;
          }}
          actions={actions}
          color="#007AFF"
          onPressItem={this.handleFloatingBtnAction}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getStatusBarHeight(true),
  },
});
