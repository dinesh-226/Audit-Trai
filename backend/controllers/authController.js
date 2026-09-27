const { validationResult } = require("express-validator");

const ApiResponse = require("../utils/ApiResponse");

const authService = require("../services/auth.service");

exports.register = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json(

                new ApiResponse(

                    false,

                    "Validation Failed",

                    errors.array()

                )

            );

        }

        const { username, email, password } = req.body;

        const user = await authService.registerUser(

            username,

            email,

            password

        );

        return res.status(201).json(

            new ApiResponse(

                true,

                "User Registered Successfully",

                {

                    id: user._id,

                    username: user.username,

                    email: user.email,

                    verified: user.isVerified

                }

            )

        );

    }

    catch (error) {

        return res.status(400).json(

            new ApiResponse(

                false,

                error.message

            )

        );

    }

};