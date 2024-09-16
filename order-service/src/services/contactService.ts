import { isErrorFromAlias, makeApi, Zodios } from '@zodios/core';
import { z } from 'zod';
import config from '../config';

const Person = z.object({
  city: z.string(),
  country: z.string(),
  extensionFields: z.object({}).partial().passthrough(),
  firstName: z.string(),
  houseNumber: z.string(),
  id: z.string(),
  lastName: z.string(),
  streetAddress: z.string(),
  zip: z.string(),
});

export const schemas = {
  Person,
};

export type Person = z.infer<typeof Person>;

const endpoints = makeApi([
  {
    method: 'get',
    path: '/api/v1/person/:id',
    alias: 'getPerson',
    description: `This function reads a single person from the database.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: Person,
    errors: [
      {
        status: 404,
        description: 'Person not found',
        schema: z.object({
          message: z.string(),
        }),
      },
    ],
  },
]);

export class TimeoutError extends Error {
  constructor() {
    super('Connection timeout');
    this.name = 'TimeoutError';
  }
}

export class NotFoundError extends Error {
  public id: string;
  constructor(id: string) {
    super('Person not found');
    this.id = id;
    this.name = 'NotFoundError';
  }
}

const zodios = new Zodios(config.contractServiceUrl, endpoints, {});

const getPerson = async (id: string): Promise<Person> => {
  try {
    return await zodios.getPerson({ params: { id }, timeout: 3000 });
  } catch (error) {
    if (isErrorFromAlias(zodios.api, 'getPerson', error)) {
      if (error.response.status === 404) {
        console.error('Person not found', id);
        throw new NotFoundError(id);
      }
    }
    if (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') {
      console.error('Connection timeout');
      throw new TimeoutError();
    }
    throw error;
  }
};

export default {
  getPerson,
};
