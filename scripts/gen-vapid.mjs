// Prints a new pair of VAPID keys for push notifications. Run once: npm run vapid
import webpush from 'web-push';
const k = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=' + k.publicKey);
console.log('VAPID_PRIVATE_KEY=' + k.privateKey);
