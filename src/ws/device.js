async function getDevices(ws, d) {
  const { data: { store } } = ws;
  console.log(store);
  ws.send({ d });
}

export { getDevices };