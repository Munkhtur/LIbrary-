import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { BOOKS_BY_GENRE } from '../queries';

const Books = (props) => {
  // const [books, setBooks] = useState([]);
  const [genre, setGenre] = useState('');
  // const result = useQuery(ALL_BOOKS);
  const result = useQuery(BOOKS_BY_GENRE, {
    variables: { genre },
  });
  // useEffect(() => {
  //   getBooksByGenre({ variables: { filter } });
  //   setBooks(result.data.allBooks);
  // }, [filter]);

  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>Loading..</div>;
  }
  const books = result.data.allBooks;

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
        <button onClick={() => setGenre('patterns')}>patterns</button>
        <button onClick={() => setGenre('design')}>design</button>
        <button onClick={() => setGenre('refactoring')}>refactoring</button>
        <button onClick={() => setGenre('crime')}>crime</button>
        <button onClick={() => setGenre('classic')}>classic</button>
        <button onClick={() => setGenre('agile')}>agile</button>
        <button onClick={() => setGenre('')}>all genres</button>
      </div>
    </div>
  );
};

export default Books;
