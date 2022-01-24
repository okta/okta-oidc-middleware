const connectUtil = require('../../src/connectUtil.js');

jest.mock('csurf', function () {
  return function () {

  }
});

var mockAuthenticate;
jest.mock('passport', function () {
  mockAuthenticate = jest.fn().mockReturnValue(() => {})
  return {
    authenticate: mockAuthenticate
  }
})



describe('connectUtil', function () {
  describe('createLoginHandler', function () {
    it('passes known options to passport handler initializer', function () {
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
