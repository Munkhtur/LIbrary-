const {
  gql,
  UserInputError,
  AuthenticationError,
  PubSub,
} = require('apollo-server');
const jwt = require('jsonwebtoken');
const Book = require('./models/Book');
const Author = require('./models/Author');
const User = require('./models/User');

const pubsub = new PubSub();

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

module.exports = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, { genre, author }) => {
      let query = {};
      if (author) {
        const theAuthor = await Author.findOne({ name: author });
        query.author = theAuthor.id;
      }

      if (genre) {
        query.genres = { $in: [genre] };
      }
      console.log(query);
      return Book.find(query).populate('author');
      // if (!args.author && !args.genre) {
      //   return Book.find({}).populate('author');
      // }
      // if (args.author && args.genre) {
      //   return Book.find({
      //     author: { $in: [args.author] },
      //     genres: { $in: [args.genre] },
      //   }).populate('author');
      // } else if (!args.genre) {
      //   return Book.find({
      //     author: { $in: [args.author] },
      //   }).populate('author');
      // } else {
      //   return Book.find({ genres: { $in: [args.genre] } }).populate('author');
      // }
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
