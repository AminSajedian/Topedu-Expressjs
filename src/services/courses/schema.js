import mongoose from "mongoose"

const { Schema, model } = mongoose

const CourseSchema = new Schema(
  {
    // category: { type: String, required: true, },
    title: { type: String, required: true, },
    cover: { type: String, required: true, default: "https://picsum.photos/640/360" },
    // readTime: {
    //   value: { type: Number, required: true, },
    //   unit: { type: String, required: true, },
    // },
    users: [{ type: Schema.Types.ObjectId, required: true, ref: "User" }],
    content: { type: String, required: false, },
    // comments: [ { comment: String, rate: Number, date: Date, }, ],
  },
  { timestamps: true }
)

export default model("Course", CourseSchema)
