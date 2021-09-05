import mongoose from "mongoose"

const { Schema, model } = mongoose

const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, },
    owner: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    cover: { type: String, required: false, },
    courses: [{ type: Schema.Types.ObjectId, required: false, ref: "Course" }],
    instructors: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
    learners: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
    assistants: [{ type: Schema.Types.ObjectId, required: false, ref: "User" }],
  },
  { timestamps: true }
)

export default model("Institution", InstitutionSchema)
