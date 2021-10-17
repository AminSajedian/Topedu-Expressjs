import mongoose from "mongoose"

const { Schema, model } = mongoose

const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, },
    cover: { type: String, },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    creater: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    participants: {
      admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
      instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
      assistants: [{ type: Schema.Types.ObjectId, ref: "User" }],
      learners: [{ type: Schema.Types.ObjectId, ref: "User" }]
    },
    pendingUsers: {
      admins: [{ name: { type: String, }, email: { type: String, } }],
      instructors: [{ name: { type: String, }, email: { type: String, } }],
      assistants: [{ name: { type: String, }, email: { type: String, } }],
      learners: [{ name: { type: String, }, email: { type: String, } }]
    },
  },
  { timestamps: true }
)

InstitutionSchema.statics.userType = async function (institutionId, userId) {
  const institution = await this.findById(institutionId)
  if (institution) {
    if (institution.participants.admins.find(admin => admin.toString() === userId.toString())) return "admin"
    if (institution.participants.instructors.find(instructor => instructor.toString() === userId.toString())) return "instructor"
    if (institution.participants.assistants.find(assistant => assistant.toString() === userId.toString())) return "assistant"
    if (institution.participants.learners.find(learner => learner.toString() === userId.toString())) return "learner"
    else return null
  } else {
    return "not found"
  }
}

InstitutionSchema.statics.getPendingUserType = async function (courseId, userId) {
  const course = await this.findById(courseId)
  if (course) {
    if (course.pendingUsers.instructors.find(instructor => instructor._id.toString() === userId.toString())) return "instructor"
    if (course.pendingUsers.assistants.find(assistant => assistant._id.toString() === userId.toString())) return "assistant"
    if (course.pendingUsers.learners.find(learner => learner._id.toString() === userId.toString())) return "learner"
    else return null
  } else {
    return "not found"
  }
}

InstitutionSchema.statics.getPendingUser = async function (courseId, userId, userType) {
  const course = await this.findById(courseId)
  if (userType === "learner") { const learner = course.pendingUsers.learners.find(learner => learner._id.toString() === userId.toString()); return learner; }
  if (userType === "assistant") { const assistant = course.pendingUsers.assistants.find(assistant => assistant._id.toString() === userId.toString()); return assistant; }
  if (userType === "instructor") { const instructor = course.pendingUsers.instructors.find(instructor => instructor._id.toString() === userId.toString()); return instructor; }
  else {
    return "not found"
  }
}

InstitutionSchema.statics.deletePendingUser = async function (courseId, userId, userType) {
  const course = await this.findById(courseId)
  if (userType === "learner") {
    const newNotEnrolledLearners = course.pendingUsers.learners.filter((learner, index) => learner._id.toString() !== userId.toString())
    course.pendingUsers.learners = newNotEnrolledLearners
    await course.save();
    return course
  }
  if (userType === "assistant") {
    const newNotEnrolledAssistants = course.pendingUsers.assistants.filter((assistant, index) => assistant._id.toString() !== userId.toString())
    course.pendingUsers.assistants = newNotEnrolledAssistants
    await course.save();
    return course
  }
  if (userType === "instructor") {
    const newNotEnrolledInstructors = course.pendingUsers.instructors.filter((instructor, index) => instructor._id.toString() !== userId.toString())
    course.pendingUsers.instructors = newNotEnrolledInstructors
    await course.save();
    return course
  }
  else {
    return "not found"
  }
}

export default model("Institution", InstitutionSchema)
