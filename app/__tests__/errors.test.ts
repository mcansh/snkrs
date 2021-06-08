import {
  AuthenticationError,
  AuthorizationError,
  EmailTakenJoinError,
  InvalidLoginError,
  NotFoundError,
  UsernameTakenJoinError,
} from '../errors';

describe('Errors', () => {
  test('AuthenticationError exists', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('You must be logged in to access this');
    expect(error.statusCode).toBe(401);
  });

  test('AuthorizationError exists', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('You are not authorized to access this');
    expect(error.statusCode).toBe(403);
  });

  test('NotFoundError exists', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('This could not be found');
    expect(error.statusCode).toBe(404);
  });

  test('InvalidLoginError exists', () => {
    const error = new InvalidLoginError();
    expect(error.message).toBe('Invalid username or password');
    expect(error.statusCode).toBe(401);
  });

  test('EmailTakenJoinError exists', () => {
    const error = new EmailTakenJoinError();
    expect(error.message).toBe('A user with this email already exists');
    expect(error.statusCode).toBe(400);
  });

  test('UsernameTakenJoinError exists', () => {
    const error = new UsernameTakenJoinError();
    expect(error.message).toBe('A user with this username already exists');
    expect(error.statusCode).toBe(400);
  });
});
