const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { users } = require("./database");

require("dotenv").config();

// Sign up
router.post(
  "/signup",
  [
    check("email", "Invalid email").isEmail(),
    check("password", "Password must be at least 6 chars long").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    // Validate user input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    // Validate if user already exists
    let user = users.find((user) => {
      return user.email === email;
    });

    if (user) {
      // 422 Unprocessable Entity: server understands the content type of the request entity
      // 200 Ok: Gmail, Facebook, Amazon, Twitter are returning 200 for user already exists
      return res.json({
        errors: [
          {
            email: user.email,
            msg: "The user already exists",
          },
        ],
      });
    }

    // Hash password before saving to database
    const salt = await bcrypt.genSalt(10);
    console.log("salt:", salt);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("hashed password:", hashedPassword);

    // Save email and password to database/array
    users.push({
      email,
      password: hashedPassword,
    });
    // console.log(users);

    // Do not include sensitive information in JWT
    const accessToken = await JWT.sign(
      { email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      accessToken,
    });
  }
);

// Get all users
router.get("/users", (req, res) => {
  res.json(users);
});

// Log in
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Look for user email in the database

  let userExist = users.find((user) => {
    return user.email === email;
  });
  console.log(userExist);

  // If user not found, send error message
  if (!userExist) {
    return res.status(400).json({
      errors: [
        {
          msg: "Invalid credentials",
        },
      ],
    });
  }

  // Compare hased password with user password to see if they are valid
  let isMatch = await bcrypt.compare(password, userExist.password);

  if (!isMatch) {
    return res.status(401).json({
      errors: [
        {
          msg: "Email or password is invalid",
        },
      ],
    });
  }

  // Send JWT access token
  const accessToken = await JWT.sign(
    { email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10d",
    }
  );

  // Refresh token

  const refreshToken = await JWT.sign(
    { email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "5d",
    }
  );
  // console.log(refreshToken);
  // Set refersh token in refreshTokens array
  refreshTokens.push(refreshToken);

  res.json({
    accessToken,
    refreshToken,
  });
});

let refreshTokens = [];
// Create new access token from refresh token
// router.post("/token", async (req, res) => {
//   const refreshToken = req.header("x-auth-token");

//   // If token is not provided, send error message
//   if (!refreshToken) {
//     res.status(401).json({
//       errors: [
//         {
//           msg: "Token not found",
//         },
//       ],
//     });
//   }

//   // If token does not exist, send error message
//   if (!refreshTokens.includes(refreshToken)) {
//     res.status(403).json({
//       errors: [
//         {
//           msg: "Invalid refresh token",
//         },
//       ],
//     });
//   }

//   try {
//     const user = await JWT.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET
//     );
//     // user = { email: 'jame@gmail.com', iat: 1633586290, exp: 1633586350 }
//     const { email } = user;
//     const accessToken = await JWT.sign(
//       { email },
//       process.env.ACCESS_TOKEN_SECRET,
//       { expiresIn: "10d" }
//     );
//     res.json({ accessToken });
//   } catch (error) {
//     res.status(403).json({
//       errors: [
//         {
//           msg: "Invalid token",
//         },
//       ],
//     });
//   }
// });

// Deauthenticate - log out
// Delete refresh token
router.delete("/logout", (req, res) => {
  const refreshToken = req.header("x-auth-token");

  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.sendStatus(204);
});

module.exports = router;
