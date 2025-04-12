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

CourseSchema.statics.getNotEnrolledUserType = async function (courseId, userId) {
  const course = await this.findById(courseId)
  if (course) {
    if (course.notEnrolledUsers.instructors.find(instructor => instructor._id.toString() === userId.toString())) return "instructor"
    if (course.notEnrolledUsers.assistants.find(assistant => assistant._id.toString() === userId.toString())) return "assistant"
    if (course.notEnrolledUsers.learners.find(learner => learner._id.toString() === userId.toString())) return "learner"
    else return null
  } else {
    return "not found"
  }
}

CourseSchema.statics.getNotEnrolledUser = async function (courseId, userId, userType) {
  const course = await this.findById(courseId)
  if (userType === "learner") { const learner = course.notEnrolledUsers.learners.find(learner => learner._id.toString() === userId.toString()); return learner; }
  if (userType === "assistant") { const assistant = course.notEnrolledUsers.assistants.find(assistant => assistant._id.toString() === userId.toString()); return assistant; }
  if (userType === "instructor") { const instructor = course.notEnrolledUsers.instructors.find(instructor => instructor._id.toString() === userId.toString()); return instructor; }
  else {
    return "not found"
  }
}

CourseSchema.statics.deleteNotEnrolledUser = async function (courseId, userId, userType) {
  const course = await this.findById(courseId)
  if (userType === "learner") {
    const newNotEnrolledLearners = course.notEnrolledUsers.learners.filter((learner, index) => learner._id.toString() !== userId.toString())
    course.notEnrolledUsers.learners = newNotEnrolledLearners
    await course.save();
    return course
  }
  if (userType === "assistant") {
    const newNotEnrolledAssistants = course.notEnrolledUsers.assistants.filter((assistant, index) => assistant._id.toString() !== userId.toString())
    course.notEnrolledUsers.assistants = newNotEnrolledAssistants
    await course.save();
    return course
  }
  if (userType === "instructor") {
    const newNotEnrolledInstructors = course.notEnrolledUsers.instructors.filter((instructor, index) => instructor._id.toString() !== userId.toString())
    course.notEnrolledUsers.instructors = newNotEnrolledInstructors
    await course.save();
    return course
  }
  else {
    return "not found"
  }
}

export default model("Course", CourseSchema)
