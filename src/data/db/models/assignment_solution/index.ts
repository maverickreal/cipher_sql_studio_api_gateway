import { Schema, InferSchemaType, Model, model } from "mongoose";
import { z } from "zod/v4";

const AssignmentSolutionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      unique: true,
    },
    solutionSql: { type: String, required: false, minLength: 1 },
    validationSql: { type: String, required: false, minLength: 1 },
    initSql: { type: String, required: true, minLength: 1 },
    orderMatters: { type: Boolean, required: true },
  },
  { timestamps: true },
);

const AssignmentSolutionValidatorSchema = {
  solutionSql: z.string().nonempty().optional(),
  validationSql: z.string().nonempty().optional(),
  initSql: z.string().nonempty().nonoptional(),
  orderMatters: z.boolean().nonoptional(),
};

type IAssignmentSolution = InferSchemaType<typeof AssignmentSolutionSchema>;

type AssignmentSolutionModel = Model<IAssignmentSolution>;

const AssignmentSolution = model<IAssignmentSolution, AssignmentSolutionModel>(
  "AssignmentSolution",
  AssignmentSolutionSchema,
);

export { AssignmentSolution, AssignmentSolutionValidatorSchema };
