export class AuthenticationError extends Error {
  public name = 'AuthenticationError';
  public statusCode = 401;
  public constructor(message = 'You must be logged in to access this') {
    super(message);
  }
}

export class AuthorizationError extends Error {
  public name = 'AuthorizationError';
  public statusCode = 403;
  public constructor(message = 'You are not authorized to access this') {
    super(message);
  }
}

export class NotFoundError extends Error {
  public name = 'NotFoundError';
  public statusCode = 404;
  public constructor(message = 'This could not be found') {
    super(message);
  }
}

export class InvalidLoginError extends Error {
  public name = 'InvalidLoginError';
  public statusCode = 401;
  public constructor(message = 'Invalid username or password') {
    super(message);
  }
}

export class EmailTakenJoinError extends Error {
  public name = 'EmailTakenJoinError';
  public statusCode = 400;
  public constructor(message = 'A user with this email already exists') {
    super(message);
  }
}

export class UsernameTakenJoinError extends Error {
  public name = 'UsernameTakenJoinError';
  public statusCode = 400;
  public constructor(message = 'A user with this username already exists') {
    super(message);
  }
}
