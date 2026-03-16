import { Schema, InferSchemaType, Model, model } from "mongoose";
import { ASSIGNMENT_DIFFICULTY } from "../../../../utils/constants";

const AssignmentSchema = new Schema(
  {
    title: { type: String, required: true, minLength: 1 },
    description: { type: String, required: true, minLength: 1 },
    difficulty: { type: String, required: true, enum: ASSIGNMENT_DIFFICULTY },
    sampleTable: { type: String, required: true, minLength: 1 },
    sampleOutput: { type: String, required: true, minLength: 1 },
  },
  { timestamps: true },
);

type IAssignment = InferSchemaType<typeof AssignmentSchema>;

type AssignmentModel = Model<IAssignment>;

AssignmentSchema.virtual("sandboxDbId").get(function () {
  return `assignment_${this._id}`;
});

const Assignment = model<IAssignment, AssignmentModel>(
  "Assignment",
  AssignmentSchema,
);

export { Assignment, IAssignment };
