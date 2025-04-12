import createError from "http-errors"

import UserModel from "../services/users/schema.js"
import { verifyToken } from "./tools.js"

export const JWTAuthMiddleware = async (req, res, next) => {
  // 1. Check if Authorization header is received, if it is not --> trigger an error (401)
  // if (!req.headers.authorization) {
  //   next(createError(401, "Please provide token in the authorization header!"))
  // } else {
  if (!req.cookies.accessToken) { // IF YOU DON'T USE COOKIE-PARSER REQ.COOKIES WILL BE UNDEFINED!!
    next(createError(401, "Please provide access token!"))
  } else {
    try {
      // 2. Extract the token from authorization header (Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MGVkNWI4N2M0MjM1YTFkZWNhOGY3YzIiLCJpYXQiOjE2MjYyNTI3NTcsImV4cCI6MTYyNjg1NzU1N30.VA7M1z2LRAilFGLt1grvEIdv1VI2WUwpGWo_N0yzodg)
      // const token = req.headers.authorization.replace("Bearer ", "")

      // 3. Verify the token (decode it)

      const content = await verifyToken(req.cookies.accessToken)

      // 4. Find user in db and attach him/her to the request object

      const user = await UserModel.findById(content._id)

      if (user) {
        req.user = user
        next()
      } else {
        next(createError(404, "User not found!"))
      }
    } catch (error) {
      next(createError(401, "Token not valid!"))
    }
  }
}
