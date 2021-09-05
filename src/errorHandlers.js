export const unAuthorizedHandler = (err, req, res, next) => {
  if(err.status === 401) {
    res.status(401).send(err.message || "You are not logged in!")
  } else {
    next(err)
  }
}

export const forbiddenHandler = (err, req, res, next) => {
  if(err.status === 403) {
    res.status(403).send(err.message || "You are not allowed to do that!")
  } else {
    next(err)
  }
}

export const catchAllErrorHandler = (err, req, res, next) => {
  res.status(500).send("Generic Server Error")
}

export const notFoundErrorHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send(err.message || "Error not found!")
  } else {
    next(err) // I need to pass the error to the next error middleware
  }
}

export const badRequestErrorHandler = (err, req, res, next) => {
  if (err.status === 400) {
    res.status(400).send(err.errors)
  } else {
    next(err)
  }
}


