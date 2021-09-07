import express from "express"
import createError from "http-errors"
import { JWTAuthMiddleware } from '../../auth/middlewares.js'
import { adminOnly } from '../../auth/admin.js'
import InstitutionModel from "./schema.js"

const institutionsRouter = express.Router()

institutionsRouter.get("/", JWTAuthMiddleware, adminOnly, async (req, res, next) => {
  try {
    const institutions = await InstitutionModel.find().populate("users")
    res.send(institutions)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institutions"))
  }
})

institutionsRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institutions = await InstitutionModel.find().populate("users")
    res.send(institutions)
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while getting institutions"))
  }
})

// Admin and User can create a new Institution
institutionsRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const newInstitution = new InstitutionModel({ ...req.body, 'owner': req.user._id })
    const { _id } = await newInstitution.save()
    req.user.institutions = [...req.user.institutions, _id]
    res.status(201).send(_id)
  } catch (error) {
    console.log(error.message);
    next(error)
  }
})

// TODO: only participant can see the Institution
institutionsRouter.get("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id
    const institution = await InstitutionModel.findById(id).populate("users")
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

institutionsRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await InstitutionModel.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })
    if (institution) {
      res.send(institution)
    } else {
      next(createError(404, `Institution ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while modifying institution"))
  }
})

institutionsRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const institution = await InstitutionModel.findByIdAndDelete(req.params.id)
    if (institution) {
      res.status(204).send()
    } else {
      next(createError(404, `Institution with ID ${req.params.id} not found`))
    }
  } catch (error) {
    console.log(error)
    next(createError(500, "An error occurred while deleting institution"))
  }
})

export default institutionsRouter
