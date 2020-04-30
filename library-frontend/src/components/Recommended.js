import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { BOOKS_BY_GENRE, CURRENT_USER } from '../queries';

const Recommended = (props) => {
  const [genre, setGenre] = useState('');
  const userResult = useQuery(CURRENT_USER);
  console.log();
  useEffect(() => {
    if (userResult.data) {
      console.log(userResult.data);
      setGenre(userResult.data.me.favoriteGenre);
    }
  }, [userResult]);
  //   if (userResult.loading) {
  //     return <div>Loading..</div>;
  //   }

  const result = useQuery(BOOKS_BY_GENRE, {
    variables: { genre },
  });

  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>Loading..</div>;
  }

  const books = result.data.allBooks;
  return (
    <div>
      <h2>Recommended for you</h2>
      <p>
        books in yout favorite genre <strong>{genre}</strong>
      </p>
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
    </div>
  );
};

export default Recommended;
