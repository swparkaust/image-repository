import { observable, action, computed } from 'mobx';
import {
  LayoutAnimation,
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  StatusBar,
} from 'react-native';

import Fire from '../Fire';

const { width, height } = Dimensions.get('window');
const VERTICAL_THRESHOLD = 80;
const HORIZONTAL_THRESHOLD = 60;

class Store {
  @observable carouselOpen = false;
  @observable offset = { top: height / 2, left: width / 2 };

  @observable stories = [];
  @observable deckIdx = 0;
  @observable paused = false;
  @observable backOpacity = 0;
  @observable deleteEventListeners = [];
  @observable dismissCarouselEventListeners = [];

  @observable indicatorAnim = new Animated.Value(0);
  @observable horizontalSwipe = new Animated.Value(0);
  @observable verticalSwipe = new Animated.Value(0);

  @observable swipedHorizontally = true;
  @observable panResponder = null;

  constructor() {
    this.initPanResponder();
  }

  @action initPanResponder() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (evt, { dx, dy }) => {
        if (Math.abs(dx) > 5) {
          this.swipedHorizontally = true;
          return true;
        }

        if (dy > 5) {
          this.swipedHorizontally = false;
          return true;
        }

        return false;
      },

      onPanResponderGrant: () => {
        if (this.swipedHorizontally) {
          this.horizontalSwipe.setOffset(this.horizontalSwipe._value);
          this.horizontalSwipe.setValue(0);
        }

        this.pause();
        this.setBackOpacity(0);
      },

      onPanResponderMove: (_e, { dx, dy }) => {
        if (this.swipedHorizontally) {
          this.horizontalSwipe.setValue(-dx);
        } else {
          this.verticalSwipe.setValue(dy);
        }
      },

      onPanResponderRelease: (_e, { dx, dy }) => {
        if (!this.swipedHorizontally) {
          if (dy > VERTICAL_THRESHOLD) return this.leaveStories();
          this.play();
          return this.resetVerticalSwipe();
        }

        this.horizontalSwipe.flattenOffset();
        const deckIdx = this.deckIdx;

        if (dx > HORIZONTAL_THRESHOLD) {
          // previous deck
          if (deckIdx === 0) return this.leaveStories();

          return this.animateDeck(width * (deckIdx - 1), true);
        }

        if (dx < -HORIZONTAL_THRESHOLD) {
          // -> next deck
          if (deckIdx === this.stories.length - 1) return this.leaveStories();

          return this.animateDeck(width * (deckIdx + 1), true);
        }

        this.play();
        return this.animateDeck(width * deckIdx);
      },
    });
  }

  ///////////////////////////////////
  // Toggle Carousel
  ///////////////////////////////////

  @action openCarousel = (idx, offset) => {
    this.offset = offset;
    this.setDeckIdx(idx);
    this.horizontalSwipe.setValue(idx * width);

    requestAnimationFrame(() => {
      LayoutAnimation.easeInEaseOut();
      this.carouselOpen = true;
      this.animateIndicator();
    });

    StatusBar.setBarStyle('light-content', true);
  };

  @action dismissCarousel = () => {
    LayoutAnimation.easeInEaseOut();
    this.carouselOpen = false;
    StatusBar.setBarStyle('default', true);
    Keyboard.dismiss();
    this.dismissCarouselEventListeners.forEach(listener => {
      if (typeof listener == 'function') {
        listener();
      }
    });
  };

  @action leaveStories() {
    if (this.swipedHorizontally) {
      this.animateDeck(width * this.deckIdx);
    } else {
      this.resetVerticalSwipe();
    }

    this.dismissCarousel();
  }

  ///////////////////////////////////
  // Setter Methods
  ///////////////////////////////////

  @action setStories = stories => {
    this.stories = stories;
  };

  @action setPaused = paused => {
    this.paused = paused;
  };

  @action setDeckIdx = deckIdx => {
    this.deckIdx = deckIdx;
  };

  @action setBackOpacity = backOpacity => {
    this.backOpacity = backOpacity;
  };

  @action setStoryIdx(idx) {
    this.currentStory.idx = idx;
  }

  @action deleteStory = postId => {
    var index = this.stories.findIndex(item => item.postId === postId);
    if (index !== -1) this.stories.splice(index, 1);
    Fire.shared.deletePost(postId);
    this.deleteEventListeners.forEach(listener => {
      if (typeof listener == 'function') {
        listener(postId);
      }
    });
  };

  @action addDeleteEventListener = listener => {
    this.deleteEventListeners.push(listener);
  };

  @action removeDeleteEventListener = listener => {
    var index = this.deleteEventListeners.indexOf(listener);
    if (index !== -1) this.deleteEventListeners.splice(index, 1);
  };

  @action addDismissCarouselEventListener = listener => {
    this.dismissCarouselEventListeners.push(listener);
  };

  @action removeDismissCarouselEventListener = listener => {
    var index = this.dismissCarouselEventListeners.indexOf(listener);
    if (index !== -1) this.dismissCarouselEventListeners.splice(index, 1);
  };

  ///////////////////////////////////
  // Toggle Indicator Animation
  ///////////////////////////////////

  @action pause = () => {
    this.setPaused(true);
    this.indicatorAnim.stopAnimation();
  };

  @action play = () => {
    if (this.paused) {
      this.setPaused(false);
      this.animateIndicator(false);
    }
  };

  @action animateIndicator = (reset = true) => {
    if (reset) this.indicatorAnim.setValue(0);

    const story = this.currentStory;

    if (story == null) return this.onNextDeck();

    requestAnimationFrame(() => {
      Animated.timing(this.indicatorAnim, {
        toValue: 1,
        duration: story.items[story.idx].duration * (1 - this.indicatorAnim._value),
      }).start(({ finished }) => {
        if (finished) this.onNextItem();
      });
    });
  };

  @action resetVerticalSwipe() {
    Animated.spring(this.verticalSwipe, { toValue: 0 }).start();
  }

  ///////////////////////////////////
  // Navigate Story Items
  ///////////////////////////////////

  @action onNextItem = () => {
    if (this.paused) return this.play();

    const story = this.currentStory;

    if (story.idx >= story.items.length - 1) return this.onNextDeck();

    this.animateIndicator();
    this.setStoryIdx(story.idx + 1);
  };

  @action onPrevItem = () => {
    if (this.backOpacity === 1) this.setBackOpacity(0);

    const story = this.currentStory;

    if (story.idx === 0) return this.onPrevDeck();

    this.animateIndicator();
    this.setStoryIdx(story.idx - 1);
  };

  ///////////////////////////////////
  // Navigate Deck Items
  ///////////////////////////////////

  @action onNextDeck() {
    if (this.deckIdx >= this.stories.length - 1) return this.leaveStories();
    this.animateDeck((this.deckIdx + 1) * width, true);
  }

  @action onPrevDeck() {
    if (this.deckIdx === 0) return this.leaveStories();
    this.animateDeck((this.deckIdx - 1) * width, true);
  }

  @action animateDeck(toValue, reset = false) {
    if (reset) {
      this.setDeckIdx(parseInt(toValue / width));
      this.animateIndicator();
    }

    Animated.spring(this.horizontalSwipe, {
      toValue,
      friction: 9,
    }).start();
  }

  ///////////////////////////////////
  // Computed properties
  ///////////////////////////////////

  @computed get currentStory() {
    if (this.stories.length <= 0) return null;
    return this.stories[this.deckIdx];
  }
}

export default new Store();
