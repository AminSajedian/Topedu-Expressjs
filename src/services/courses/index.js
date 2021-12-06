import sgMail from '@sendgrid/mail'
import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { fileUpload } from '../../utils/upload/index.js'
import institutionModel from "../institutions/schema.js"
import UserModel from "../users/schema.js"
import courseModel from "./schema.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const FrontendURL = process.env.FRONTEND_REMOTE_URL || process.env.FRONTEND_LOCAL_URL

const coursesRouter = express.Router()

// Create a new course with institutionId
coursesRouter.post("/:institutionId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
    if (institution) {
      const newCourse = new courseModel(req.body)
      newCourse.creater = req.user._id
      newCourse.participants.admins[0] = req.user._id
      const { _id } = await newCourse.save()
      institution.courses.push(_id)
      await institution.save()
      res.status(201).send(_id)
    } else {
      next(createError(404, `Institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(createError(500, "An error occurred while creating a course"))
  }
})

// Get the course with courseId
coursesRouter.get("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId)
    const userType = await courseModel.userType(req.params.courseId, req.user._id)
    if (course) {
      switch (userType) {
        case "admin": res.status(200).send({ course, userType }); break;
        case "instructor": res.status(200).send({ course, userType }); break;
        case "assistant": res.status(200).send({ course, userType }); break;
        case "learner": res.status(200).send({ course, userType }); break;
        default: next(createError(404, `user ${req.user._id} not found in this course ${req.params.courseId}`))
      }
    } else {
      next(createError(404, `course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(createError(500, "An error occurred while getting courses"))
  }
})

// Manipulate the course with courseId
coursesRouter.put("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId)
    const userType = await courseModel.userType(req.params.courseId, req.user._id)
    if (course) {
      switch (userType) {
        case "admin": const updateCourseForAdmin = await courseModel.findByIdAndUpdate(req.params.courseId, req.body, { runValidators: true, new: true, });
          res.status(200).send(updateCourseForAdmin); break;
        case "instructor": const updateCourseForInstructor = await courseModel.findByIdAndUpdate(req.params.courseId, req.body, { runValidators: true, new: true, });
          res.status(200).send(updateCourseForInstructor); break;
        case "assistant": next(createError(401, `Unauthorized user ${req.user._id}`)); break;
        case "learner": next(createError(401, `Unauthorized user ${req.user._id}`)); break;
        default: next(createError(404, `user ${req.user._id} not found in this course ${req.params.courseId}`))
      }
    } else {
      next(createError(404, `Course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying course"))
  }
})

// Delete the course with courseId
coursesRouter.delete("/:courseId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findByIdAndDelete(req.params.courseId)
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

// Change the Coures image
coursesRouter.post("/upload/image", JWTAuthMiddleware, fileUpload.single("image"), async (req, res, next) => {
  try {
    res.send(req.file);
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
});

// Get the participants of the course with courseId
coursesRouter.get("/:courseId/participants", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId).populate("participants.admins").populate("participants.instructors").populate("participants.assistants").populate("participants.learners")
    const userType = await courseModel.userType(req.params.courseId, req.user._id)
    if (course) {
      switch (userType) {
        case "admin": res.status(200).send(course); break;
        case "instructor": res.status(200).send(course); break;
        case "assistant": res.status(200).send(course); break;
        case "learner": res.status(200).send(course); break;
        default: next(createError(404, `user ${req.user._id} not found in this course ${req.params.courseId}`))
      }
    } else {
      next(createError(404, `Course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting courses"))
  }
})

// Invite a participant to the course with courseId
// If the user (Learner/Assistant/Instructor) has already registered in the TopEdu, user will be added to the course
// If the user (Learner/Assistant/Instructor) has not already registered in the TopEdu, UserId and courseId will be sent and invitation link will be created in the frontend
coursesRouter.post("/:courseId/invitation", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId)
    const institution = await institutionModel.findOne({ courses: req.params.courseId })
    if (course) {
      const user = await UserModel.findOne({ "email": req.body.email })
      if (user) {
        switch (req.body.role) {
          case "Learner":
            if (!(course.participants.learners.find(learner => learner.toString() === user._id.toString()))) { course.participants.learners.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.participants.learners.find(learner => learner.toString() === user._id.toString()))) { institution.participants.learners.push(user._id); await institution.save(); }
            break;
          case "Assistant":
            if (!(course.participants.assistants.find(assistant => assistant.toString() === user._id.toString()))) { course.participants.assistants.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.participants.assistants.find(assistant => assistant.toString() === user._id.toString()))) { institution.participants.assistants.push(user._id); await institution.save(); }
            break;
          case "Instructor":
            if (!(course.participants.instructors.find(instructor => instructor.toString() === user._id.toString()))) { course.participants.instructors.push(user._id); await course.save(); } else { res.status(400).send({ message: `User has already been added to the course by this email: ${req.body.email}` }) }
            if (!(institution.participants.instructors.find(instructor => instructor.toString() === user._id.toString()))) { institution.participants.instructors.push(user._id); await institution.save(); }
            break;
          default: next(createError(400))
        }
        res.status(201).send({ message: "User added to the course" })
      } else {
        switch (req.body.role) {
          case "Learner":
            if (!(course.notEnrolledUsers.learners.find(learner => (learner.email === req.body.email)))) { course.notEnrolledUsers.learners.push(req.body); await course.save(); }
            const newCourseForLearner = await courseModel.findById(req.params.courseId)
            const Learner = newCourseForLearner.notEnrolledUsers.learners.find(learner => (learner.email === req.body.email))
            res.status(201).send(Learner); break;
          case "Assistant":
            if (!(course.notEnrolledUsers.assistants.find(assistant => (assistant.email === req.body.email)))) { course.notEnrolledUsers.assistants.push(req.body); await course.save(); }
            const newCourseForAssistant = await courseModel.findById(req.params.courseId)
            const Assistant = newCourseForAssistant.notEnrolledUsers.assistants.find(assistant => (assistant.email === req.body.email))
            res.status(201).send(Assistant); break;
          case "Instructor":
            if (!(course.notEnrolledUsers.instructors.find(instructor => (instructor.email === req.body.email)))) { course.notEnrolledUsers.instructors.push(req.body); await course.save(); }
            const newCourseForInstructor = await courseModel.findById(req.params.courseId)
            const Instructor = newCourseForInstructor.notEnrolledUsers.instructors.find(instructor => (instructor.email === req.body.email))
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

// Get notEnrolledUser of the course with courseId and notEnrolledUserId
coursesRouter.get("/:courseId/notEnrolledUser/:notEnrolledUserId", async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId)
    const userType = await courseModel.getNotEnrolledUserType(req.params.courseId, req.params.notEnrolledUserId)
    if (course) {
      const user = await courseModel.getNotEnrolledUser(req.params.courseId, req.params.notEnrolledUserId, userType)
      res.status(200).send(user);
    } else {
      next(createError(404, `course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(createError(500, "An error occurred while getting courses"))
  }
})

// notEnrolledUser join the course with courseId and notEnrolledUserId
coursesRouter.post("/:courseId/join/:notEnrolledUserId", async (req, res, next) => {
  try {
    let course = await courseModel.findById(req.params.courseId)
    const userType = await courseModel.getNotEnrolledUserType(req.params.courseId, req.params.notEnrolledUserId)
    if (course) {
      const newCourse = await courseModel.deleteNotEnrolledUser(req.params.courseId, req.params.notEnrolledUserId, userType)
      const institution = await institutionModel.findOne({ courses: req.params.courseId })
      console.log('institution:', institution)
      switch (userType) {
        case "learner":
          const learner = new UserModel(req.body);
          const newLearner = await learner.save();
          institution.participants.learners.push(newLearner._id)
          newCourse.participants.learners.push(newLearner._id)
          course = newCourse
          await course.save();
          await institution.save();
          res.status(201).send(newLearner)
          break;
        case "instructor":
          const instructor = new UserModel(req.body);
          const newInstructor = await instructor.save();
          institution.participants.instructors.push(newInstructor._id)
          newCourse.participants.instructors.push(newInstructor._id)
          await course.save();
          res.status(201).send(newInstructor)
          break;
        case "assistant":
          const assistant = new UserModel(req.body);
          const newAssistant = await assistant.save();
          institution.participants.assistants.push(newAssistant._id)
          newCourse.participants.assistants.push(newAssistant._id)
          await course.save();
          res.status(201).send(newAssistant)
          break;
        default: next(createError(404, `user ${req.params.notEnrolledUserId} not found in this course ${req.params.courseId}`))
      }
    } else {
      next(createError(404, `course ${req.params.courseId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

// Send an invitation link via Email to the notEnrolledUser
coursesRouter.post("/:courseId/email/invitation/:userId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const course = await courseModel.findById(req.params.courseId)
    if (course) {
      const user = await UserModel.findOne({ "email": req.body.email })
      if (user) {
        // send email that user added to the course
        const msg1 = {
          to: user.email,
          from: 'mohammadsajedian@gmail.com',
          subject: 'TopEdu Course Notification',
          text: `Hello, You have been added to the ${course.title} coures`,
          html: `<div>Hello, You have been added to the <strong>${course.title}</strong> coures</div>`,
        };
        // Send Email
        try {
          await sgMail.send(msg1);
          res.status(200).send();
        } catch (error) {
          console.log(error);
        }
      } else {
        // send email that user invited to the course
        const msg2 = {
          to: req.body.email,
          from: 'mohammadsajedian@gmail.com',
          subject: 'TopEdu Course Invitation',
          text: `Hello, You have been invited to the ${course.title} coures use this link to join the course ${FrontendURL}/join/course/${course._id}/${req.params.userId}`,
          html: `<div>Hello, You have been invited to the <strong>${course.title}</strong> coures use this link to join the course in TopEdu: <a href="${FrontendURL}/join/course/${course._id}/${req.params.userId}">${FrontendURL}/join/course/${course._id}/${req.params.userId}</a></div>`,
        };
        // Send Email
        try {
          await sgMail.send(msg2);
          res.status(200).send();
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      next(createError(404, `course ${req.params.courseId} not found`))
    }
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
});




// coursesRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     console.log('req.user._id:', req.user._id)
//     const courses = await courseModel.find({ users: req.user._id.toString() }).populate("users")
//     res.send(courses)
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting courses"))
//   }
// })

// coursesRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     console.log('req.user._id:', req.user._id)
//     const courses = await courseModel.find({ users: req.user._id.toString() }).populate("users")
//     res.send(courses)
//   } catch (error) {
//     console.log(error)
//     next(createError(500, "An error occurred while getting courses"))
//   }
// })

// coursesRouter.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
//   try {
//     const id = req.params.id
//     const course = await courseModel.findById(id).populate("users")
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
