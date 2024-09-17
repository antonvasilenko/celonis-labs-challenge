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
