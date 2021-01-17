import { connectActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase';
import React from 'react';
import { TextInput, TouchableOpacity, Text, View } from 'react-native';
import { Avatar } from 'react-native-elements';
import ValidationComponent from 'react-native-form-validator';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';

import Fire from '../Fire';
import PostList from '../components/PostList';
import UserAuth from '../components/UserAuth';
import getPermission from '../utils/getPermission';
import messages from '../utils/messages';
import rules from '../utils/rules';

class ProfileScreen extends ValidationComponent {
  state = {
    loggedin: false,
  };

  fetchUserInfo = async userId => {
    const user = await Fire.shared.fetchUserInfo(userId);
    this.setState({
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      loggedin: true,
      userId,
    });
  };

  componentDidMount = () => {
    var that = this;
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Logged in
        that.fetchUserInfo(user.uid);
      } else {
        // Not logged in
        that.setState({
          loggedin: false,
        });
      }
    });
  };

  saveProfile = async () => {
    // Call ValidationComponent validate method
    this.validate({
      name: { required: true },
      username: { username: true, required: true },
    });

    if (this.isFormValid()) {
      var name = this.state.name;
      var username = this.state.username;
      var avatar = this.state.avatar;

      await this.fetchUserInfo(Fire.shared.uid);
      if (name !== this.state.name) {
        await Fire.shared.updateUserName(this.state.userId, name);
      }
      if (username !== this.state.username) {
        const taken = await Fire.shared.checkUsernameIsTaken(username);
        if (!taken) {
          await Fire.shared.updateUserUsername(this.state.userId, username);
        } else {
          alert('This username cannot be used. Please try a different username.');
        }
      }
      if (avatar !== this.state.avatar) {
        await Fire.shared.updateUserAvatar({ userId: this.state.userId, avatar });
      }
      this.fetchUserInfo(Fire.shared.uid);
      this.setState({ editingProfile: false });
    }
  };

  logoutUser = () => {
    firebase.auth().signOut();
    alert('You have logged out.');
  };

  editProfile = () => {
    this.setState({ editingProfile: true });
  };

  editAvatar = () => {
    const options = ['Take Photo', 'Select Photo', 'Cancel'];
    const cancelButtonIndex = 2;

    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async buttonIndex => {
        switch (buttonIndex) {
          case 0: {
            const status = await getPermission(Permissions.CAMERA);
            if (status) {
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
              });
              if (!result.cancelled) {
                this.setState({ avatar: result.uri });
              }
            }
            break;
          }
          case 1: {
            const status = await getPermission(Permissions.CAMERA_ROLL);
            if (status) {
              const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
              });
              if (!result.cancelled) {
                this.setState({ avatar: result.uri });
              }
            }
            break;
          }
          default:
            break;
        }
      }
    );
  };

  render() {
    return (
      <View style={{ flex: 1, paddingTop: getStatusBarHeight(true) }}>
        {this.state.loggedin === true ? (
          // Logged in
          <View style={{ flex: 1 }}>
            <View
              style={{
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flexDirection: 'row',
                paddingVertical: 10,
              }}>
              <Avatar
                size={100}
                rounded
                source={
                  this.state.avatar !== ''
                    ? { uri: this.state.avatar }
                    : require('../assets/icons/face.png')
                }
                containerStyle={{ marginLeft: 10 }}
                showEditButton={this.state.editingProfile}
                editButton={{ onPress: () => this.editAvatar() }}
              />
              <View style={{ marginRight: 10 }}>
                <Text style={{ fontSize: 24, marginVertical: 2 }}>{this.state.name}</Text>
                <Text style={{ color: 'gray', fontSize: 18, marginVertical: 2 }}>
                  @{this.state.username}
                </Text>
              </View>
            </View>
            {this.state.editingProfile === true ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingBottom: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#C8C7CC',
                }}>
                <Text>Name:</Text>
                <TextInput
                  ref="name"
                  editable
                  placeholder="Enter name"
                  onChangeText={text => this.setState({ name: text })}
                  value={this.state.name}
                  style={{
                    width: 250,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderColor: '#CCCCCC',
                    borderWidth: 1,
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('name') &&
                  this.getErrorsInField('name').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <Text>Username:</Text>
                <TextInput
                  ref="username"
                  editable
                  placeholder="Enter username"
                  autoCapitalize="none"
                  onChangeText={text => this.setState({ username: text.toLowerCase() })}
                  value={this.state.username}
                  style={{
                    width: 250,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderColor: '#CCCCCC',
                    borderWidth: 1,
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('username') &&
                  this.getErrorsInField('username').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007AFF',
                    padding: 10,
                    borderRadius: 5,
                    marginVertical: 8,
                  }}
                  onPress={() => this.saveProfile()}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginVertical: 8 }}
                  onPress={() => {
                    this.fetchUserInfo(Fire.shared.uid);
                    this.setState({ editingProfile: false });
                  }}>
                  <Text style={{ fontWeight: 'bold' }}>Cancel Editing</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{ paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#C8C7CC' }}>
                <TouchableOpacity
                  onPress={() => this.logoutUser()}
                  style={{
                    marginTop: 10,
                    marginHorizontal: 40,
                    paddingVertical: 15,
                    borderRadius: 13,
                    borderColor: '#007AFF',
                    borderWidth: 1,
                  }}>
                  <Text style={{ textAlign: 'center', color: '#007AFF' }}>Log Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.editProfile()}
                  style={{
                    marginTop: 10,
                    marginHorizontal: 40,
                    paddingVertical: 15,
                    borderRadius: 13,
                    borderColor: '#007AFF',
                    borderWidth: 1,
                  }}>
                  <Text style={{ textAlign: 'center', color: '#007AFF' }}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.props.navigation.navigate('Feed', { openFloatingBtn: true })}
                  style={{
                    backgroundColor: '#007AFF',
                    marginTop: 10,
                    marginHorizontal: 40,
                    paddingVertical: 35,
                    borderRadius: 13,
                    borderColor: '#007AFF',
                    borderWidth: 1,
                  }}>
                  <Text style={{ textAlign: 'center', color: 'white' }}>Upload New +</Text>
                </TouchableOpacity>
              </View>
            )}

            <PostList isUser userId={this.state.userId} navigation={this.props.navigation} />
          </View>
        ) : (
          // Not logged in
          <UserAuth
            message="Please log in to continue"
            rules={rules}
            messages={messages}
            deviceLocale="en"
          />
        )}
      </View>
    );
  }
}

export default connectActionSheet(ProfileScreen);
