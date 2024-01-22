import UserModel from '../models/User';

async function isAuthenticatedHttp({ headers, jwt, set }) {
  const token = (headers.authorization || "").split(" ");

  if (!token[1]) {
    set.status = 401;
    return {
      ok: 0,
      e: "Unauthorized",
    }
  }
  const { userId } = await jwt.verify(token[1]);
  if (!userId) {
    set.status = 401;
    return {
      ok: 0,
      e: "Unauthorized",
    }
  }
  const userByID = await UserModel.findById(userId).lean();
  set.user = userByID;
  return {
    user: userByID,
  };
}
async function isAuthenticatedWS({ headers, jwt, set, store }) {
  const token = (headers.authorization || "").split(" ");

  if (token[1]) {
    const { userId } = await jwt.verify(token[1]);
    const userByID = await UserModel.findById(userId).lean();
    store.user = userByID;
    return;
  }
  set.status = 401;
  throw new Error("Unauthorized WS")
}

export { isAuthenticatedHttp, isAuthenticatedWS }