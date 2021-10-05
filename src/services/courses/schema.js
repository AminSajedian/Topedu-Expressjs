import mongoose from "mongoose"

const { Schema, model } = mongoose

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, },
    cover: { type: String, required: true, },
    creater: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    flowsAndActivities: [{ name: { type: String, }, eventKey: { type: String, }, activities: [{ name: { type: String, }, eventKey: { type: String, }, activityContent: { type: String, } },] },],

    participants: {
      admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
      instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
      assistants: [{ type: Schema.Types.ObjectId, ref: "User" }],
      learners: [{ type: Schema.Types.ObjectId, ref: "User" }]
    },
    notEnrolledUsers: {
      instructors: [{ name: { type: String, }, email: { type: String, } }],
      assistants: [{ name: { type: String, }, email: { type: String, } }],
      learners: [{ name: { type: String, }, email: { type: String, } }]
    },
  },
  { timestamps: true }
)

CourseSchema.statics.userType = async function (courseId, userId) {
  const course = await this.findById(courseId)
  if (course) {
    if (course.participants.admins.find(admin => admin.toString() === userId.toString())) return "admin"
    if (course.participants.instructors.find(instructor => instructor.toString() === userId.toString())) return "instructor"
    if (course.participants.assistants.find(assistant => assistant.toString() === userId.toString())) return "assistant"
    if (course.participants.learners.find(learner => learner.toString() === userId.toString())) return "learner"
    else return null
  } else {
    return "not found"
  }
}

export default model("Course", CourseSchema)
