const { ApolloServer } = require('apollo-server');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('./models/User');

const jwt = require('jsonwebtoken');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

mongoose.set('useFindAndModify', false);
const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

const MONGODB_URI =
  'mongodb+srv://turu123:turu123@cluster0-vadct.mongodb.net/library?retryWrites=true&w=majority';

console.log('connecting to', MONGODB_URI);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
