// Global in-memory storage
// NOTE: This data is reset if you restart the server!
export const users: any[] = [];

// Helper to find user by ID
export const findUserById = (id: string) => users.find(u => u.id === id);

// Helper to delete user by ID
export const deleteUserById = (id: string) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users.splice(index, 1);
    return true;
  }
  return false;
};