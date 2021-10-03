import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import CourseModel from "./schema.js"
import institutionModel from "../institutions/schema.js"
import { fileUpload } from '../../utils/upload/index.js';
import UserModel from "../users/schema.js"

const coursesRouter = express.Router()

coursesRouter.post("/:institutionId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
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

coursesRouter.post("/:courseId/join/:notEnrolledUserId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
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

coursesRouter.post("/:courseId/invitation", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId)
    const institution = await institutionModel.findOne({ courses: req.params.courseId })
    if (course) {
      const user = await UserModel.findOne({ "email": req.body.email })
      if (user) {
        switch (req.body.role) {
          case "Learner":
            if (!(course.learners.find(learner => learner.toString() === user._id.toString()))) { course.learners.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.learners.find(learner => learner.toString() === user._id.toString()))) { institution.learners.push(user._id); await institution.save(); }
            break;
          case "Assistant":
            if (!(course.assistants.find(assistant => assistant.toString() === user._id.toString()))) { course.assistants.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.assistants.find(assistant => assistant.toString() === user._id.toString()))) { institution.assistants.push(user._id); await institution.save(); }
            break;
          case "Instructor":
            if (!(course.instructors.find(instructor => instructor.toString() === user._id.toString()))) { course.instructors.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.instructors.find(instructor => instructor.toString() === user._id.toString()))) { institution.instructors.push(user._id); await institution.save(); }
            break;
          default: next(createError(400))
        }
        res.status(201).send({ message: "User added to the course" })
      } else {
        switch (req.body.role) {
          case "Learner":
            if (!(course.notEnrolledLearners.find(notEnrolledLearner => (notEnrolledLearner.email === req.body.email)))) { course.notEnrolledLearners.push(req.body); await course.save(); }
            const newCourseForLearner = await CourseModel.findById(req.params.courseId)
            const Learner = newCourseForLearner.notEnrolledLearners.find(notEnrolledLearner => (notEnrolledLearner.email === req.body.email))
            res.status(201).send(Learner); break;
          case "Assistant":
            if (!(course.notEnrolledAssistants.find(notEnrolledAssistant => (notEnrolledAssistant.email === req.body.email)))) { course.notEnrolledAssistants.push(req.body); await course.save(); }
            const newCourseForAssistant = await CourseModel.findById(req.params.courseId)
            const Assistant = newCourseForAssistant.notEnrolledAssistants.find(notEnrolledAssistant => (notEnrolledAssistant.email === req.body.email))
            res.status(201).send(Assistant); break;
          case "Instructor":
            if (!(course.notEnrolledInstructors.find(notEnrolledInstructor => (notEnrolledInstructor.email === req.body.email)))) { course.notEnrolledInstructors.push(req.body); await course.save(); }
            const newCourseForInstructor = await CourseModel.findById(req.params.courseId)
            const Instructor = newCourseForInstructor.notEnrolledInstructors.find(notEnrolledInstructor => (notEnrolledInstructor.email === req.body.email))
            res.status(201).send(Instructor); break;
          default: next(createError(400))
        }
      }
    } else {
      next(createError(404, `course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

coursesRouter.get("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId)
    if (course) {
      // get Courses for owner
      if (course.owner.toString() === req.user._id.toString()) {
        res.status(200).send({ "course": course, "userType": "owner" })
      }
      // get Courses for instructor 
      else if (course.instructors.find(instructor => instructor.toString() === req.user._id.toString())) {
        res.send({ "course": course, "userType": "instructor" })
      }
      // get Courses for assistant 
      else if (course.assistants.find(assistant => assistant.toString() === req.user._id.toString())) {
        // const courseForAssistant = course.filter((course) => { return (course.assistants.find(assistant => assistant.toString() === req.user._id.toString())) })
        res.send({ "course": course, "userType": "assistant" })
      }
      // get Courses for learner 
      else if (course.learners.find(learner => learner.toString() === req.user._id.toString())) {
        // const courseForLearner = course.filter((course) => { return (course.learners.find(learner => learner.toString() === req.user._id.toString())) })
        res.send({ "course": course, "userType": "learner" })
      }
    } else {
      next(createError(404, `Course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting courses"))
  }
})

coursesRouter.get("/:courseId/participants", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId).populate("owner").populate("instructors").populate("assistants").populate("learners")
    if (course) {
      res.send(course)
    } else {
      next(createError(404, `Course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting courses"))
  }
})

coursesRouter.put("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findByIdAndUpdate(req.params.courseId, req.body, {
      runValidators: true,
      new: true,
    })
    if (course) {
      res.send(course)
    } else {
      next(createError(404, `Course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying course"))
  }
})

coursesRouter.delete("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await CourseModel.findByIdAndDelete(req.params.courseId)
    if (course) {
      const institution = await institutionModel.findById(req.body.institutionId)
      if (institution) {
        const newCourses = institution.courses.filter((course) => { return (course.toString() !== req.params.courseId.toString()) })
        institution.courses = newCourses
        await institution.save()
        res.status(204).send()
      }
    } else {
      next(createError(404, `Course with ID ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

coursesRouter.post("/upload/image", JWTAuthMiddleware, fileUpload.single("image"), async (req, res, next) => {
  try {
    res.send(req.file);
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
});




// coursesRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     console.log('req.user._id:', req.user._id)
//     const courses = await CourseModel.find({ users: req.user._id.toString() }).populate("users")
//     res.send(courses)
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting courses"))
//   }
// })

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





export default coursesRouter
