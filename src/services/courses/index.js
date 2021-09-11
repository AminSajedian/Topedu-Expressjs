import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import CourseModel from "./schema.js"
import institutionModel from "../institutions/schema.js"

const coursesRouter = express.Router()

coursesRouter.post("/:insId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.insId)
    if (institution) {
      const newCourse = new CourseModel(req.body)
      newCourse.owner = req.user._id
      const { _id } = await newCourse.save()
      institution.courses.push(_id)
      await institution.save()

      res.status(201).send(_id)
    } else {
      next(createError(404, `Institution ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

coursesRouter.get("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId).populate("instructors").populate("learners").populate("owner")
    res.send(course)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting courses"))
  }
})

// coursesRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     console.log('req.user._id:', req.user._id)
//     const courses = await CourseModel.find({ users: req.user._id.toString() }).populate("users")
//     res.send(courses)
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting courses"))
//   }
// })

// coursesRouter.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const id = req.params.id
//     const course = await CourseModel.findById(id).populate("users")
//     if (course) {
//       res.send(course)
//     } else {
//       next(createError(404, `Course ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting course"))
//   }
// })

// coursesRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const course = await CourseModel.findByIdAndUpdate(req.params.id, req.body, {
//       runValidators: true,
//       new: true,
//     })
//     if (course) {
//       res.send(course)
//     } else {
//       next(createError(404, `Course ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while modifying course"))
//   }
// })

// coursesRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const course = await CourseModel.findByIdAndDelete(req.params.id)
//     if (course) {
//       res.status(204).send()
//     } else {
//       next(createError(404, `Course with ID ${req.params.id} not found`))
//     }
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while deleting course"))
//   }
// })

export default coursesRouter
