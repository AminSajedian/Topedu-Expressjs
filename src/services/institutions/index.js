import sgMail from '@sendgrid/mail'
import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import institutionModel from "./schema.js"
import UserModel from "../users/schema.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const FrontendURL = process.env.FRONTEND_CLOUD_URL || FRONTEND_LOCAL_URL

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

// **********************************************************
// **********************************************************
// **********************************************************
// **********************************************************
// **********************************************************

// Invite a participant to the institution with institutionId
// If the user (Learner/Assistant/Instructor) has already registered in the TopEdu, user will be added to the institution
// If the user (Learner/Assistant/Instructor) has not already registered in the TopEdu, UserId and institutionId will be sent and invitation link will be created in the frontend
institutionsRouter.post("/:institutionId/invitation", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
    if (institution) {
      const user = await UserModel.findOne({ "email": req.body.email })
      if (user) {
        switch (req.body.role) {
          case "Learner":
            if (!(institution.participants.learners.find(learner => learner.toString() === user._id.toString()))) { institution.participants.learners.push(user._id); await institution.save(); } else { res.status(400).send({ message: `User has already been added to the institution by this email: ${req.body.email}` }) }
            if (!(institution.participants.learners.find(learner => learner.toString() === user._id.toString()))) { institution.participants.learners.push(user._id); await institution.save(); }
            break;
          case "Assistant":
            if (!(institution.participants.assistants.find(assistant => assistant.toString() === user._id.toString()))) { institution.participants.assistants.push(user._id); await institution.save(); } else { res.status(400).send({ message: `User has already been added to the institution by this email: ${req.body.email}` }) }
            if (!(institution.participants.assistants.find(assistant => assistant.toString() === user._id.toString()))) { institution.participants.assistants.push(user._id); await institution.save(); }
            break;
          case "Instructor":
            if (!(institution.participants.instructors.find(instructor => instructor.toString() === user._id.toString()))) { institution.participants.instructors.push(user._id); await institution.save(); } else { res.status(400).send({ message: `User has already been added to the institution by this email: ${req.body.email}` }) }
            if (!(institution.participants.instructors.find(instructor => instructor.toString() === user._id.toString()))) { institution.participants.instructors.push(user._id); await institution.save(); }
            break;
          default: next(createError(400))
        }
        res.status(201).send({ message: "User added to the institution" })
      } else {
        switch (req.body.role) {
          case "Learner":
            if (!(institution.pendingUsers.learners.find(learner => (learner.email === req.body.email)))) { institution.pendingUsers.learners.push(req.body); await institution.save(); }
            const newinstitutionForLearner = await institutionModel.findById(req.params.institutionId)
            const Learner = newinstitutionForLearner.pendingUsers.learners.find(learner => (learner.email === req.body.email))
            res.status(201).send(Learner); break;
          case "Assistant":
            if (!(institution.pendingUsers.assistants.find(assistant => (assistant.email === req.body.email)))) { institution.pendingUsers.assistants.push(req.body); await institution.save(); }
            const newinstitutionForAssistant = await institutionModel.findById(req.params.institutionId)
            const Assistant = newinstitutionForAssistant.pendingUsers.assistants.find(assistant => (assistant.email === req.body.email))
            res.status(201).send(Assistant); break;
          case "Instructor":
            if (!(institution.pendingUsers.instructors.find(instructor => (instructor.email === req.body.email)))) { institution.pendingUsers.instructors.push(req.body); await institution.save(); }
            const newinstitutionForInstructor = await institutionModel.findById(req.params.institutionId)
            const Instructor = newinstitutionForInstructor.pendingUsers.instructors.find(instructor => (instructor.email === req.body.email))
            res.status(201).send(Instructor); break;
          default: next(createError(400))
        }
      }
    } else {
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

// Manipulate the institution with institutionId
institutionsRouter.put("/:institutionId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
    const userType = await institutionModel.userType(req.params.institutionId, req.user._id)
    if (institution) {
      switch (userType) {
        case "admin": const updateinstitutionForAdmin = await institutionModel.findByIdAndUpdate(req.params.institutionId, req.body, { runValidators: true, new: true, });
          res.status(200).send(updateinstitutionForAdmin); break;
        case "instructor": const updateinstitutionForInstructor = await institutionModel.findByIdAndUpdate(req.params.institutionId, req.body, { runValidators: true, new: true, });
          res.status(200).send(updateinstitutionForInstructor); break;
        case "assistant": next(createError(401, `Unauthorized user ${req.user._id}`)); break;
        case "learner": next(createError(401, `Unauthorized user ${req.user._id}`)); break;
        default: next(createError(404, `user ${req.user._id} not found in this institution ${req.params.institutionId}`))
      }
    } else {
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying institution"))
  }
})

// Send an invitation link via Email to the pendingUser
institutionsRouter.post("/:institutionId/email/invitation/:userId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
    if (institution) {
      const user = await UserModel.findOne({ "email": req.body.email })
      if (user) {
        // send email that user added to the institution
        const msg1 = {
          to: user.email,
          from: 'mohammadsajedian@gmail.com',
          subject: 'TopEdu institution Notification',
          text: `Hello, You have been added to the ${institution.name} institution`,
          html: `<div>Hello, You have been added to the <strong>${institution.name}</strong> institution</div>`,
        };
        // Send Email
        try {
          await sgMail.send(msg1);
          res.status(200).send();
        } catch (error) {
          console.log(error);
        }
      } else {
        // send email that user invited to the institution
        const msg2 = {
          to: req.body.email,
          from: 'mohammadsajedian@gmail.com',
          subject: 'TopEdu institution Invitation',
          text: `Hello, You have been invited to the ${institution.name} institution use this link to join the institution ${FrontendURL}/join/institution/${institution._id}/${req.params.userId}`,
          html: `<div>Hello, You have been invited to the <strong>${institution.name}</strong> institution use this link to join the institution in TopEdu: <a href="${FrontendURL}/join/institution/${institution._id}/${req.params.userId}">${FrontendURL}/join/institution/${institution._id}/${req.params.userId}</a></div>`,
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
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  }
  catch (error) {
    console.log(error.message);
    next(error)
  }
});

// Get pendingUser of the institution with institutionId and pendingUserId
institutionsRouter.get("/:institutionId/pendingUser/:pendingUserId", async (req, res, next) => {
  try {
    const institution = await institutionModel.findById(req.params.institutionId)
    const userType = await institutionModel.getpendingUserType(req.params.institutionId, req.params.pendingUserId)
    if (institution) {
      const user = await institutionModel.getpendingUser(req.params.institutionId, req.params.pendingUserId, userType)
      res.status(200).send(user);
      // switch (userType) {
      //   case "learner":
      //     const learner = await institutionModel.findOne({ "institution.pendingUsers.learners._id": req.params.pendingUserId })
      //     console.log('-----------------------')
      //     console.log('learner:', learner)
      //     res.status(200).send(learner);
      //     break;
      //   case "assistant":
      //     const assistant = await institutionModel.findOne({ "institution.pendingUsers.assistants": req.params.pendingUserId })
      //     res.status(200).send(assistant); break;
      //     break;
      //   case "instructor":
      //     const instructor = await institutionModel.findOne({ "institution.pendingUsers.instructors": req.params.pendingUserId })
      //     res.status(200).send(instructor); break;
      //   default: next(createError(404, `user ${req.params.pendingUserId} not found in this institution ${req.params.institutionId}`))
      // }
    } else {
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(createError(500, "An error occurred while getting institutions"))
  }
})

// pendingUser join the institution with institutionId and pendingUserId
institutionsRouter.post("/:institutionId/join/:pendingUserId", async (req, res, next) => {
  try {
    let institution = await institutionModel.findById(req.params.institutionId)
    const userType = await institutionModel.getpendingUserType(req.params.institutionId, req.params.pendingUserId)
    if (institution) {
      const newinstitution = await institutionModel.deletependingUser(req.params.institutionId, req.params.pendingUserId, userType)
      const institution = await institutionModel.findOne({ institutions: req.params.institutionId })
      console.log('institution:', institution)
      switch (userType) {
        case "learner":
          const learner = new UserModel(req.body);
          const newLearner = await learner.save();
          institution.participants.learners.push(newLearner._id)
          newinstitution.participants.learners.push(newLearner._id)
          institution = newinstitution
          await institution.save();
          await institution.save();
          res.status(201).send(newLearner)
          break;
        case "instructor":
          const instructor = new UserModel(req.body);
          const newInstructor = await instructor.save();
          institution.participants.instructors.push(newInstructor._id)
          newinstitution.participants.instructors.push(newInstructor._id)
          await institution.save();
          res.status(201).send(newInstructor)
          break;
        case "assistant":
          const assistant = new UserModel(req.body);
          const newAssistant = await assistant.save();
          institution.participants.assistants.push(newAssistant._id)
          newinstitution.participants.assistants.push(newAssistant._id)
          await institution.save();
          res.status(201).send(newAssistant)
          break;
        default: next(createError(404, `user ${req.params.pendingUserId} not found in this institution ${req.params.institutionId}`))
      }
    } else {
      next(createError(404, `institution ${req.params.institutionId} not found`))
    }
  } catch (error) {
    console.log(error.message);
    next(error)
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
