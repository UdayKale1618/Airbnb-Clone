const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ✅ IMPORTANT FIX HERE
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});

// ✅ plugin works now
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);