import React from 'react';
import { StyleSheet, View, Dimensions, Animated } from 'react-native';
import { observer } from 'mobx-react';
import Story from './story';
import store from '../stores/store';

const { width, height } = Dimensions.get('window');


@observer
export default class Stories extends React.Component {
	render() {
		return (
			<View style={styles.container} {...store.panResponder.panHandlers}>
				{store.stories.map((story, idx) => {
					let scale = store.verticalSwipe.interpolate({
						inputRange: [-1, 0, height],
						outputRange: [1, 1, 0.75]
					});
					
					if (store.swipedHorizontally) {
						scale = store.horizontalSwipe.interpolate({
							inputRange: [width*(idx-1), width*idx, width*(idx+1)],
							outputRange: [0.79, 1, 0.78]
						});
					}

					return (
						<Animated.View
							key={idx}
							style={[styles.deck, {
								transform: [
									{
										translateX: store.horizontalSwipe.interpolate({
											inputRange: [width*(idx-1), width*idx, width*(idx+1)],
											outputRange: [width, 0, -width]
										})
									},
									{
										translateY: store.verticalSwipe.interpolate({
											inputRange: [-1, 0, height],
											outputRange: [0, 0, height/2]
										})
									},
									{ scale }
								]
							}]
						}>
							<Story story={story} currentDeck={store.deckIdx == idx} callNavigate={this.props.callNavigate} />
						</Animated.View>
					);
				})}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(255,255,255,0.9)',
	},
	deck: {
		position: 'absolute',
		width, height,
		top: 0, left: 0,
	},
});
