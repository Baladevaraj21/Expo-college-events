const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["college", "student"], default: "student" },
        profilePic: { type: String }, // NEW

        // Social fields
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // OTP fields for login/registration verification
        otp: { type: String },
        otpExpires: { type: Date },
        isVerified: { type: Boolean, default: true },

        // Student specific fields
        college: { type: String },
        department: { type: String },
        year: { type: String },
        rollNo: { type: String },
        regNo: { type: String },
        place: { type: String },
        age: { type: Number },
        gender: { type: String },
        collegeAddress: { type: String },
        mobile: { type: String },
        certificates: [{ type: String }],

        // ID Card fields
        idCardFront: { type: String },
        idCardBack: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
