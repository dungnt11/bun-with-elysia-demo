import { Elysia, t } from 'elysia';
import bcrypt from 'bcrypt';
import UserModel from '../models/User';

const SALTROUNDS = 10;

const auth = new Elysia({ prefix: '/api/auth' })
  .guard(
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      })
    },
    (app) => app
      .post('/createAccount', async ({ body, jwt, set }) => {
        const { username, password } = body;
        const passwordHash = bcrypt.hashSync(password, SALTROUNDS);
        const userCreated = await new UserModel({ username, password: passwordHash }).save();
        if (userCreated) {
          const accessToken = await jwt.sign({
            userId: userCreated._id
          });
          set.headers = {
            'X-Authorization': accessToken,
          };
          set.status = 201;
          return { ok: 1 };
        }
      }, {
        beforeHandle: async ({ body, set }) => {
          const { username } = body;
          const isAccountCreated = await UserModel.exists({ username });
          if (isAccountCreated) {
            set.status = 400;
            return {
              ok: 0,
              e: "Tên tài khoản đã tồn tại"
            }
          }
        }
      })
      .post("/login", async ({ body, set, jwt }) => {
        const { username, password } = body;
        const passwordByUsername = await UserModel.findOne({ username }).select('password').lean();
        const isValidPassword = bcrypt.compareSync(password, passwordByUsername?.password);
        if (!isValidPassword) {
          return {
            ok: 0,
            e: "Tên tài khoản hoặc mật khẩu không chính xác"
          }
        }
        const accessToken = await jwt.sign({
          userId: passwordByUsername._id
        });
        set.headers = {
          'X-Authorization': accessToken,
        };
        return { ok: 1 };
      })
  );
export default auth;