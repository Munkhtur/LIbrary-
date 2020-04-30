import { useQuery, useMutation } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries';

const AuthorForm = ({ setError, authors }) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');

  const [addBornDate, result] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  const submit = (e) => {
    e.preventDefault();

    addBornDate({ variables: { name, born } });
    setBorn('');
    setName('');
  };

  useEffect(() => {
    if (result.data && result.data.editAuthor === null) {
      setError('Author not found');
    }
  }, [result.data]); // eslint-disable-line

  return (
    <div>
      <h2>Add born year</h2>

      <form onSubmit={submit}>
        <div>
          name
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {authors.map((a) => (
              <option key={a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          Year
          <input
            value={born}
            onChange={({ target }) => setBorn(Number(target.value))}
          />
        </div>
        <button type='submit'>Add born year</button>
      </form>
    </div>
  );
};

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);
  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>Loading..</div>;
  }
  const authors = result.data;

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AuthorForm authors={authors.allAuthors} setError={props.setError} />
    </div>
  );
};

export default Authors;
