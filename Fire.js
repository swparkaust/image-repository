import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import uuid from 'uuid';

import deleteMedia from './utils/deleteMedia';
import getFileExtension from './utils/getFileExtension';
import shrinkImageAsync from './utils/shrinkImageAsync';
import uploadMedia from './utils/uploadMedia';

const firebase = require('firebase');
// Required for side-effects
require('firebase/firestore');

const postsCollectionName = 'posts';
const usersCollectionName = 'users';

class Fire {
  constructor() {
    firebase.initializeApp({
      apiKey: "AIzaSyAP4MZr0sA5UycmnDzcmcajC60t99q8hts",
      authDomain: "image-repository-b7fcf.firebaseapp.com",
      projectId: "image-repository-b7fcf",
      storageBucket: "image-repository-b7fcf.appspot.com",
      messagingSenderId: "486605489798",
      appId: "1:486605489798:web:ee2b8dda33ac0259a0f307"
    });

    // Listen for auth
    firebase.auth().onAuthStateChanged(async user => {
      if (!user) {
      }
    });
  }

  registerForPushNotificationsAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    // only asks if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    // On Android, permissions are granted on app installation, so
    // `askAsync` will never prompt the user

    // Stop here if the user did not grant permissions
    if (status !== 'granted') {
      return;
    }

    // Get the token that identifies this device
    let token = await Notifications.getExpoPushTokenAsync();

    this.usersCollection.doc(this.uid).update({
      expoToken: token,
    });
  };

  // Download Data
  getPaged = async ({ size, start, userId = '' }) => {
    let ref = this.postsCollection.orderBy('timestamp', 'desc').limit(size);
    if (userId !== '') {
      ref = this.usersCollection
        .doc(userId)
        .collection(postsCollectionName)
        .orderBy('timestamp', 'desc')
        .limit(size);
    }
    try {
      if (start) {
        ref = ref.startAfter(start);
      }

      const querySnapshot = await ref.get();
      const data = [];
      querySnapshot.forEach(function(doc) {
        if (doc.exists) {
          const post = doc.data() || {};

          // Reduce the name
          const user = post.user || {};

          const name = user;
          const reduced = {
            key: doc.id,
            name: (name || 'Secret Duck').trim(),
            ...post,
          };
          data.push(reduced);
        }
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      return { data, cursor: lastVisible };
    } catch ({ message }) {
      alert(message);
    }
  };

  getPost = async postId => {
    let ref = this.postsCollection.doc(postId);
    try {
      const doc = await ref.get();
      if (doc.exists) {
        const post = doc.data() || {};

        // Reduce the name
        const user = post.user || {};

        const name = user;
        const reduced = {
          key: doc.id,
          name: (name || 'Secret Duck').trim(),
          ...post,
        };
        return reduced;
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  checkUsernameIsTaken = async username => {
    let ref = this.usersCollection;
    try {
      const doc = await ref.where('username', '==', username).get();
      if (doc.empty) {
        return false;
      } else {
        return true;
      }
    } catch ({ message }) {
      alert(message);
      return true;
    }
  };

  fetchUserInfo = async userId => {
    let ref = this.usersCollection.doc(userId);
    try {
      const doc = await ref.get();
      if (doc.exists) {
        const user = doc.data() || {};

        return user;
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  // Upload Data
  uploadMediaAsync = async uri => {
    const path = `${usersCollectionName}/${this.uid}/${uuid.v4()}.${getFileExtension(uri)}`;
    return uploadMedia(uri, path);
  };

  post = async ({ text, media: localUri, type, duration }) => {
    try {
      const { uri: reducedMedia, width, height } =
        type === 'image' ? await shrinkImageAsync(localUri) : { uri: localUri };

      const remoteUri = await this.uploadMediaAsync(reducedMedia);
      const user = await this.fetchUserInfo(this.uid);
      var postObj = {
        ...(text && { text }),
        uid: this.uid,
        timestamp: this.timestamp,
        ...(type === 'image' && { imageWidth: width, imageHeight: height }),
        ...(type === 'video' && { duration }),
        media: remoteUri,
        user: user.username,
      };
      const ref = this.postsCollection.doc();
      const id = ref.id;
      ref.set(postObj);
      this.usersCollection
        .doc(this.uid)
        .collection(postsCollectionName)
        .doc(id)
        .set(postObj);
    } catch ({ message }) {
      alert(message);
    }
  };

  createUser = async (userId, email, username) => {
    try {
      this.usersCollection.doc(userId).set({
        name: 'Enter name',
        username,
        avatar: '',
        email,
      });
    } catch ({ message }) {
      alert(message);
    }
  };

  updateUserAvatar = async ({ userId, avatar: localUri }) => {
    let ref = this.usersCollection.doc(userId);
    try {
      const doc = await ref.get();
      if (doc.exists) {
        const user = doc.data() || {};

        if (user.avatar !== '') {
          await this.deleteMediaAsync(user.avatar);
        }

        const { uri: reducedImage } = await shrinkImageAsync(localUri);

        const remoteUri = await this.uploadMediaAsync(reducedImage);
        ref.update({
          avatar: remoteUri,
        });
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  updateUserName = async (userId, name) => {
    try {
      this.usersCollection.doc(userId).update({
        name,
      });
    } catch ({ message }) {
      alert(message);
    }
  };

  updateUserUsername = async (userId, username) => {
    try {
      this.usersCollection.doc(userId).update({
        username,
      });
    } catch ({ message }) {
      alert(message);
    }
  };

  deleteMediaAsync = async path => {
    return deleteMedia(path);
  };

  deletePost = async postId => {
    try {
      const ref = this.postsCollection.doc(postId);
      const id = ref.id;
      const doc = await ref.get();
      if (doc.exists) {
        const post = doc.data() || {};

        await this.deleteMediaAsync(post.media);
        ref.delete();
        this.usersCollection
          .doc(this.uid)
          .collection(postsCollectionName)
          .doc(id)
          .delete();
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  // Helpers
  get postsCollection() {
    return firebase.firestore().collection(postsCollectionName);
  }

  get usersCollection() {
    return firebase.firestore().collection(usersCollectionName);
  }

  get uid() {
    return (firebase.auth().currentUser || {}).uid;
  }
  get timestamp() {
    return Date.now();
  }
}

Fire.shared = new Fire();
export default Fire;
