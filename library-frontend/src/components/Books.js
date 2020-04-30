import React, { useState, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { BOOKS_BY_GENRE } from '../queries';
import _ from 'lodash';

const Books = (props) => {
  const [books, setBooks] = useState([]);
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState('');
  const result = useQuery(BOOKS_BY_GENRE);
  const [genreBooks, genreBooksResult] = useLazyQuery(BOOKS_BY_GENRE);

  useEffect(() => {
    console.log('all efect');
    if (result.data && result.data.allBooks && !genre) {
      const books = result.data.allBooks;
      setBooks(books);
      const genres = _.uniq(books.flatMap((b) => b.genres));
      setGenres(genres);
    }
  }, [result.data, genre]);

  useEffect(() => {
    console.log('genre effect');
    if (genreBooksResult.data) {
      setBooks(genreBooksResult.data.allBooks);
    }
  }, [genreBooksResult.data]);

  if (!props.show || !books) {
    return null;
  }
  if (result.loading) {
    return <div>Loading..</div>;
  }

  const onGenreClick = (newGenre) => {
    setGenre(newGenre);
    genreBooks({ variables: { genre: newGenre } });
  };

  return (
    <div>
      <h2>books</h2>
      {genre !== '' && (
        <p>
          in genre <strong>{genre}</strong>
        </p>
      )}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {genres.map((g) => (
          <button key={g} onClick={() => onGenreClick(g)}>
            {g}
          </button>
        ))}
        <button onClick={() => onGenreClick(null)}>all genres</button>
      </div>
    </div>
  );
};

export default Books;
