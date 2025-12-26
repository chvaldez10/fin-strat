export async function getUserById(id: string) {
  // TODO: Implement user query logic
  return {
    id,
    email: "user@example.com",
    name: "John Doe",
    createdAt: new Date(),
  };
}

export async function getCurrentUser() {
  // TODO: Implement current user query logic
  return {
    id: "1",
    email: "user@example.com",
    name: "John Doe",
    createdAt: new Date(),
  };
}

