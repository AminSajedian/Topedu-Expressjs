import mongoose from "mongoose"

const { Schema, model } = mongoose

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, },
    cover: { type: String, required: true, default: "https://picsum.photos/640/360" },
    content: { type: String, required: false, },
    owner: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    instructors: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
    learners: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
    assistants: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
  },
  { timestamps: true }
)

export default model("Course", CourseSchema)
