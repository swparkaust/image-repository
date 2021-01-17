import firebase from 'firebase';

function deleteMedia(remoteUri) {
  const ref = firebase.storage().refFromURL(remoteUri);
  return ref.delete();
}

export default deleteMedia;
