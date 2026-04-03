import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import API_URL from './config';     // ← Yeh line add ki hai

const client = new ApolloClient({
  link: new HttpLink({
    uri: `${API_URL}/graphql/`,     // ← Yeh line change ho gayi
  }),
  cache: new InMemoryCache(),
});

export default client;