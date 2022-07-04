import { entrySchema } from "../schemas/schemas.js";

export default function validateEntryData(data) {
    let isDataValid = entrySchema.validate(data).error;
    if (isDataValid === undefined) {
      return true;
    } else {
      return false;
    }
  }