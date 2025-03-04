export async function getExample() {
  const response = await fetch("http://localhost:3030/api/example");
  return await response.json();
}
