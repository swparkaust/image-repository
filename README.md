# Image Repository

Expo & Web Firebase SDK

![screenshot](https://github.com/swparkaust/image-repository/raw/master/img/screenshot.png)
<sup>The preview images were created using 'Previewed' at previewed.app</sup>

## Installation

```sh 
yarn
expo start
```

## Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /posts/{post} {
      allow read: if true
      allow create: if request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }
    
    match /users/{userId} {
      allow read: if true
      allow write: if request.auth.uid == userId
      
      match /posts/{post} {
        allow read: if true
        allow write: if request.auth.uid == userId
      }
    }
  }
}
```
