import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  throw new Error('Razorpay credentials are not configured.');
}

export const razorpay = new Razorpay({ key_id, key_secret });
