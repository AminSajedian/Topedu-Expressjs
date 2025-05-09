import express from "express";
import UserModel from "./schema.js";
import { JWTAuthMiddleware } from "../../auth/middlewares.js";
import { adminOnly } from "../../auth/admin.js";
import { JWTAuthenticate, refreshTokens } from "../../auth/tools.js";
import createError from "http-errors";
import sgMail from "@sendgrid/mail";

const usersRouter = express.Router();

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    await newUser.save();

    const { email, password } = req.body;
    const user = await UserModel.checkCredentials(email, password);
    if (user) {
      const { accessToken, refreshToken } = await JWTAuthenticate(user);
      res.cookie("accessToken", accessToken, {
        sameSite: "none",
        secure: true,
      }); // in production environment you should have sameSite: "none", secure: true
      res.cookie("refreshToken", refreshToken, {
        sameSite: "none",
        secure: true,
      });
      res.status(200).send({ name: user.name, surname: user.surname });
    }
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      next(createError(400, error));
    } else {
      next(createError(500, "An error occurred while saving user"));
    }
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.checkCredentials(email, password);
    if (user) {
      const { accessToken, refreshToken } = await JWTAuthenticate(user);

      res.cookie("accessToken", accessToken, {
        sameSite: "none",
        secure: true,
      }); // in production environment you should have sameSite: "none", secure: true
      res.cookie("refreshToken", refreshToken, {
        sameSite: "none",
        secure: true,
      });
      res.status(200).send({ name: user.name, surname: user.surname });

      // res.status(200).redirect(`http://localhost:3000?accessToken=${req.user.tokens.accessToken}&refreshToken=${req.user.tokens.refreshToken}`)
      // res.cookie("accessToken", req.user.tokens.accessToken, { httpOnly: true }) // in production environment you should have sameSite: "none", secure: true
      // res.cookie("refreshToken", req.user.tokens.refreshToken, { httpOnly: true })
      // res.status(200).redirect("http://localhost:3000/home")
    } else {
      next(createError(401));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/refreshToken", async (req, res, next) => {
  try {
    // actual refresh token is coming from req.cookies
    // 1. Check the validity and integrity of the actual refresh token, if everything is ok we are generating a new pair of access + refresh tokens
    const { newAccessToken, newRefreshToken } = await refreshTokens(
      req.cookies.refreshToken
    );
    res.cookie("accessToken", newAccessToken, {
      sameSite: "none",
      secure: true,
    });
    res.cookie("refreshToken", newRefreshToken, {
      sameSite: "none",
      secure: true,
    });
    // 2. Send back tokens as response
    res.status(200).send();
  } catch (error) {
    next(createError(401, error.message));
  }
});

// ******** Check Connection between Frontend and Backend ************
usersRouter.post("/checkconnection", async (req, res, next) => {
  try {
    res.status(200).send();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
});

// ******** Send Email ************
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

usersRouter.post("/sendemailforpersonalpage", async (req, res, next) => {
  try {
    const { name, emailAddress, message } = req.body;
    const frontendUrl = req.get("origin");

    if (!message) {
      return res.status(400).send({ error: "Message content is required." });
    }

    let subject;
    switch (frontendUrl) {
      case "https://sajedian.com":
        subject = name
          ? `Message from Portfolio sent by ${name}${
              emailAddress ? " with " + emailAddress + " email" : ""
            }`
          : "Portfolio visited";
        break;
      case "https://topedu.vercel.app":
        subject = "Topedu visited";
        break;
      default:
        subject = "Unknown source";
    }

    const msg = {
      to: process.env.RECIPIENT_EMAIL || "mohammadsajedian@gmail.com", // Use environment variable for recipient email
      from: process.env.SENDER_EMAIL || "mohammadsajedian@gmail.com", // Use environment variable for sender email
      subject,
      text: message,
      html: `<div>${message}</div>`,
    };

    await sgMail.send(msg);
    res.status(200).send({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error.message);
    next(createError(500, "Failed to send email. Please try again later."));
  }
});

export default usersRouter;
