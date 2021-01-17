import firebase from 'firebase';
import React from 'react';
import {
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ValidationComponent from 'react-native-form-validator';

import Fire from '../Fire';

export default class UserAuth extends ValidationComponent {
  state = {
    authStep: 0,
    email: '',
    pass: '',
    username: '',
    moveScreen: false,
  };

  login = async () => {
    // Call ValidationComponent validate method
    this.validate({
      email: { email: true, required: true },
      pass: { required: true },
    });

    if (this.isFormValid()) {
      var email = this.state.email;
      var pass = this.state.pass;
      try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);

        Fire.shared.registerForPushNotificationsAsync();
      } catch (error) {
        alert(error);
      }
    }
  };

  createUserObj = async (userObj, email, username) => {
    //

    await Fire.shared.createUser(userObj.uid, email, username);

    Fire.shared.registerForPushNotificationsAsync();
  };

  signup = async () => {
    // Call ValidationComponent validate method
    this.validate({
      email: { email: true, required: true },
      pass: { required: true },
      username: { username: true, required: true },
    });

    if (this.isFormValid()) {
      var email = this.state.email;
      var pass = this.state.pass;
      var username = this.state.username;
      try {
        const taken = await Fire.shared.checkUsernameIsTaken(username);
        if (!taken) {
          await firebase
            .auth()
            .createUserWithEmailAndPassword(email, pass)
            .then(userObj => this.createUserObj(userObj.user, email, username))
            .catch(error => alert(error));
        } else {
          alert('This username cannot be used. Please try a different username.');
        }
      } catch (error) {
        alert(error);
      }
    }
  };

  componentDidMount = () => {
    if (this.props.moveScreen === true) {
      this.setState({ moveScreen: true });
    }
  };

  showLogin = () => {
    if (this.state.moveScreen === true) {
      this.props.navigation.navigate('Profile');
      return false;
    }
    this.setState({ authStep: 1 });
  };

  showSignup = () => {
    if (this.state.moveScreen === true) {
      this.props.navigation.navigate('Profile');
      return false;
    }
    this.setState({ authStep: 2 });
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <Text style={{ color: 'gray', fontSize: 24, marginVertical: 8 }}>You are not logged in</Text>
        <Text style={{ color: 'gray', fontSize: 18, marginVertical: 8 }}>{this.props.message}</Text>
        {this.state.authStep === 0 ? (
          <View
            style={{
              marginVertical: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 5 }}
              onPress={() => this.showLogin()}>
              <Text style={{ fontWeight: 'bold', color: 'white' }}>Login</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10, color: 'gray' }}>or</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5 }}
              onPress={() => this.showSignup()}>
              <Text style={{ fontWeight: 'bold', color: 'white' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginVertical: 20 }}>
            {this.state.authStep === 1 ? (
              // Login
              <View>
                <TouchableOpacity
                  onPress={() => this.setState({ authStep: 0 })}
                  style={{ paddingVertical: 5 }}>
                  <Text style={{ fontWeight: 'bold' }}>‹ Back</Text>
                </TouchableOpacity>
                <View
                  style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    marginBottom: 10,
                  }}
                />
                <Text style={{ fontWeight: 'bold', marginBottom: 20 }}>Login</Text>
                <TextInput
                  ref="email"
                  editable
                  keyboardType="email-address"
                  placeholder="Email Address"
                  autoCapitalize="none"
                  onChangeText={text => this.setState({ email: text })}
                  value={this.state.email}
                  style={{
                    width: 280,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: '#CCCCCC',
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('email') &&
                  this.getErrorsInField('email').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <TextInput
                  ref="pass"
                  editable
                  secureTextEntry
                  placeholder="Password"
                  onChangeText={text => this.setState({ pass: text })}
                  value={this.state.pass}
                  style={{
                    width: 280,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: '#CCCCCC',
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('pass') &&
                  this.getErrorsInField('pass').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#34C759',
                    marginVertical: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 13,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => this.login()}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Sign Up
              <View>
                <TouchableOpacity
                  onPress={() => this.setState({ authStep: 0 })}
                  style={{ paddingVertical: 5 }}>
                  <Text style={{ fontWeight: 'bold' }}>‹ Back</Text>
                </TouchableOpacity>
                <View
                  style={{
                    borderBottomColor: 'black',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    marginBottom: 10,
                  }}
                />
                <Text style={{ fontWeight: 'bold', marginBottom: 20 }}>Sign Up</Text>
                <TextInput
                  ref="email"
                  editable
                  keyboardType="email-address"
                  placeholder="Email Address"
                  autoCapitalize="none"
                  onChangeText={text => this.setState({ email: text })}
                  value={this.state.email}
                  style={{
                    width: 280,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: '#CCCCCC',
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('email') &&
                  this.getErrorsInField('email').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <TextInput
                  ref="pass"
                  editable
                  secureTextEntry
                  placeholder="Password"
                  onChangeText={text => this.setState({ pass: text })}
                  value={this.state.pass}
                  style={{
                    width: 280,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: '#CCCCCC',
                    borderRadius: 5,
                  }}
                />
                {this.isFieldInError('pass') &&
                  this.getErrorsInField('pass').map(errorMessage => (
                    <Text style={{ color: 'red' }}>{errorMessage}</Text>
                  ))}
                <TextInput
                  ref="username"
                  editable
                  placeholder="Username"
                  autoCapitalize="none"
                  onChangeText={text => this.setState({ username: text.toLowerCase() })}
                  value={this.state.username}
                  style={{
                    width: 280,
                    height: 44,
                    marginVertical: 8,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: '#CCCCCC',
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
                    marginVertical: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 13,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => this.signup()}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
