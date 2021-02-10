const functions = require("firebase-functions");
const admin = require("firebase-admin");
const FieldValue = require('firebase-admin').firestore.FieldValue;
admin.initializeApp();
const db = admin.firestore();

exports.onLiveLocation = functions.firestore
  .document("liveLocation/{userId}")
  .onCreate((snapshot, context) => {
    const data = snapshot.data();
    const userId = context.params.userId;
    console.log(data);
    console.log(userId);
  });

//   data cleanup executed when user is deleteted
exports.onUserDelete = functions.firestore
  .document("users/{userId}")
  .onDelete(async (snapshot, context) => {
    const userIdParam = context.params.userId;
    const deletedValue = snapshot.data();
    const userEmail = deletedValue.email;
    // get all the groups is member
    const userGroups = deletedValue.groups

    // loop through the user groups and remove user id from that group members list;
    userGroups.forEach(group=> {
      console.log(group.id);
      // remove user id group group members
      db.collection('groups').doc(group.id).update({
        "members":FieldValue.arrayRemove(userIdParam)
      })
    })

    const contactsRef = admin.firestore().collection('contacts').doc(userIdParam).collection('userContacts');
    const messagesRef = db.collection('messages').doc(userIdParam).collection('userMessages');
    const userLocationRef = db.collection('locationLogs').document(userIdParam).collection('userLocation');

  const userRecord = await  admin.auth().getUserByEmail(userEmail);
  const userId = userRecord.uid;
  // delete user from firebase authentication
  await admin.auth().deleteUser(userId);    
    console.log(`deleting ${context.params.userId}`);

    // delete user contacts 
    const querySnapshot = await contactsRef.get();
    querySnapshot.forEach(doc => {
      if(doc.exists){
        doc.ref.delete(); 
      }
    });
    // delete user messages
    const messageSnapShot = await messagesRef.get();
    messageSnapShot.forEach(doc => {
      if(doc.exists){
        doc.ref.delete();
      }

    });

    // delete user liveLocation history
    const locationSnapShot = await userLocationRef.get();
    locationSnapShot.forEach(doc => {
      if(doc.exists){
        doc.ref.delete();
      }
    });     

      
  });
exports.onMessageSend = functions.firestore
  .document("messages/{userId}/{userMessage}/{messageId}")
  .onCreate(async (snapshot, context) => {
    console.log(`userId id ${context.params.userId}`);
    console.log(`messages ${context.params.userMessage}`);
    console.log(`added message id ${context.params.messageId}`);
    // get user contacts
    const contacts = await db
      .collection("contacts")
      .doc(context.params.userId)
      .collection("userContacts")
      .get();
      contacts.forEach((doc) => {
      console.log(doc.id, "=>", doc.data()['mobile_number']);
    });
  });
