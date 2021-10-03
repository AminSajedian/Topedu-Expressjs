import mongoose from "mongoose"

const { Schema, model } = mongoose

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, },
    cover: { type: String, required: true, },
    flowsAndActivities: [{ name: { type: String, }, eventKey: { type: String, }, activities: [{ name: { type: String, }, eventKey: { type: String, }, activityContent: { type: String, } },] },],
    owner: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    learners: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assistants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notEnrolledInstructors: [{ name: { type: String, }, email: { type: String, } }],
    notEnrolledLearners: [{ name: { type: String, }, email: { type: String, } }],
    notEnrolledAssistants: [{ name: { type: String, }, email: { type: String, } }],
  },
  { timestamps: true }
)

export default model("Course", CourseSchema)
