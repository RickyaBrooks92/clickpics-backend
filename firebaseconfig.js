const admin = require("firebase-admin");
const serviceAccount = require("./clickpics-backend-firebase-adminsdk-epsi1-2818d6cc90.json"); // Ensure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "clickpics-backend.appspot.com", // Replace with your Firebase Storage bucket
});

const bucket = admin.storage().bucket();

module.exports = bucket;
