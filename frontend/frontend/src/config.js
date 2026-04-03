// src/config.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_URL;

// Agar aap GraphQL use kar rahe ho toh yeh bhi add kar sakte ho
export const GRAPHQL_URL = `${API_URL}/graphql/`;