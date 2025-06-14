const { default: mongoose } = require("mongoose");
const otpEmailVerificationSchema = new mongoose.Schema({
  email: String,
  otp: String
});
const email_otp_model = mongoose.model('email_otp', otpEmailVerificationSchema);
module.exports = {email_otp_model}
