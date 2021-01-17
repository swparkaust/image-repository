import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react';
import moment from 'moment';
import React, { Fragment } from 'react';
import {
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Avatar } from 'react-native-elements';
import { createImageProgress } from 'react-native-image-progress';
import { getBottomSpace, getStatusBarHeight } from 'react-native-iphone-x-helper';
import CircleSnail from 'react-native-progress/CircleSnail';

import Fire from '../Fire';
import store from '../stores/store';
import getFileExtension from '../utils/getFileExtension';
import StoryFooter from './StoryFooter';

const circleSnailProps = { thickness: 1, color: '#ddd', size: 80 };
const { width, height } = Dimensions.get('window');

const padding = 16;

@observer
class Story extends React.Component {
  showMore = () => {
    store.pause();

    const commonOptions = [
      // 'Report',
      'Cancel',
    ];
    const userOptions = ['Delete', 'Cancel'];

    const options = this.props.story.userId === Fire.shared.uid ? userOptions : commonOptions;
    const destructiveButtonIndex = this.props.story.userId === Fire.shared.uid ? 0 : undefined; //0;
    const cancelButtonIndex = this.props.story.userId === Fire.shared.uid ? 1 : 0; //1;

    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      buttonIndex => {
        switch (buttonIndex) {
          case 0:
            if (this.props.story.userId === Fire.shared.uid) {
              Alert.alert(
                'Are you sure you want to delete this post?',
                '',
                [
                  {
                    text: 'Cancel',
                    onPress: () => store.play(),
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    onPress: () => {
                      store.deleteStory(this.props.story.postId);
                      store.play();
                    },
                  },
                ],
                { cancelable: false }
              );
            } else {
              store.play();
            }
            break;
          case 1:
            store.play();
            break;
          default:
            break;
        }
      }
    );
  };

  render() {
    const { story, currentDeck, callNavigate } = this.props;

    const ImageProgress = createImageProgress(Media);

    return (
      <Fragment>
        <TouchableWithoutFeedback
          onPress={() => {
            store.onNextItem();
          }}
          delayPressIn={200}
          onPressIn={() => {
            store.pause();
            if (this.videoRef) this.videoRef.pauseAsync();
          }}
          onPressOut={() => {
            if (this.videoRef) this.videoRef.playAsync();
          }}>
          <View style={{ flex: 1 }}>
            {currentDeck && store.carouselOpen && (
              <ImageProgress
                source={{ uri: story.items[story.idx].src }}
                {...(story.items[story.idx].type === 'video'
                  ? { videoRef: video => (this.videoRef = video) }
                  : {})}
                style={styles.deck}
                indicator={CircleSnail}
                indicatorProps={circleSnailProps}
                onLoad={this._onLoad}
              />
            )}
            <Header
              image={{ uri: story.avatar }}
              name={story.user}
              description={moment(story.timestamp).fromNow()}
              onPress={() => {
                store.dismissCarousel();
                callNavigate('User', { userId: story.userId });
              }}
            />
            {this.renderIndicators()}
            {this.renderCloseButton()}
            {this.renderBackButton()}
          </View>
        </TouchableWithoutFeedback>
        <StoryFooter
          onPressShowMore={() => this.showMore()}
          postId={story.postId}
        />
      </Fragment>
    );
  }

  renderCloseButton() {
    return (
      <TouchableWithoutFeedback onPress={store.dismissCarousel}>
        <View style={styles.closeButton}>
          <View style={[styles.closeCross, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.closeCross, { transform: [{ rotate: '-45deg' }] }]} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderIndicators() {
    return (
      <View style={styles.indicatorWrap}>
        <LinearGradient
          colors={['rgba(0,0,0,0.33)', 'transparent']}
          locations={[0, 0.95]}
          style={styles.indicatorBg}
        />

        {/* <View style={styles.indicators}>
					{story.items.map((item, i) => (
						<Indicator
							key={i} i={i}
							animate={currentDeck && story.idx == i}
							story={story}
						/>
					))}
				</View> */}
      </View>
    );
  }

  renderBackButton() {
    return (
      <TouchableWithoutFeedback
        onPress={store.onPrevItem}
        onPressIn={() => store.setBackOpacity(1)}
        onLongPress={() => store.setBackOpacity(0)}>
        <LinearGradient
          colors={['rgba(0,0,0,0.33)', 'transparent']}
          locations={[0, 0.85]}
          start={[0, 0]}
          end={[1, 0]}
          style={[
            styles.back,
            {
              opacity: store.backOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>
    );
  }

  _onLoad = () => {
    if (this.props.currentDeck && store.carouselOpen) {
      if (this.videoRef) this.videoRef.playAsync();
    } else {
      if (this.videoRef) this.videoRef.pauseAsync();
    }
  };
}

export default connectActionSheet(Story);

const Header = ({ name, image, description, onPress }) => (
  <View style={[styles.row, styles.padding]}>
    <TouchableOpacity onPress={onPress}>
      <Avatar
        rounded
        source={image.uri !== '' ? image : require('../assets/icons/face.png')}
        containerStyle={{ marginRight: padding }}
      />
    </TouchableOpacity>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.text}>{name}</Text>
    </TouchableOpacity>
    <Text style={styles.subtitle}>{description}</Text>
  </View>
);

const Media = ({ videoRef, ...props }) =>
  ['m4v', 'mp4', 'mov'].indexOf(getFileExtension(props.source.uri)) > -1 ? (
    <Video
      ref={videoRef}
      {...props}
      rate={1.0}
      volume={1.0}
      isMuted={false}
      resizeMode="cover"
      shouldPlay={false}
      isLooping
    />
  ) : (
    <Image {...props} />
  );

const styles = StyleSheet.create({
  deck: {
    width,
    height,
    backgroundColor: 'white',
  },

  progressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  indicatorWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  indicators: {
    height: 30,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: getStatusBarHeight(true),
    flexDirection: 'row',
  },
  indicatorBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },

  back: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 90,
  },

  closeButton: {
    position: 'absolute',
    top: getStatusBarHeight(true),
    right: 0,
    width: 70,
    height: 70,
    zIndex: 1,
  },
  closeCross: {
    position: 'absolute',
    top: 32,
    right: 8,
    width: 20,
    height: 1,
    backgroundColor: '#fff',
  },

  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: padding,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
  },
  row: {
    zIndex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padding: {
    padding,
    paddingTop: padding + getStatusBarHeight(true),
    paddingBottom: padding + getBottomSpace(),
  },
});
