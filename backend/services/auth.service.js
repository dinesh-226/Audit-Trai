const User = require("../models/user");
const VerificationToken = require("../models/VerificationToken");
const crypto = require("crypto");
const mailService = require("./mail.service");

const registerUser = async (username, email, password) => {

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const user = await User.create({

        username,

        email,

        password

    });

    const token = crypto.randomBytes(32).toString("hex");

await VerificationToken.create({

    userId: user._id,

    token,

    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),

});

const verificationLink =
`http://localhost:5000/api/auth/verify/${token}`;

await mailService.sendVerificationEmail(

    user.email,

    user.username,

    verificationLink

);

    return user;
};

module.exports = {

    registerUser

};