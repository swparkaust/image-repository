import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { getBottomSpace } from 'react-native-iphone-x-helper';

import store from '../stores/store';

const padding = 16;

@observer
export default class StoryFooter extends React.Component {
  render() {
    const { onPressShowMore, postId } = this.props;
    return (
      <View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onPressShowMore}>
            <Icon name="ios-more" />
          </TouchableOpacity>
        </View>
      </View>
    );  
  }
}

const Icon = ({ name }) => (
  <Ionicons style={{ marginRight: 8 }} name={name} size={26} color="white" />
);

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getBottomSpace(),
    padding,
  },
});
