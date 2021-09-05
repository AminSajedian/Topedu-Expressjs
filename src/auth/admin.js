import createError from 'http-errors'

export const adminOnly = (req, res, next) => {
  if(req.user.role === "Admin") { // if role is admin we can proceed to the request handler
    next()
  } else { // we trigger a 403 error
    next(createError(403, "Admins only!"))
  }
}