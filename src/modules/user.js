import { Elysia, t } from 'elysia';

const user = new Elysia({ prefix: '/api/user' })
  .get("/me", ({ user }) => {
    return {
      ok: 1,
      d: user,
    }
  });

export default user;