import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import institutionModel from "./schema.js"
import UserModel from "../users/schema.js"

const institutionsRouter = express.Router()


institutionsRouter.post("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // creater a new institution by creater (req.user._id)
    req.body.creater = req.user._id
    const newInstitution = new institutionModel(req.body)
    // add user as admin of institution
    newInstitution.participants.admins[0] = req.user._id
    const { _id } = await newInstitution.save()
    res.status(201).send(_id)
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

institutionsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institutions = await institutionModel.find({ $or: [{ "participants.admins": req.user._id }, { "participants.instructors": req.user._id }, { "participants.assistants": req.user._id }, { "participants.learners": req.user._id }] })
    const institutionsNamesAndIds = institutions.map((institution) => {
      return ({ "name": institution.name, "_id": institution._id })
    })
    res.status(200).send(institutionsNamesAndIds)
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

institutionsRouter.get("/:institutionId/courses", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId).populate("courses")
    const userType = await institutionModel.userType(req.params.institutionId, req.user._id)
    if (institution) {
      switch (userType) {
        case "admin":
          res.status(200).send({ "courses": institution.courses, userType })
          break;
        case "instructor":
          res.status(200).send({ "courses": institution.courses.filter((course) => { return (course.participants.instructors.find(instructor => instructor.toString() === req.user._id.toString())) }), userType })
          break;
        case "assistant":
          res.status(200).send({ "courses": institution.courses.filter((course) => { return (course.participants.assistants.find(assistant => assistant.toString() === req.user._id.toString())) }), userType })
          break;
        case "learner":
          res.status(200).send({ "courses": institution.courses.filter((course) => { return (course.participants.learners.find(learner => learner.toString() === req.user._id.toString())) }), userType })
          break;
        default:
          next(createError(404, `user ${req.user._id} not found in this Institution ${req.params.institutionId}`))
      }
    } else {
      next(createError(404, `Institution ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institution"))
  }
})


// **********************************************************
// **********************************************************
// **********************************************************
// **********************************************************
// **********************************************************


// // get Courses of Institution for creater
// if (req.user._id.toString() === institution.creater.toString()) {
//   res.send({ "courses": institution.courses, "userType": "creater" })
// }
// // get Courses of Institution for instructor 
// else if (institution.instructors.find(instructor => instructor.toString() === req.user._id.toString())) {
//   res.send({ "courses": institution.courses, "userType": "instructor" })
// }
// // get Courses of Institution for assistant 
// else if (institution.assistants.find(assistant => assistant.toString() === req.user._id.toString())) {
//   const coursesForAssistant =
//     res.send({ "courses": coursesForAssistant, "userType": "assistant" })
// }
// // get Courses of Institution for learner 
// else if (institution.learners.find(learner => learner.toString() === req.user._id.toString())) {
//   const coursesForLearner =
//     res.send({ "courses": coursesForLearner, "userType": "learner" })
// }


institutionsRouter.get("/:institutionId/participants", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId).populate("participants.admins").populate("participants.instructors").populate("participants.assistants").populate("participants.learners")
    if (institution) {
      res.send(institution)
    } else {
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institutions"))
  }
})

institutionsRouter.get("/:institutionId/join/:userId", async (req, res, next) => {
  try {
    const institutionId = req.params.institutionId
    const userId = req.params.userId
    const institution = await institutionModel.findById(institutionId).populate("users")

    res.send(institution)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institutions"))
  }
})

// next(createError(401, "Forbidden"))
// const institutionForOwner = await institutionModel.findById(institutionId).populate("owner").populate("instructors").populate("learners").populate("assistants").populate("courses")

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
