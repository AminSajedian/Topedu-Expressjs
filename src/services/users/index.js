import express from "express"
import UserModel from "./schema.js"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import { JWTAuthenticate, refreshTokens } from "../../auth/tools.js"

import createError from "http-errors"

const usersRouter = express.Router()

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)
    await newUser.save()

    const { email, password } = req.body
    const user = await UserModel.checkCredentials(email, password)
    if (user) {
      const { accessToken, refreshToken } = await JWTAuthenticate(user)
      res.cookie("accessToken", accessToken, { sameSite: 'none', secure: true }) // in production environment you should have sameSite: "none", secure: true
      res.cookie("refreshToken", refreshToken, { sameSite: 'none', secure: true })
      res.status(200).send({ "name": user.name, "surname": user.surname })
    }
  } catch (error) {
    console.log(error)
    if (error.name === "ValidationError") {
      next(createError(400, error))
    } else {
      next(createError(500, "An error occurred while saving user"))
    }
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await UserModel.checkCredentials(email, password)
    if (user) {
      const { accessToken, refreshToken } = await JWTAuthenticate(user)

      res.cookie("accessToken", accessToken, { sameSite: 'none', secure: true }) // in production environment you should have sameSite: "none", secure: true
      res.cookie("refreshToken", refreshToken, { sameSite: 'none', secure: true })
      res.status(200).send({ "name": user.name, "surname": user.surname })

      // res.status(200).redirect(`http://localhost:3000?accessToken=${req.user.tokens.accessToken}&refreshToken=${req.user.tokens.refreshToken}`)
      // res.cookie("accessToken", req.user.tokens.accessToken, { httpOnly: true }) // in production environment you should have sameSite: "none", secure: true
      // res.cookie("refreshToken", req.user.tokens.refreshToken, { httpOnly: true })
      // res.status(200).redirect("http://localhost:3000/home")
    } else {
      next(createError(401))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/refreshToken", async (req, res, next) => {
  try {
    // actual refresh token is coming from req.cookies
    // 1. Check the validity and integrity of the actual refresh token, if everything is ok we are generating a new pair of access + refresh tokens
    const { newAccessToken, newRefreshToken } = await refreshTokens(req.cookies.refreshToken)
    res.cookie("accessToken", newAccessToken, { sameSite: 'none', secure: true })
    res.cookie("refreshToken", newRefreshToken, { sameSite: 'none', secure: true })
    // 2. Send back tokens as response
    res.status(200).send()
  } catch (error) {
    next(createError(401, error.message))
  }
})

// usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const user = await UserModel.findById(req.user._id)
//     res.send(user)
//   } catch (error) {
//     next(error)
//   }
// })



// usersRouter.put("/register/institution", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     console.log('req.user.institutions:', req.user.institutions)
//     const newInstitutions = [...req.user.institutions, req.body.institutionId]
//     req.user.institutions = newInstitutions

//     const user = await UserModel.findByIdAndUpdate(req.user._id, req.user, {
//       runValidators: true,
//       new: true,
//     })
//     if (user) {
//       res.send(user)
//     } else {
//       next(createError(404, `User ${req.user._id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while modifying user"))
//   }
// })



// usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     await req.user.deleteOne()
//   } catch (error) {
//     next(error)
//   }
// })

// usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const user = await UserModel.findByIdAndUpdate(req.user._id, req.body, {
//       runValidators: true,
//       new: true,
//     })
//     if (user) {
//       res.send(user)
//     } else {
//       next(createError(404, `User ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while modifying user"))
//   }
// })





export default usersRouter
