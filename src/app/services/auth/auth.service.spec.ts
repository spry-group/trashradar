import {
  Response,
  ResponseOptions,
  BaseRequestOptions
} from '@angular/http';
import { AuthService } from './auth.service';
import { MockBackend } from '@angular/http/testing';
import { DjangoClientService } from '../django-client/django-client.service';
import { LocalStorageService } from 'ngx-webstorage';
import { Authorization } from './auth.model';

describe('AuthService', () => {
  let mockBackend: MockBackend;
  let authService: AuthService;
  let apiClient: DjangoClientService;
  let storage: LocalStorageService;

  const successBody: Authorization = {
    token: 'token',
  };

  const errorBody = {
    message: 'Username or password invalid'
  };

  const mockResponse = new Response(new ResponseOptions({
    body: JSON.stringify(successBody),
    status: 200,
    statusText: 'Success'
  }));

  const mockResponseLogout = new Response(new ResponseOptions({
    status: 200,
    statusText: 'Success'
  }));

  const mockResponseError = new Response(new ResponseOptions({
    body: JSON.stringify(errorBody),
    status: 401,
    statusText: 'Unauthorized'
  }));

  const data = {
    first_name: 'Jane',
    last_name: 'Doe'
  };

  beforeEach(() => {
    storage = new LocalStorageService();
    mockBackend = new MockBackend();
    apiClient = new DjangoClientService(mockBackend, new BaseRequestOptions());
    authService = new AuthService(apiClient, storage);
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should return the errors if the credentials are incorrect', () => {
    const credentials = { username: 'jane@doe.com', password: 'incorrectPassword' };

    mockBackend.connections.subscribe((connection) => {
      connection.mockError(mockResponseError);
    });

    const observer = jasmine.createSpy('observer');
    authService.user$.subscribe(observer);

    authService.login(credentials).subscribe(
      null,
      (error) => {
        expect(error).toBe(mockResponseError);
        expect(storage.retrieve('user'))
          .toEqual(null, 'User data not saved in storage');
        expect(authService.user$.getValue()).toEqual(null,
          'Subject user$ does not contain initial value');
        expect(observer).toHaveBeenCalledTimes(1);
        expect(observer.calls.argsFor(0)).toContain(null,
          'user$ should call subscribers with an initial value.');
      },
      null
    );

  });

  it('should login users with proper credentials', () => {
    const credentials = { username: 'jane@doe.com', password: 'password' };
    mockBackend.connections.subscribe((connection) => {
      connection.mockRespond(mockResponse);
    });

    const observer = jasmine.createSpy('observer');
    authService.user$.subscribe(observer);

    authService.login(credentials).subscribe((result) => {
      expect(result).toEqual(successBody, 'Response does not match');
      expect(storage.retrieve('user'))
        .toEqual(successBody, 'User data not saved in storage');
      expect(authService.user$.getValue()).toEqual(successBody,
        'Subject user$ does not contain the User');
      expect(observer).toHaveBeenCalledTimes(2);
      expect(observer.calls.argsFor(0)).toContain(null,
          'user$ should call subscribers with an initial value.');
      expect(observer.calls.argsFor(1)).toContain(successBody,
          'user$ should call subscribers on successful login.');
    });
  });

  it('should set the Auth Token when it is created, if the user is already logged in', () => {
    spyOn(apiClient, 'setAuthToken');
    const aNewAuthService = new AuthService(apiClient, storage);
    expect(apiClient.setAuthToken).toHaveBeenCalledWith(successBody.token);
  });

  it('should logout users', () => {
    mockBackend.connections.subscribe((connection) => {
      if (connection.request.url.indexOf('/auth/login/') !== -1 ) {
        connection.mockRespond(mockResponse);
      } else {
        connection.mockRespond(mockResponseLogout);
      }
    });

    const observer = jasmine.createSpy('observer');
    authService.user$.subscribe(observer);
    const credentials = { username: 'jane@doe.com', password: 'password' };
    authService.login(credentials).subscribe(() => {
      // verify we're starting with a logged in user.
      expect(authService.user$.getValue()).toEqual(successBody,
          'Subject user$ does not contain an Authenticated user');
      expect(observer).toHaveBeenCalledTimes(2);
      expect(observer.calls.argsFor(1)).toContain(successBody,
          'user$ does show login event');
      // now logout
      authService.logout();

      expect(storage.retrieve('user'))
        .toEqual(null, 'User data not saved in storage');
      expect(authService.user$.getValue()).toEqual(null,
        'Subject user$ does not contain null');
      expect(observer).toHaveBeenCalledTimes(3);
      expect(observer.calls.argsFor(2)).toContain(null,
        'user$ does not show logout event');
    });
  });

  it('should login and keep user credentials across AuthService instances', () => {
    const credentials = { username: 'jane@doe.com', password: 'password' };
    mockBackend.connections.subscribe((connection) => {
      connection.mockRespond(mockResponse);
    });

    const observer = jasmine.createSpy('observer');
    authService.user$.subscribe(observer);

    authService.login(credentials).subscribe((result) => {
      expect(result).toEqual(successBody, 'Response does not match');
      expect(storage.retrieve('user'))
        .toEqual(successBody, 'User data not saved in storage');
      expect(authService.user$.getValue()).toEqual(successBody,
        'Subject user$ does not contain the User');
      expect(observer).toHaveBeenCalledTimes(2);
      expect(observer.calls.argsFor(0)).toContain(null,
          'user$ should call subscribers with an initial value.');
      expect(observer.calls.argsFor(1)).toContain(successBody,
          'user$ should call subscribers on successful login.');

      const authService2 = new AuthService(apiClient, storage);
      expect(authService2.user$.getValue()).toEqual(successBody,
        'Subject user$ does not contain the User in a different instance of AuthService');
      authService.logout();
    });
  });

  it('should register new users', () => {
    const credentials = { email: 'jane@doe.com', username: 'jane@doe.com',
      password: 'password' };
    mockBackend.connections.subscribe((connection) => {
      connection.mockRespond(mockResponse);
    });

    const observer = jasmine.createSpy('observer');
    authService.user$.subscribe(observer);
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observer.calls.argsFor(0)).toContain(null);

    authService.register(credentials).subscribe((result) => {
      expect(result).toEqual(successBody, 'Response does not match');
      expect(storage.retrieve('user'))
        .toEqual(successBody, 'User data not saved in storage');
      expect(authService.user$.getValue()).toEqual(successBody,
        'Subject user$ does not contain the User');
      expect(observer).toHaveBeenCalledTimes(2);
      expect(observer.calls.argsFor(1)).toContain(successBody,
          'user$ does show login event');
    });
  });

});
