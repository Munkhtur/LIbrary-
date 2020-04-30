const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
  PubSub,
} = require('apollo-server');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Book = require('./models/Book');
const Author = require('./models/Author');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const pubsub = new PubSub();

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

mongoose.set('useFindAndModify', false);

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

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String
    id: ID!
  }

  type Token {
    value: String!
  }
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID
    genres: [String!]!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
    allGenres: [String]
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Book
    addAuthor(name: String!, born: Int): Author
    editAuthor(name: String!, born: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      console.log(args);
      if (!args.author && !args.genre) {
        return Book.find({}).populate('author');
      }
      if (args.author && args.genre) {
        return Book.find({
          author: { $in: [args.author] },
          genres: { $in: [args.genre] },
        }).populate('author');
      } else if (!args.genre) {
        return Book.find({
          author: { $in: [args.author] },
        }).populate('author');
      } else {
        return Book.find({ genres: { $in: [args.genre] } }).populate('author');
      }
    },

    allAuthors: () => {
      return Author.find({});
    },
    me: async (root, args, context) => {
      return context.currentUser;
    },
    allGenres: async () => {
      const arr = await Book.find({}).select('genres');
      return arr;
    },
  },

  Author: {
    bookCount: async (root) => {
      const books = await Book.find({});
      const bc = books.filter((b) => b.author.toString() === root.id);
      const count = bc.length;
      return count;
    },
  },

  Mutation: {
    addBook: async (root, args, { currentUser }) => {
      console.log(args);
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      if (!args.title || !args.author || !args.published || !args.genres) {
        throw new UserInputError('Missing fields', {
          invalidArgs: args,
        });
      }
      let addedAuth;
      const author = await Author.findOne({ name: args.author });
      if (!author) {
        const newAuth = new Author({
          name: args.author,
        });
        addedAuth = await newAuth.save();
        console.log(addedAuth);
      } else {
        addedAuth = { ...author };
      }
      const book = new Book({ ...args, author: addedAuth });

      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      const returnedBook = await Book.findOne({ title: args.title }).populate(
        'author'
      );

      pubsub.publish('BOOK_ADDED', { bookAdded: returnedBook });
      return returnedBook;
    },
    editAuthor: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const auth = await Author.findOne({ name: args.name });
      if (!auth) {
        return null;
      }
      auth.born = args.born;
      try {
        await auth.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return auth;
    },
    createUser: (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });
      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secret') {
        throw new UserInputError('wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
};

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
