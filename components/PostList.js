import { Viewport } from '@skele/components';
import { Video } from 'expo-av';
import { observer } from 'mobx-react';
import React from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from 'react-native-elements';
import { PhotoGrid } from 'react-native-photo-grid-frame';
import { withNavigationFocus } from 'react-navigation';

import Fire from '../Fire';
import store from '../stores/store';
import getFileExtension from '../utils/getFileExtension';

const Placeholder = () => (
  <View
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'gray',
      borderRadius: 10,
    }}
  />
);
const ViewportAwareImage = Viewport.Aware(Viewport.WithPlaceholder(Image, Placeholder));
const ViewportAwareVideo = Viewport.Aware(Viewport.WithPlaceholder(Video, Placeholder));
const ViewportAwareView = Viewport.Aware(Viewport.WithPlaceholder(View, Placeholder));

const padding = 6;

// Set the default number of posts to load for each pagination.
const PAGE_SIZE = 12;

const PRE_TRIGGER_RATIO = 0.5;

@observer
class PostList extends React.Component {
  state = {
    loading: false,
    posts: [],
    data: {},
  };

  componentDidMount() {
    const { isUser, userId } = this.props;

    if (isUser === true) {
      this.makeRemoteRequest({ userId });
    } else {
      // If we are, then we can get the first 5 posts
      this.makeRemoteRequest({});
    }

    store.addDeleteEventListener(this.removePost);
    store.addDismissCarouselEventListener(this._onRefresh);
  }

  componentWillUnmount() {
    store.removeDeleteEventListener(this.removePost);
    store.removeDismissCarouselEventListener(this._onRefresh);
  }

  // Append the item to our states `data` prop
  addPosts = posts => {
    this.setState(previousState => {
      let data = {
        ...previousState.data,
        ...posts,
      };
      return {
        data,
        // Sort the data by timestamp
        posts: Object.values(data).sort((a, b) => a.timestamp < b.timestamp),
      };
    });
  };

  // Remove the item from our states `data` prop
  removePost = postId => {
    this.setState(previousState => {
      let data = { ...previousState.data };
      delete data[postId];
      return {
        data,
        posts: previousState.posts.filter(function(post) {
          return post !== previousState.data[postId];
        }),
      };
    });
  };

  // Call our database and ask for a subset of the user posts
  makeRemoteRequest = async ({ lastKey, userId = '' }) => {
    // If we are currently getting posts, then bail out..
    if (this.state.loading) {
      return;
    }
    this.setState({ loading: true });

    // The data prop will be an array of posts, the cursor will be used for pagination.
    const { data, cursor } = await Fire.shared.getPaged({
      size: PAGE_SIZE,
      start: lastKey,
      userId,
    });

    this.lastKnownKey = cursor;
    // Iteratively add posts
    let posts = {};
    for (let child of data) {
      posts[child.key] = child;

      const user = await Fire.shared.fetchUserInfo(child.uid);
      posts[child.key].avatar = user.avatar;
    }
    this.addPosts(posts);

    // Finish loading, this will stop the refreshing animation.
    this.setState({ loading: false });
  };

  // Because we want to get the most recent items, don't pass the cursor back.
  // This will make the data base pull the most recent items.
  _onRefresh = () =>
    this.props.isUser
      ? this.makeRemoteRequest({ userId: this.props.userId })
      : this.makeRemoteRequest({});

  // If we press the "Load More..." footer then get the next page of posts
  onPressFooter = () =>
    this.props.isUser
      ? this.makeRemoteRequest({ lastKey: this.lastKnownKey, userId: this.props.userId })
      : this.makeRemoteRequest({ lastKey: this.lastKnownKey });

  onPressItem = index => {
    var data = this.state.posts.map(post => ({
      idx: 0,
      avatar: post.avatar,
      items: [
        {
          src: post.media,
          type: ['m4v', 'mp4', 'mov'].indexOf(getFileExtension(post.media)) > -1 ? 'video' : 'img',
          duration: Math.max(5000, isNaN(post.duration) ? -Infinity : post.duration),
        },
      ],
      postId: post.key,
      timestamp: post.timestamp,
      user: post.user,
      userId: post.uid,
    }));
    store.setStories(data);

    this.photoGrid.refs[`_${index}`].measure((ox, oy, width, height, px, py) => {
      const offset = {
        top: py + height / 2,
        left: px + width / 2,
      };

      store.openCarousel(index, offset);
    });
  };

  render() {
    const { ...props } = this.props;
    return (
      <Viewport.Tracker>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={this.state.loading} onRefresh={this._onRefresh} />
          }
          keyboardShouldPersistTaps="always"
          onScroll={e => {
            let paddingToBottom = 0;
            paddingToBottom += e.nativeEvent.layoutMeasurement.height;
            if (
              e.nativeEvent.contentOffset.y >=
              e.nativeEvent.contentSize.height - paddingToBottom
            ) {
              this.onPressFooter();
            }
          }}>
          <PhotoGrid
            PhotosList={this.state.posts.map(post => ({
              url: post.media,
              avatar: post.avatar,
              postId: post.key,
            }))}
            borderRadius={10}
            onPressItem={this.onPressItem}
            ImageComponent={this.props.isFocused && !store.carouselOpen ? Media : Placeholder}
            ref={photoGrid => {
              this.photoGrid = photoGrid;
            }}
            {...props}>
            {item => (
              <ViewportAwareView
                preTriggerRatio={PRE_TRIGGER_RATIO}
                retainOnceInViewport={false}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}>
                <Header image={{ uri: item.avatar }} />
              </ViewportAwareView>
            )}
          </PhotoGrid>
        </ScrollView>
      </Viewport.Tracker>
    );
  }
}
export default withNavigationFocus(PostList);

const Header = ({ image }) => (
  <View style={[styles.row, styles.padding]}>
    <Avatar rounded source={image.uri !== '' ? image : require('../assets/icons/face.png')} />
  </View>
);

const Media = props =>
  ['m4v', 'mp4', 'mov'].indexOf(getFileExtension(props.source.uri)) > -1 ? (
    <ViewportAwareVideo
      {...props}
      preTriggerRatio={PRE_TRIGGER_RATIO}
      retainOnceInViewport={false}
      rate={1.0}
      volume={1.0}
      isMuted
      resizeMode="cover"
      shouldPlay
      isLooping
    />
  ) : (
    <ViewportAwareImage
      {...props}
      preTriggerRatio={PRE_TRIGGER_RATIO}
      retainOnceInViewport={false}
    />
  );

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padding: {
    padding,
  },
});
