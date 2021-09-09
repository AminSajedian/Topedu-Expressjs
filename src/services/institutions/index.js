import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import institutionModel from "./schema.js"
import UserModel from "../users/schema.js"

const institutionsRouter = express.Router()

institutionsRouter.get("/me/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id
    const institution = await institutionModel.findById(id).populate("instructors").populate("learners").populate("owner")
    if (institution) {
      res.send(institution)
    } else {
      next(createError(404, `Institution ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institution"))
  }
})

// institutionsRouter.get("/me/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const user = await UserModel.findById(req.user._id).populate("institutions")
//     res.send(user.institutions)
//   } catch (error) {
//     next(error)
//   }
// })

// institutionsRouter.post("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const newInstitution = new institutionModel(req.body)
//     const { _id } = await newInstitution.save()

//     res.status(201).send({ _id })
//   } catch (error) {
//     console.log(error)
//     if (error.name === "ValidationError") {
//       next(createError(400, error))
//     } else {
//       next(createError(500, "An error occurred while saving user"))
//     }
//   }
// })

// institutionsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     await req.user.deleteOne()
//   } catch (error) {
//     next(error)
//   }
// })

// institutionsRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const user = await institutionModel.findByIdAndUpdate(req.user._id, req.body, {
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

// **********************************************************
// **********************************************************
// **********************************************************

// institutionsRouter.get("/", JWTAuthMiddleware, adminOnly, async (req, res, next) => {
//   try {
//     const institutions = await institutionModel.find().populate("users")
//     res.send(institutions)
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting institutions"))
//   }
// })

// institutionsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const newInstitution = new institutionModel({ ...req.body, 'owner': req.user._id })
//     const { _id } = await newInstitution.save()
//     req.user.institutions = [...req.user.institutions, _id]
//     res.status(201).send(_id)
//   } catch (error) {
//     console.log(error.message);
//     next(error)
//   }
// })



// institutionsRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const institution = await institutionModel.findByIdAndUpdate(req.params.id, req.body, {
//       runValidators: true,
//       new: true,
//     })
//     if (institution) {
//       res.send(institution)
//     } else {
//       next(createError(404, `Institution ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while modifying institution"))
//   }
// })

// institutionsRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const institution = await institutionModel.findByIdAndDelete(req.params.id)
//     if (institution) {
//       res.status(204).send()
//     } else {
//       next(createError(404, `Institution with ID ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting institution"))
//   }
// })

export default institutionsRouter
