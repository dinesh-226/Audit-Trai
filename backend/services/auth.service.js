const User = require("../models/user");

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

    return user;
};

module.exports = {

    registerUser

};