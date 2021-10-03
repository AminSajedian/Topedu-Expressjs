import mongoose from "mongoose"

const { Schema, model } = mongoose

const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, },
    cover: { type: String, },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    owner: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assistants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    learners: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
)

export default model("Institution", InstitutionSchema)
