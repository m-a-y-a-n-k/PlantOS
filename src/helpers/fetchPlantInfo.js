async function getToken() {
  const params = {
    origin: window.location.origin,
    ip: window.location.ip,
    token: process.env.REACT_APP_TOKEN,
  };
  const response = await fetch("https://trefle.io/api/auth/claim", {
    method: "post",
    body: JSON.stringify(params),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
  const { token } = await response.json();
  return token;
}

export async function fetchPlantInfo(plantLabel) {
  const token = await getToken();
  const response = await fetch(
    `https://trefle.io/api/v1/plants?token=${token}`,
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
  const plants = await response.json();
  return plants.find(({ label }) => label === plantLabel);
}
