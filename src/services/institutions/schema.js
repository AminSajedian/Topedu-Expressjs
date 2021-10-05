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

export default model("Institution", InstitutionSchema)
