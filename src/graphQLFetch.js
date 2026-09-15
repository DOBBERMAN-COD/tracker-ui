import fetch from 'isomorphic-fetch';

function jsonDateReviver(key, value) {
  const dateRegex = /^\d\d\d\d-\d\d-\d\d/;
  if (typeof value === 'string' && dateRegex.test(value)) return new Date(value);
  return value;
}

export default async function graphQLFetch(query, variables = {}, showError = null, cookie = null) {
  const isBrowser = typeof window !== 'undefined';
  const apiEndpoint = isBrowser
    ? (window.ENV && window.ENV.UI_API_ENDPOINT) || '/graphql'
    : process.env.UI_SERVER_API_ENDPOINT || 'http://localhost:3000/graphql';

  try {
    // Convert numeric-looking string variables to numbers so GraphQL Ints
    // receive numeric JSON values instead of strings.
    const safeVars = { ...variables };
    Object.keys(safeVars).forEach((k) => {
      const v = safeVars[k];
      if (typeof v === 'string' && /^\d+$/.test(v)) safeVars[k] = Number(v);
    });

    const headers = {'Content-Type' : 'application/json'};
    if(cookie) headers.Cookie = cookie;
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ query, variables: safeVars }),
    });
    const body = await response.text();
    const result = JSON.parse(body, jsonDateReviver);

    if (result.errors) {
      const error = result.errors[0];
      if (error.extensions && error.extensions.code === 'BAD_USER_INPUT') {
        const exception = error.extensions.exception || {};
        const detailMessages = Array.isArray(exception.errors)
          ? exception.errors
          : [exception.message || error.message];
        const details = detailMessages.join('\n');
        if (showError) showError(`${error.message}${details ? `:\n${details}` : ''}`);
      } else if (showError) {
        showError(`Error in sending data to server: ${error.message}`);
      }
    }
    return result.data;
  } catch (e) {
    if (showError) showError(`Error in sending data to server: ${e.message}`);
    return null;
  }
}
