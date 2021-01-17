import { Component } from 'react';
import { NavigationActions, StackActions } from 'react-navigation';

import checkIfFirstLaunch from '../utils/checkIfFirstLaunch';

export default class InitScreen extends Component {
  async componentWillMount() {
    const mainPage = 'Main';
    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: mainPage })],
    });
    this.props.navigation.dispatch(resetAction);
  }

  render() {
    return null;
  }
}
