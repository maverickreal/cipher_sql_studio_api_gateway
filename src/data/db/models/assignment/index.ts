import { Schema, InferSchemaType, Model, model } from "mongoose";
import { ASSIGNMENT_DIFFICULTY } from "../../../../utils/constants";
import z from "zod/v4";

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

const AssignmentValidatorSchema = {
  title: z.string().nonempty().nonoptional(),
  description: z.string().nonempty().nonoptional(),
  difficulty: z.enum(ASSIGNMENT_DIFFICULTY).nonoptional(),
  sampleTable: z.string().nonempty().nonoptional(),
  sampleOutput: z.string().nonempty().nonoptional(),
};

type IAssignment = InferSchemaType<typeof AssignmentSchema>;

type AssignmentModel = Model<IAssignment>;

AssignmentSchema.virtual("sandboxDbId").get(function () {
  return `assignment_${this._id}`;
});

const Assignment = model<IAssignment, AssignmentModel>(
  "Assignment",
  AssignmentSchema,
);

export { Assignment, IAssignment, AssignmentValidatorSchema };
