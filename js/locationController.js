import config from "./config.js";

export const getAreaName = async (code) => {
  const res = await fetch(`${config.API_BASE_URL}/location/area?code=${code}`);
  const json = await res.json();
  return json.data;
};
