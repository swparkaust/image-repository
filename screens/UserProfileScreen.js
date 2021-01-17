import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { Avatar } from 'react-native-elements';

import Fire from '../Fire';
import PostList from '../components/PostList';

export default class ProfileScreen extends Component {
  state = {
    loaded: false,
  };

  checkParams = () => {
    //
    var params = this.props.navigation.state.params;
    if (params) {
      if (params.userId) {
        this.setState({
          userId: params.userId,
        });
        this.fetchUserInfo(params.userId);
      }
    }
  };

  fetchUserInfo = async userId => {
    //
    const user = await Fire.shared.fetchUserInfo(userId);
    this.setState({ username: user.username, name: user.name, avatar: user.avatar, loaded: true });
  };

  componentDidMount = () => {
    this.checkParams();
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        {this.state.loaded === false ? (
          <View>
            <Text>Loading...</Text>
          </View>
        ) : (
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
              />
              <View style={{ marginRight: 10 }}>
                <Text style={{ fontSize: 24, marginVertical: 2 }}>{this.state.name}</Text>
                <Text style={{ color: 'gray', fontSize: 18, marginVertical: 2 }}>
                  @{this.state.username}
                </Text>
              </View>
            </View>

            <PostList isUser userId={this.state.userId} navigation={this.props.navigation} />
          </View>
        )}
      </View>
    );
  }
}
