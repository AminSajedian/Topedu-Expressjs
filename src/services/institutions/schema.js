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

InstitutionSchema.statics.getPendingUserType = async function (institutionId, userId) {
  const institution = await this.findById(institutionId)
  if (institution) {
    if (institution.pendingUsers.instructors.find(instructor => instructor._id.toString() === userId.toString())) return "instructor"
    if (institution.pendingUsers.assistants.find(assistant => assistant._id.toString() === userId.toString())) return "assistant"
    if (institution.pendingUsers.learners.find(learner => learner._id.toString() === userId.toString())) return "learner"
    else return null
  } else {
    return "not found"
  }
}

InstitutionSchema.statics.getPendingUser = async function (institutionId, userId, userType) {
  const institution = await this.findById(institutionId)
  if (userType === "learner") { const learner = institution.pendingUsers.learners.find(learner => learner._id.toString() === userId.toString()); return learner; }
  if (userType === "assistant") { const assistant = institution.pendingUsers.assistants.find(assistant => assistant._id.toString() === userId.toString()); return assistant; }
  if (userType === "instructor") { const instructor = institution.pendingUsers.instructors.find(instructor => instructor._id.toString() === userId.toString()); return instructor; }
  else {
    return "not found"
  }
}

InstitutionSchema.statics.deletePendingUser = async function (institutionId, userId, userType) {
  const institution = await this.findById(institutionId)
  if (userType === "learner") {
    const newNotEnrolledLearners = institution.pendingUsers.learners.filter((learner, index) => learner._id.toString() !== userId.toString())
    institution.pendingUsers.learners = newNotEnrolledLearners
    await institution.save();
    return institution
  }
  if (userType === "assistant") {
    const newNotEnrolledAssistants = institution.pendingUsers.assistants.filter((assistant, index) => assistant._id.toString() !== userId.toString())
    institution.pendingUsers.assistants = newNotEnrolledAssistants
    await institution.save();
    return institution
  }
  if (userType === "instructor") {
    const newNotEnrolledInstructors = institution.pendingUsers.instructors.filter((instructor, index) => instructor._id.toString() !== userId.toString())
    institution.pendingUsers.instructors = newNotEnrolledInstructors
    await institution.save();
    return institution
  }
  else {
    return "not found"
  }
}

export default model("Institution", InstitutionSchema)
