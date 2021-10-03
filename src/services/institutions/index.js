import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import institutionModel from "./schema.js"
import UserModel from "../users/schema.js"

const institutionsRouter = express.Router()

institutionsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const userAndInstitutions = await UserModel.findById(req.user._id).populate("institutions")
    const institutionsNamesAndIds = userAndInstitutions.institutions.map((institution) => {
      return ({ "name": institution.name, "_id": institution._id })
    })
    res.send(institutionsNamesAndIds)
  } catch (error) {
    next(error)
  }
})

// next(createError(401, "Forbidden"))
// const institutionForOwner = await institutionModel.findById(institutionId).populate("owner").populate("instructors").populate("learners").populate("assistants").populate("courses")

institutionsRouter.get("/:institutionId/courses", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institutionWithCourses = await institutionModel.findById(req.params.institutionId).populate("courses")
    const courses = institutionWithCourses.courses

    // get Courses of Institution for owner
    if (req.user._id.toString() === institutionWithCourses.owner.toString()) {
      res.send({ "courses": courses, "userType": "owner" })
    }
    // get Courses of Institution for instructor 
    else if (institutionWithCourses.instructors.find(instructor => instructor.toString() === req.user._id.toString())) {
      res.send({ "courses": courses, "userType": "instructor" })
    }
    // get Courses of Institution for assistant 
    else if (institutionWithCourses.assistants.find(assistant => assistant.toString() === req.user._id.toString())) {
      const coursesForAssistant = courses.filter((course) => { return (course.assistants.find(assistant => assistant.toString() === req.user._id.toString())) })
      res.send({ "courses": coursesForAssistant, "userType": "assistant" })
    }
    // get Courses of Institution for learner 
    else if (institutionWithCourses.learners.find(learner => learner.toString() === req.user._id.toString())) {
      const coursesForLearner = courses.filter((course) => { return (course.learners.find(learner => learner.toString() === req.user._id.toString())) })
      res.send({ "courses": coursesForLearner, "userType": "learner" })
    }
    else {
      next(createError(404, `Institution ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institution"))
  }
})

institutionsRouter.get("/:institutionId/participants", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId).populate("owner").populate("instructors").populate("assistants").populate("learners")
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
