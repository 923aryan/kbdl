import { Request } from 'express';
import { ZodObject } from 'zod';
export const validate = <T>(schema: ZodObject<any>, req: Request): T => {
  const dataToValidate = {
    body: req.body,
    query: req.query,
    params: req.params,
  };

  return schema.parse(dataToValidate) as T;
};
