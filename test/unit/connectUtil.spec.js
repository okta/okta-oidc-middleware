jest.mock('csurf', function () {
  return function () {
  }
});

const mockAuthenticate = jest.fn();
jest.mock('passport', function () {
  return {
    authenticate: mockAuthenticate
  }
})

const connectUtil = require('../../src/connectUtil.js');


describe('connectUtil', function () {
  describe('createLoginHandler', function () {
    it('passes known options to passport handler initializer', function () {
      mockAuthenticate.mockReturnValue(() => {});
      const loginHandler = connectUtil.createLoginHandler({
        options: {
          routes: {
            login: {
            }
          }
        }
      });
      const res = {};
      const req = {
        query: {
          login_hint: 'username@org.org',
          chown_base: true
        }
      };
      
      loginHandler(req, res);
      expect(mockAuthenticate).toBeCalledWith('oidc', {
        login_hint: 'username@org.org'
      });
    });
  });
});
